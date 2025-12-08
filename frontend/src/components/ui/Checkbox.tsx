import clsx from 'clsx';
import React, { useId } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Checkbox({ label, error, ...props }: CheckboxProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium flex items-center gap-2 cursor-pointer text-secondary"
      >
        <input
          type="checkbox"
          id={id}
          className={clsx(
            'w-4 h-4 rounded border border-gray-300 accent-primary focus:ring-primary transition-all cursor-pointer',
            error && 'border-error focus:ring-error',
            props.disabled && 'text-text-disabled bg-gray-100 cursor-not-allowed',
          )}
          aria-invalid={!!error}
          {...props}
        />
        {label}
      </label>
      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
}
