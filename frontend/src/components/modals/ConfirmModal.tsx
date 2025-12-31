/** biome-ignore-all lint/a11y/noStaticElementInteractions: <no> */
import { AlertTriangle } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import Button from '../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleConfirm = (): void => {
    setIsAnimating(false);
    setTimeout(() => {
      onConfirm();
    }, 200);
  };

  const handleCancel = (): void => {
    setIsAnimating(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleBackdropKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      handleCancel();
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
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                variant === 'danger' ? 'bg-error/10' : 'bg-warning/10'
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${variant === 'danger' ? 'text-error' : 'text-warning'}`}
              />
            </div>
            <div className="flex-1">
              <h2 id={titleId} className="text-lg font-bold text-text-primary mb-2">
                {title}
              </h2>
              <p className="text-sm text-text-secondary">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
