import { format, isValid, parse } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';

function ChevronIcon({ orientation }: { orientation?: 'left' | 'right' | 'up' | 'down' }) {
  return orientation === 'left' ? (
    <ChevronLeft className="w-5 h-5" />
  ) : (
    <ChevronRight className="w-5 h-5" />
  );
}

export interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  minDate?: string;
  maxDate?: string;
  disableFuture?: boolean;
  excludeDates?: string[];
  isDateDisabled?: (date: Date) => boolean;
  label?: string;
  placeholder?: string;
  error?: string;
  isClearable?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const DATE_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'MMM d, yyyy';

function toDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;
  const parsed = parse(dateString, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

function toISOString(date: Date | undefined): string | null {
  if (!date || !isValid(date)) return null;
  return format(date, DATE_FORMAT);
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disableFuture = false,
  excludeDates = [],
  isDateDisabled,
  label,
  placeholder = 'Select date',
  error,
  isClearable = false,
  icon,
  disabled = false,
  loading = false,
  id,
  'aria-label': ariaLabel,
  className = '',
  size = 'md',
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = toDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMaxDate = disableFuture ? today : toDate(maxDate);
  const effectiveMinDate = toDate(minDate);

  const disabledDays: Array<Date | ((date: Date) => boolean)> = [];

  if (effectiveMinDate) {
    disabledDays.push((date: Date) => date < effectiveMinDate);
  }
  if (effectiveMaxDate) {
    disabledDays.push((date: Date) => date > effectiveMaxDate);
  }
  if (excludeDates.length > 0) {
    const excludeSet = new Set(excludeDates);
    disabledDays.push((date: Date) => excludeSet.has(format(date, DATE_FORMAT)));
  }
  if (isDateDisabled) {
    disabledDays.push(isDateDisabled);
  }

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;
      const popoverHeight = 340; // Approximate calendar height

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        setPopoverPosition('top');
      } else {
        setPopoverPosition('bottom');
      }
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange(toISOString(date));
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      inputRef.current?.focus();
    },
    [onChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
  };

  const displayValue = selectedDate ? format(selectedDate, DISPLAY_FORMAT) : '';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={inputRef}
          type="button"
          id={inputId}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          aria-label={ariaLabel || label || 'Select date'}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className={`
            w-full flex items-center gap-2 text-left
            border rounded-md transition-all
            focus:outline-none focus:ring-2 focus:ring-primary
            ${sizeClasses[size]}
            ${error ? 'border-error focus:ring-error' : 'border-border'}
            ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-surface' : 'bg-card hover:border-border-hover'}
          `}
        >
          <span className="text-text-secondary shrink-0">
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            ) : (
              icon || <Calendar className="w-4 h-4" />
            )}
          </span>

          <span
            className={`flex-1 truncate ${!displayValue ? 'text-text-disabled' : 'text-text-primary'}`}
          >
            {displayValue || placeholder}
          </span>

          {isClearable && value && !disabled && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-surface-hover rounded transition-colors shrink-0"
              aria-label="Clear date"
            >
              <X className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          )}
        </button>

        {isOpen && (
          <div
            ref={popoverRef}
            className={`absolute left-0 z-50 bg-card border border-border rounded-lg shadow-lg animate-fadeIn ${
              popoverPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Choose date"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={disabledDays}
              defaultMonth={selectedDate || today}
              showOutsideDays
              fixedWeeks
              components={{
                Chevron: ChevronIcon,
              }}
              classNames={{
                root: 'p-3 relative',
                months: 'flex flex-col',
                month: 'space-y-3',
                month_caption: 'flex justify-center items-center h-7',
                caption_label: 'text-sm font-semibold text-text-primary',
                nav: 'absolute top-3 left-3 right-3 flex justify-between items-center h-7 z-10',
                button_previous:
                  'h-7 w-7 flex items-center justify-center hover:bg-surface-hover rounded-md transition-colors text-text-primary cursor-pointer',
                button_next:
                  'h-7 w-7 flex items-center justify-center hover:bg-surface-hover rounded-md transition-colors text-text-primary cursor-pointer',
                weekdays: 'flex',
                weekday: 'w-9 text-xs font-medium text-text-secondary text-center',
                week: 'flex mt-1',
                day: 'w-9 h-9 text-center text-sm relative p-0 group',
                day_button:
                  'w-9 h-9 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset cursor-pointer [not([data-selected])]:hover:bg-surface-hover group-data-[selected]:bg-primary group-data-[selected]:text-white group-data-[selected]:font-semibold group-data-[today]:bg-info/10 group-data-[today]:text-info group-data-[today]:font-semibold',
                selected: '',
                today: '',
                outside: 'text-text-disabled opacity-40',
                disabled:
                  'text-text-disabled line-through opacity-50 cursor-not-allowed hover:bg-transparent pointer-events-none',
                hidden: 'invisible',
              }}
            />
          </div>
        )}
      </div>

      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

export default DatePicker;
