import { useEffect, useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import Button from './ui/Button';

export function UpdateNotifier() {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        
        const handleUpdateAvailable = (_event: any, info: any) => {
          console.log('Update available event received:', info);
          setUpdateInfo(info);
          setIsVisible(true);
        };

        ipcRenderer.on('update-available', handleUpdateAvailable);
        
        return () => {
          ipcRenderer.removeListener('update-available', handleUpdateAvailable);
        };
      }
    } catch (e) {
      console.warn('Update notifier setup failed', e);
    }
  }, []);

  const handleDownload = () => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { shell } = (window as any).require('electron');
      // For unsigned apps, direct them to the releases page for manual download
      shell.openExternal('https://github.com/denisds73/payroll-app/releases/latest');
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slideIn">
      <div className="bg-card border border-primary/20 shadow-2xl rounded-xl p-5 max-w-sm flex gap-4 items-start relative overflow-hidden group">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Download className="w-5 h-5 text-primary animate-bounce" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-text-primary text-sm">New Version Available!</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-text-disabled hover:text-text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Version <span className="font-mono font-semibold text-primary">{updateInfo.version}</span> is now available on GitHub.
          </p>
          <div className="pt-2">
            <Button 
                size="sm" 
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2"
            >
              Update Now <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
