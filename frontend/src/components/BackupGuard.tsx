import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import api from '../services/api';

export function BackupGuard() {
  const [status, setStatus] = useState<'idle' | 'backing-up' | 'completed'>('idle');

  useEffect(() => {
    // 1. Check for failed pre-quit backups from previous sessions
    const checkBackupStatus = async () => {
      try {
        const res = await api.get('/settings/LAST_BACKUP_FAILED');
        if (res.data?.value === 'true') {
          toast.error(
            'Warning: The automatic backup when you last closed the application failed! Please verify your Backup Settings.',
            { duration: 8000 }
          );
          await api.patch('/settings/LAST_BACKUP_FAILED', {
            value: 'false',
            description: 'Tracks if the last auto-backup failed',
          });
        }
      } catch (error) {
        // setting likely doesn't exist yet, simply ignore
      }
    };
    checkBackupStatus();

    // 2. Listen for the Electron 'app-closing' event to display the loading modal
    try {
      if (typeof window !== 'undefined' && (window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        const handleClosing = () => setStatus('backing-up');
        const handleCompleted = () => setStatus('completed');
        
        ipcRenderer.on('app-closing', handleClosing);
        ipcRenderer.on('app-backup-complete', handleCompleted);
        return () => {
          ipcRenderer.removeListener('app-closing', handleClosing);
          ipcRenderer.removeListener('app-backup-complete', handleCompleted);
        };
      }
    } catch (e) {
      console.warn('Electron IPC setup failed', e);
    }
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
      <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border flex flex-col items-center max-w-sm text-center transform transition-all duration-300 scale-100">
        {status === 'backing-up' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 animate-spin mb-5 text-primary" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" className="stroke-gray-200" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="30 100" transform="rotate(-90 25 25)" />
          </svg>
        ) : (
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-5 animate-fadeIn shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-6 h-6 text-success" />
          </div>
        )}
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {status === 'backing-up' ? 'Backing up your data...' : 'Backup Complete!'}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          {status === 'backing-up'
            ? 'Please wait while we secure your latest entries. The application will close automatically once the backup is complete.'
            : 'Your data has been successfully secured. The application is now closing.'}
        </p>
      </div>
    </div>
  );
}
