import clsx from 'clsx';
import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { useTamilTransliteration } from '../../hooks/useTamilTransliteration';

interface TamilTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  onValueChange: (value: string) => void;
}

/**
 * Textarea component with Thanglish → Tamil transliteration.
 * Wraps a standard <textarea> with transliteration on space/enter.
 * Shows a small "த" badge to indicate Tamil mode when a label is present.
 */
export default function TamilTextarea({
  label,
  error,
  onValueChange,
  ...props
}: TamilTextareaProps) {
  const id = useId();
  const { handleKeyDown, handleChange } = useTamilTransliteration();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary flex items-center gap-1.5"
        >
          {label}
          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">
            த
          </span>
        </label>
      )}
      <textarea
        id={id}
        className={clsx(
          'px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-primary transition-all min-h-8 max-h-12 resize-none bg-card',
          error && 'border-error focus:ring-error',
          props.disabled && 'text-text-disabled bg-surface cursor-not-allowed',
        )}
        aria-invalid={!!error}
        {...props}
        onChange={(e) => handleChange(e, onValueChange)}
        onKeyDown={(e) => {
          handleKeyDown(e);
          props.onKeyDown?.(e);
        }}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
