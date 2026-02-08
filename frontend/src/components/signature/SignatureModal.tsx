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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const isModifierPressed = e.ctrlKey || e.metaKey;

      if (isModifierPressed && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      if (isModifierPressed && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleClear();
        return;
      }

      if (e.key === 'Escape') {
        handleClose();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
        className={`bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div>
            <h2 id={modalTitleId} className="text-xl font-bold text-text-primary">
              Sign Here
            </h2>
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

        <div className="flex-1 flex flex-col p-6 min-h-0">
          {error && (
            <div
              className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm animate-shake mb-4 shrink-0"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center mb-4 min-h-0">
            <SignatureCanvas ref={canvasRef} />
          </div>

          <div className="flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClear}
              title="Clear signature (Ctrl+Z)"
            >
              Clear
              <span className="ml-2 text-xs opacity-60">Ctrl+Z</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              title="Save signature (Ctrl+S)"
            >
              Save Signature
              <span className="ml-2 text-xs opacity-60">Ctrl+S</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
