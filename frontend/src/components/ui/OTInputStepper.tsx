import clsx from 'clsx';
import { Minus, Plus } from 'lucide-react';
import type React from 'react';

interface OTInputStepperProps {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const OTInputStepper: React.FC<OTInputStepperProps> = ({
  value,
  onChange,
  step = 0.5,
  min = 0,
  max,
  disabled,
  className,
}) => {
  const isMinReached = value <= min;
  const isMaxReached = typeof max === 'number' && value >= max;

  const handleDecrement = () => {
    if (!disabled && !isMinReached) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (!disabled && !isMaxReached) {
      onChange(value + step);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    if (!disabled && !Number.isNaN(next)) {
      const clamped = Math.max(min, Math.min(next, max ?? Infinity));
      onChange(clamped);
    }
  };

  const buttonBaseClass = clsx(
    'flex items-center justify-center w-9 h-9 rounded-md font-semibold text-sm',
    'border border-primary transition-all duration-150 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary cursor-pointer',
  );

  const buttonActiveClass = clsx(
    'bg-card text-text-primary hover:bg-primary-hover hover:text-card',
    'active:scale-95',
  );

  const buttonDisabledClass =
    'bg-background text-text-disabled border-gray-300 cursor-not-allowed opacity-50';

  const minusButtonClass = clsx(
    buttonBaseClass,
    isMinReached || disabled ? buttonDisabledClass : buttonActiveClass,
  );

  const plusButtonClass = clsx(
    buttonBaseClass,
    isMaxReached || disabled ? buttonDisabledClass : buttonActiveClass,
  );

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isMinReached}
        className={minusButtonClass}
        aria-label="Decrease value"
      >
        <Minus className="h-4 w-4" />
      </button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleInputChange}
        className={clsx(
          'w-16 text-center border border-primary rounded-md px-2 py-2',
          'bg-card text-text-primary text-sm font-medium',
          'transition-all duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary',
          'disabled:bg-background disabled:text-text-disabled disabled:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        )}
        aria-label="Input value"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isMaxReached}
        className={plusButtonClass}
        aria-label="Increase value"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

export default OTInputStepper;
