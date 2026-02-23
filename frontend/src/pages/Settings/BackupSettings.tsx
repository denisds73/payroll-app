import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Save, Upload, Cloud, HardDrive, Play, CheckCircle, 
  AlertCircle, Link, RefreshCw, FolderInput, 
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/card/Card';
import Badge from '../../components/ui/Badge';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import clsx from 'clsx';

export default function BackupSettings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [folderId, setFolderId] = useState('');
  const [credentialsStatus, setCredentialsStatus] = useState<'missing' | 'configured'>('missing');
  const [isConnected, setIsConnected] = useState(false);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [credentialsFile, setCredentialsFile] = useState<File | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    fetchSettings();
    checkAuthCode();
  }, [searchParams]);

  const checkAuthCode = async () => {
    const code = searchParams.get('code');
    if (code) {
      const toastId = toast.loading('Connecting to Google Drive...');
      try {
        await api.post('/backup/callback', { code });
        toast.success('Successfully connected to Google Drive!', { id: toastId });
        setIsConnected(true);
        navigate('/settings', { replace: true });
      } catch (error) {
        toast.error('Failed to connect. Please try again.', { id: toastId });
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const [credResponse, folderResponse, tokenResponse] = await Promise.allSettled([
        api.get('/settings/GOOGLE_DRIVE_CREDENTIALS'),
        api.get('/settings/BACKUP_FOLDER_ID'),
        api.get('/settings/GOOGLE_DRIVE_TOKEN'),
      ]);

      if (credResponse.status === 'fulfilled' && credResponse.value.data) setCredentialsStatus('configured');
      if (folderResponse.status === 'fulfilled' && folderResponse.value.data) setFolderId(folderResponse.value.data.value);
      if (tokenResponse.status === 'fulfilled' && tokenResponse.value.data) setIsConnected(true);
    } catch (error) {
      console.error('Failed to fetch settings', error);
      toast.error('Could not load backup settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleCredentialsUpload = async () => {
    if (!credentialsFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        JSON.parse(content);
        await api.patch('/settings/GOOGLE_DRIVE_CREDENTIALS', { value: content, description: 'Google OAuth Client ID' });
        setCredentialsStatus('configured');
        toast.success('Credentials uploaded successfully');
        setCredentialsFile(null);
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(credentialsFile);
  };

  const handleConnect = async () => {
    try {
      const res = await api.get('/backup/auth-url');
      if (res.data.url) window.location.href = res.data.url;
    } catch (error) {
      toast.error('Failed to initiate login');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.patch('/settings/BACKUP_FOLDER_ID', { value: folderId, description: 'Google Drive Backup Folder ID' });
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackupRunning(true);
    const toastId = toast.loading('Running backup...');
    try {
      const res = await api.post('/backup/trigger');
      if (res.data.googleDriveId) {
        toast.success('Backup complete & uploaded to Drive!', { id: toastId });
      } else {
        toast.success('Local backup created (Cloud skipped)', { id: toastId });
      }
    } catch (error) {
      toast.error('Backup failed', { id: toastId });
    } finally {
      setIsBackupRunning(false);
    }
  };

  if (isLoadingSettings) return <div className="p-6 text-center text-text-secondary">Loading settings...</div>;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col p-6 max-w-5xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-text-primary">Backup & Recovery</h1>
        <p className="text-sm text-text-secondary">Manage your data protection and disaster recovery strategies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        <StatusCard 
          icon={<HardDrive className="w-5 h-5 text-success" />}
          title="Local Backup"
          status="Active"
          detail="On Quit"
          variant="success"
        />
        <StatusCard 
          icon={<Cloud className={clsx("w-5 h-5", isConnected ? "text-info" : "text-text-disabled")} />}
          title="Cloud Backup"
          status={isConnected ? "Connected" : "Not Configured"}
          detail={isConnected ? "Google Drive Ready" : "Setup Required"}
          variant={isConnected ? "info" : "default"}
        />
         <div className="bg-card p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center gap-2">
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary">Quick Action</p>
              <p className="text-xs text-text-disabled">Trigger immediate backup</p>
            </div>
            <Button 
              onClick={handleTriggerBackup} 
              loading={isBackupRunning}
              icon={<Play className="w-4 h-4" />}
            >
              Backup Now
            </Button>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="p-5 h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg"><FolderInput className="w-5 h-5 text-blue-600" /></div>
              <h2 className="text-lg font-semibold">Google Drive Configuration</h2>
            </div>

            <div className="space-y-4">
              <ConfigStep 
                number={1} 
                title="Upload Credentials" 
                isCompleted={credentialsStatus === 'configured'}
                description='Upload the "OAuth Client ID" JSON from Google Cloud Console.'
              >
                 <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={(e) => setCredentialsFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                    <Button onClick={handleCredentialsUpload} disabled={!credentialsFile} icon={<Upload className="w-4 h-4"/>}>
                      Upload
                    </Button>
                 </div>
              </ConfigStep>

              <ConfigStep 
                number={2} 
                title="Connect Account" 
                isCompleted={isConnected}
                description="Authorize the application to access your Google Drive."
                disabled={credentialsStatus !== 'configured'}
              >
                {!isConnected ? (
                  <Button onClick={handleConnect} icon={<Link className="w-4 h-4" />}>Connect with Google</Button>
                ) : (
                   <div className="flex items-center gap-2 text-success font-medium text-sm">
                      <CheckCircle className="w-4 h-4" /> Account Connected
                   </div>
                )}
              </ConfigStep>

              <ConfigStep 
                number={3} 
                title="Set Backup Folder" 
                isCompleted={!!folderId}
                description="Enter the Google Drive folder ID where backups will be stored."
                disabled={!isConnected}
                isLast
              >
                 <div className="flex gap-3 items-center">
                   <input
                     type="text"
                     placeholder="e.g. 1ABC...xyz"
                     value={folderId}
                     onChange={(e) => setFolderId(e.target.value)}
                     className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder:text-gray-400"
                   />
                   <Button onClick={handleSaveSettings} icon={<Save className="w-4 h-4" />}>Save</Button>
                 </div>
              </ConfigStep>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col h-full min-h-0">
           <RestoreSection isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, status, detail, variant }: any) {
  const colors: Record<string, string> = {
    success: 'bg-success/5 border-success/20 text-success',
    info: 'bg-info/5 border-info/20 text-info',
    default: 'bg-gray-50 border-gray-200 text-text-secondary'
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[variant]} flex flex-col gap-0.5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        {icon}
      </div>
      <div className="text-base font-bold">{status}</div>
      <div className="text-xs opacity-75">{detail}</div>
    </div>
  );
}

function ConfigStep({ number, title, description, children, isCompleted, disabled, isLast }: any) {
  return (
    <div className={clsx("flex gap-4", disabled && "opacity-50 grayscale pointer-events-none")}>
       <div className="flex-shrink-0 flex flex-col items-center w-7 relative">
          {!isLast && (
             <div className="absolute top-7 bottom-[-20px] left-1/2 w-0.5 -ml-px bg-gray-200 z-0" />
          )}
          <div className={clsx(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 relative",
            isCompleted ? "bg-success text-white" : "bg-primary text-white"
          )}>
            {isCompleted ? <CheckCircle className="w-4 h-4" /> : number}
          </div>
       </div>
       <div className="flex-1 pb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-0.5">{title}</h3>
          <p className="text-xs text-text-secondary mb-2">{description}</p>
          {children}
       </div>
    </div>
  );
}

function RestoreSection({ isConnected: _isConnected }: { isConnected: boolean }) {
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchBackups();
  }, [activeTab]);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'local' ? '/backup/list/local' : '/backup/list/drive';
      const res = await api.get(endpoint);
      setBackups(res.data);
    } catch (error) {
      toast.error('Failed to load backups');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    const toastId = toast.loading('Restoring database...');
    try {
      const endpoint = activeTab === 'local' ? '/backup/restore/local' : '/backup/restore/drive';
      const payload = activeTab === 'local' ? { filename: restoreTarget.id } : { fileId: restoreTarget.id };
      await api.post(endpoint, payload);
      toast.success('Restored! Reloading...', { id: toastId });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Restore failed', { id: toastId });
    } finally {
      setRestoreTarget(null);
    }
  };

  return (
    <Card className="h-full flex flex-col min-h-0">
       <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg flex-shrink-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-text-secondary" /> Restore Data
          </h3>
       </div>
       
       <div className="flex-shrink-0">
          <Tabs 
            activeTab={activeTab} 
            onChange={(id) => setActiveTab(id as any)}
            tabs={[
              { id: 'local', label: 'Local', icon: <HardDrive className="w-3.5 h-3.5"/> },
              { id: 'drive', label: 'Drive', icon: <Cloud className="w-3.5 h-3.5"/> }
            ]}
          />
       </div>

       <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
          {isLoading ? (
             <div className="text-center py-6 text-sm text-text-disabled">Loading...</div>
          ) : backups.length === 0 ? (
             <div className="text-center py-6 text-sm text-text-disabled">No backups found</div>
          ) : (
             backups.map((backup: any, index: number) => (
               <div key={backup.id || backup.filename} className={clsx(
                 "group p-3 hover:bg-gray-50/50 transition-colors",
                 index !== backups.length - 1 && "border-b border-gray-100"
               )}>
                  <div className="flex justify-between items-start mb-2">
                     <div className="text-sm font-semibold text-text-primary truncate max-w-[180px]" title={backup.filename}>
                        {backup.filename}
                     </div>
                     <Badge 
                       text={`${(backup.size / 1024 / 1024).toFixed(2)} MB`} 
                       variant="default"
                       className="opacity-75"
                     />
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                     <span>{new Date(backup.createdAt).toLocaleDateString('en-GB')} at {new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <Button size="sm" variant="outline" onClick={() => setRestoreTarget({ id: backup.id || backup.filename, name: backup.filename })}>
                        Restore
                     </Button>
                  </div>
               </div>
            ))
          )}
       </div>

       <Modal 
         isOpen={!!restoreTarget} 
         onClose={() => setRestoreTarget(null)} 
         title="Confirm Restoration"
         size="sm"
       >
         <div className="space-y-6">
             <div className="text-center space-y-3">
                 <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-semibold text-text-primary">Ready to Restore?</h3>
                    <p className="text-sm text-text-secondary mt-1">
                       This action will replace your current database with the selected backup file.
                    </p>
                 </div>
             </div>

             <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-text-secondary">File:</span>
                   <span className="font-medium text-text-primary truncate max-w-[200px]" title={restoreTarget?.name}>{restoreTarget?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-secondary">
                   <div className="flex items-center gap-1.5 text-success">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Safety backup included</span>
                   </div>
                   <span>Overwrite Mode</span>
                </div>
             </div>
             
             <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setRestoreTarget(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={confirmRestore}>Confirm Restore</Button>
             </div>
         </div>
       </Modal>
    </Card>
  );
}
