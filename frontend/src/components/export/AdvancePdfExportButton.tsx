import { AlertCircle, CheckCircle, Download, Eye, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useAdvancePdfGenerator } from '../../features/pdf-export/hooks/useAdvancePdfGenerator';

interface AdvancePdfExportButtonProps {
  advanceId: number;
  workerName?: string;
  variant?: 'default' | 'ghost' | 'auto';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onViewClick?: () => void;
}

export default function AdvancePdfExportButton({
  advanceId,
  variant = 'default',
  onSuccess,
  onError,
  onViewClick,
}: AdvancePdfExportButtonProps) {
  const { generateAndDownload, generateAndView, isGenerating, error, success, clear } = useAdvancePdfGenerator();

  useEffect(() => {
    if (variant === 'auto' && advanceId) {
      handleDownload();
    }
  }, [variant, advanceId]);

  useEffect(() => {
    if (success) {
      if (onSuccess) {
        onSuccess();
      }

      const timer = setTimeout(() => {
        clear();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, onSuccess, clear]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleDownload = async () => {
    try {
      await generateAndDownload(advanceId);
    } catch (err) {
      console.error('Failed to generate advance receipt:', err);
    }
  };

  const handleView = async () => {
    if (onViewClick) {
      onViewClick();
      return;
    }
    try {
      await generateAndView(advanceId);
    } catch (err) {
      console.error('Failed to view advance receipt:', err);
    }
  };

  if (variant === 'auto') {
    return null;
  }

  const getIcon = () => {
    if (isGenerating) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (success) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    if (error) {
      return <AlertCircle className="w-4 h-4 text-error" />;
    }
    return <Download className="w-4 h-4" />;
  };

  const getTooltip = () => {
    if (isGenerating) return 'Generating receipt...';
    if (success) return 'Downloaded!';
    if (error) return 'Failed to download';
    return 'Download Receipt';
  };

  const getIconScale = () => {
    if (success) return 'scale-120';
    return 'scale-100';
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleView}
        disabled={isGenerating}
        className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="View Receipt"
        aria-label="View Advance Receipt"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title={getTooltip()}
        aria-label="Download Advance Receipt"
      >
        <div className={`transition-all duration-300 ease-in-out transform ${getIconScale()}`}>
          {getIcon()}
        </div>
      </button>
    </div>
  );
}
