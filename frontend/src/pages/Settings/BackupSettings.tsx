import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Upload, Cloud, HardDrive, Play, CheckCircle, AlertCircle, Link } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';

export default function BackupSettings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [folderId, setFolderId] = useState('');
  const [credentialsFile, setCredentialsFile] = useState<File | null>(null);
  const [credentialsStatus, setCredentialsStatus] = useState<'missing' | 'configured'>('missing');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackupRunning, setIsBackupRunning] = useState(false);

  useEffect(() => {
    fetchSettings();
    checkAuthCode();
  }, [searchParams]);

  const checkAuthCode = async () => {
    const code = searchParams.get('code');
    if (code) {
      try {
        const toastId = toast.loading('Connecting to Google Drive...');
        await api.post('/backup/callback', { code });
        toast.success('Successfully connected to Google Drive!', { id: toastId });
        setIsConnected(true);
        // Clear code from URL
        navigate('/settings', { replace: true });
      } catch (error) {
        toast.error('Failed to connect. Please try again.');
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

      if (credResponse.status === 'fulfilled' && credResponse.value.data) {
        setCredentialsStatus('configured');
      }
      if (folderResponse.status === 'fulfilled' && folderResponse.value.data) {
        setFolderId(folderResponse.value.data.value);
      }
      if (tokenResponse.status === 'fulfilled' && tokenResponse.value.data) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const handleCredentialsUpload = async () => {
    if (!credentialsFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        JSON.parse(content); // Validate JSON
        
        await api.patch('/settings/GOOGLE_DRIVE_CREDENTIALS', {
          value: content,
          description: 'Google OAuth Client ID',
        });
        setCredentialsStatus('configured');
        toast.success('OAuth Client ID uploaded successfully');
        setCredentialsFile(null);
      } catch (error) {
        toast.error('Invalid JSON file or upload failed');
      }
    };
    reader.readAsText(credentialsFile);
  };

  const handleConnect = async () => {
    try {
      const res = await api.get('/backup/auth-url');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error('Failed to initiate login. Check credentials.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      await api.patch('/settings/BACKUP_FOLDER_ID', {
        value: folderId,
        description: 'Google Drive Backup Folder ID',
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setIsBackupRunning(true);
      const loadingToast = toast.loading('Running backup...');
      
      const res = await api.post('/backup/trigger');
      
      toast.dismiss(loadingToast);
      if (res.data.googleDriveId) {
        toast.success('Backup saved locally & uploaded to Google Drive!');
      } else {
        toast.success(`Local backup created! Path: ${res.data.path}`);
        toast.error('Cloud upload skipped (not connected)', { duration: 4000 });
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Backup failed. Check logs.');
    } finally {
      setIsBackupRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Backup & Recovery</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your data backup configuration (Local & Google Drive).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <HardDrive className="text-blue-600 w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Local Backup</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Data is securely backed up locally every day at midnight.
            Backups are retained indefinitely.
          </p>
          <div className="flex items-center gap-2 text-sm text-text-secondary bg-gray-50 p-3 rounded-md border border-gray-100">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Local Service Active</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Cloud className="text-yellow-600 w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Google Drive Backup (OAuth)</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">1. OAuth Client ID (JSON)</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setCredentialsFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-text-secondary"
                />
                <Button
                  onClick={handleCredentialsUpload}
                  disabled={!credentialsFile}
                  icon={<Upload className="w-4 h-4" />}
                >
                  Upload
                </Button>
              </div>
              <div className="text-xs text-text-secondary flex items-center gap-1">
                {credentialsStatus === 'configured' ? (
                  <span className="text-success flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Credentials Configured</span>
                ) : (
                  <span>Required: Download "OAuth Client ID" JSON from Google Cloud.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">2. Authorization</label>
              <div>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-success bg-success/5 p-3 rounded border border-success/20">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Connected to Google Drive</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConnect} 
                    disabled={credentialsStatus !== 'configured'}
                    className="w-full"
                    icon={<Link className="w-4 h-4" />}
                  >
                    Connect with Google
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">3. Backup Folder ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="ID from URL of your Drive folder"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-text-primary placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSaveSettings}
                  loading={isLoading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
        <Button
          onClick={handleTriggerBackup}
          loading={isBackupRunning}
          icon={<Play className="w-4 h-4" />}
          size="lg"
          disabled={!isConnected || !folderId}
        >
          {isBackupRunning ? 'Running Backup...' : 'Backup Now to Drive'}
        </Button>
      </div>

      <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Restore Data
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Select a backup to restore. 
            <span className="font-semibold text-warning ml-1">Warning: Current data will be replaced!</span>
            (A safety backup will be created automatically).
          </p>
        </div>

        <RestoreSection isConnected={isConnected} />
      </div>
    </div>
  );
}

function RestoreSection({ isConnected }: { isConnected: boolean }) {
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleRestore = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore "${name}"?\nCurrent data will be overwritten!`)) return;

    const toastId = toast.loading('Restoring database...');
    try {
      const endpoint = activeTab === 'local' ? '/backup/restore/local' : '/backup/restore/drive';
      const payload = activeTab === 'local' ? { filename: id } : { fileId: id };
      
      await api.post(endpoint, payload);
      
      toast.success('Database restored successfully! Reloading...', { id: toastId });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Restore failed', { id: toastId });
    }
  };

  return (
    <div className="bg-card rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('local')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'local' 
              ? 'bg-primary/5 text-primary border-b-2 border-primary' 
              : 'text-text-secondary hover:bg-gray-50'
          }`}
        >
          Local Backups
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          disabled={!isConnected}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'drive' 
              ? 'bg-primary/5 text-primary border-b-2 border-primary' 
              : 'text-text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          Google Drive Backups
        </button>
      </div>

      <div className="p-4 min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center py-8 text-text-secondary">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="flex justify-center py-8 text-text-secondary">No backups found.</div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup: any) => (
              <div 
                key={activeTab === 'local' ? backup.filename : backup.id} 
                className="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:border-primary/30 transition-colors bg-white"
              >
                <div>
                  <div className="font-medium text-text-primary">{backup.filename}</div>
                  <div className="text-xs text-text-secondary">
                    {new Date(backup.createdAt).toLocaleString()} • {(backup.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRestore(activeTab === 'local' ? backup.filename : backup.id, backup.filename)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
