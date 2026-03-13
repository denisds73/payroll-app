import { ChevronDown } from 'lucide-react';
import { type SelectHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  variant?: 'default' | 'compact';
  containerClassName?: string;
}

export default function Select({
  label,
  options,
  error,
  placeholder,
  variant = 'default',
  className,
  containerClassName,
  ...props
}: SelectProps) {
  const id = useId();
  const isCompact = variant === 'compact';

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className="relative group min-w-[80px]">
        <select
          id={id}
          className={clsx(
            'w-full appearance-none transition-all duration-200 cursor-pointer',
            'bg-surface/80 border border-border rounded-lg text-text-primary',
            'hover:bg-surface hover:border-primary/50 hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isCompact ? 'pl-3 pr-9 py-1.5 text-xs font-bold' : 'pl-4 pr-10 py-2.5 text-sm font-medium',
            error && 'border-error ring-error/20',
            props.disabled && 'opacity-50 grayscale cursor-not-allowed bg-surface',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#1c1c1f] py-2 text-white">
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom Chevron with improved visibility */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary group-hover:text-primary transition-colors flex items-center justify-center border-l border-border/50 pl-1.5 h-4">
          <ChevronDown className={clsx(isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4')} strokeWidth={3} />
        </div>
      </div>
      {error && <span className="text-[10px] font-bold text-error mt-0.5 px-1 uppercase">{error}</span>}
    </div>
  );
}
