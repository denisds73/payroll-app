import clsx from 'clsx';
import type React from 'react';
import { useId } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, ...props }: TextareaProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5 ">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <textarea
        id={id}
        className={clsx(
          'px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-primary transition-all min-h-8 max-h-12 resize-none',
          error && 'border-error focus:ring-error',
          props.disabled && 'text-text-disabled bg-gray-100 cursor-not-allowed',
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
