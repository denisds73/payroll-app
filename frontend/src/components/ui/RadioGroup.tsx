import clsx from 'clsx';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <div className={clsx('flex flex-row gap-4 justify-center', className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={clsx(
            'relative flex items-center justify-center cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={'sr-only'}
            aria-label={option.label}
          />
          <span
            className={clsx(
              'w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center transition bg-card',
              value === option.value
                ? 'bg-primary border-primary'
                : 'bg-background border-primary/80',
              disabled && 'bg-gray-200 border-gray-200',
            )}
          >
            {value === option.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
          </span>
        </label>
      ))}
    </div>
  );
}
