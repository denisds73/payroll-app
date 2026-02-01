import { X } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import Button from '../ui/Button';
import { SignatureCanvas, type SignatureCanvasRef } from './SignatureCanvas';
import type { SignatureModalProps } from './signature.types';

export const SignatureModal = ({ isOpen, onClose, onSave }: SignatureModalProps) => {
  const modalTitleId = useId();
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = () => {
    setError(null);

    const signatureData = canvasRef.current?.save();

    if (signatureData) {
      onSave(signatureData);
      handleClose();
    } else {
      setError('Please provide a signature before saving');
    }
  };

  const handleClear = () => {
    setError(null);
    canvasRef.current?.clear();
  };

  const handleClose = (): void => {
    setIsAnimating(false);

    setTimeout(() => {
      setError(null);
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleBackdropKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="presentation"
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-3xl w-full transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
              Capture Signature
            </h2>
            <p className="text-sm text-text-secondary mt-1">Sign using your mouse or stylus</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div
              className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm animate-shake"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Signature <span className="text-error">*</span>
            </label>
            <SignatureCanvas ref={canvasRef} />
          </div>

          <p className="text-xs text-text-secondary">
            Draw your signature in the box above. Click Clear to start over, or Save to confirm.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              className="flex-1"
            >
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
