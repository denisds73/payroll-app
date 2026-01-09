import { type InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <input
        id={id}
        className="px-3 py-2 transition-all border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
