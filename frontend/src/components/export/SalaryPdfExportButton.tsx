
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
    if (success && onSuccess) {
      onSuccess();
      // Clear success state after callback
      setTimeout(() => clear(), 2000);
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

  const getButtonClasses = () => {
    const baseClasses =
      'inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    if (variant === 'ghost') {
      return `${baseClasses} text-text-secondary hover:text-text-primary hover:bg-background`;
    }

    return `${baseClasses} bg-primary text-white hover:bg-primary-hover shadow-sm`;
  };

  const getButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating...</span>
        </>
      );
    }

    if (success) {
      return (
        <>
          <CheckCircle className="w-4 h-4 text-success" />
          <span>Downloaded!</span>
        </>
      );
    }

    if (error) {
      return (
        <>
          <AlertCircle className="w-4 h-4 text-error" />
          <span>Failed</span>
        </>
      );
    }

    return (
      <>
        <Download className="w-4 h-4" />
        <span>Download PDF</span>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className={getButtonClasses()}
        title={workerName ? `Download PDF for ${workerName}` : 'Download PDF'}
      >
        {getButtonContent()}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Failed to generate PDF</p>
            <p className="text-xs mt-1 opacity-90">{error}</p>
            <button
              type="button"
              onClick={clear}
              className="text-xs underline mt-2 hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
