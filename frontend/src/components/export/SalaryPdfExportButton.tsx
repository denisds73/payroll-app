import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useSalaryPdfGenerator } from '../../features/pdf-export/hooks/useSalaryPdfGenerator';

interface SalaryPdfExportButtonProps {
  salaryId: number;
  workerName?: string;
  variant?: 'default' | 'ghost' | 'auto';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function SalaryPdfExportButton({
  salaryId,
  workerName,
  variant = 'default',
  onSuccess,
  onError,
}: SalaryPdfExportButtonProps) {
  const { generateAndDownload, isGenerating, error, success, clear } =
    useSalaryPdfGenerator();

  useEffect(() => {
    if (variant === 'auto') {
      handleDownload();
    }
  }, [variant]);

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
      await generateAndDownload(salaryId);
    } catch (err) {
      console.error('PDF generation failed:', err);
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
    if (isGenerating) return 'Generating PDF...';
    if (success) return 'Downloaded!';
    if (error) return 'Failed to download';
    return 'Download PDF';
  };

  const getIconScale = () => {
    if (success) return 'scale-120';
    return 'scale-100';
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={getTooltip()}
      aria-label="Download PDF"
    >
      <div className={`transition-all duration-300 ease-in-out transform ${getIconScale()}`}>
        {getIcon()}
      </div>
    </button>
  );
}
