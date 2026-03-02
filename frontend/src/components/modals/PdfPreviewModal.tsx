/** biome-ignore-all lint/a11y/noStaticElementInteractions: <no> */
import { Download, Printer, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import Button from '../ui/Button';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string | null;
  onDownload?: () => void;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  title,
  pdfUrl,
  onDownload,
}: PdfPreviewModalProps) {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = (): void => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={`bg-surface rounded-xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col w-full h-full max-w-5xl max-h-[90vh] ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Printer className="w-5 h-5 text-primary" />
             </div>
             <h2 id={titleId} className="text-lg font-bold text-text-primary">
               {title}
             </h2>
          </div>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-lg transition-all"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-background-alt overflow-hidden relative">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border-none shadow-inner"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-text-secondary font-medium">Preparing preview...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-hover flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
