import { endOfMonth, format, isValid, parse, startOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { type MutableRefObject, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';

function ChevronIcon({ orientation }: { orientation?: 'left' | 'right' | 'up' | 'down' }) {
  return orientation === 'left' ? (
    <ChevronLeft className="w-5 h-5" />
  ) : (
    <ChevronRight className="w-5 h-5" />
  );
}

export interface DateRangeValue {
  start: string | null;
  end: string | null;
}

export interface DateRangePreset {
  label: string;
  getValue: () => DateRangeValue;
}

export interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  minDate?: string;
  maxDate?: string;
  disableFuture?: boolean;
  label?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  error?: string;
  isClearable?: boolean;
  disabled?: boolean;
  showPresets?: boolean;
  presets?: DateRangePreset[];
  className?: string;
}

const DATE_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'MMM d';

function toDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;
  const parsed = parse(dateString, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

function toISOString(date: Date | undefined): string | null {
  if (!date || !isValid(date)) return null;
  return format(date, DATE_FORMAT);
}

// Default presets
function getDefaultPresets(): DateRangePreset[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    {
      label: 'This Month',
      getValue: () => ({
        start: format(startOfMonth(today), DATE_FORMAT),
        end: format(today, DATE_FORMAT),
      }),
    },
    {
      label: 'Last Month',
      getValue: () => {
        const lastMonth = subMonths(today, 1);
        return {
          start: format(startOfMonth(lastMonth), DATE_FORMAT),
          end: format(endOfMonth(lastMonth), DATE_FORMAT),
        };
      },
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({
        start: format(subDays(today, 30), DATE_FORMAT),
        end: format(today, DATE_FORMAT),
      }),
    },
    {
      label: 'Last 90 Days',
      getValue: () => ({
        start: format(subDays(today, 90), DATE_FORMAT),
        end: format(today, DATE_FORMAT),
      }),
    },
    {
      label: 'All Time',
      getValue: () => ({
        start: null,
        end: null,
      }),
    },
  ];
}

export function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disableFuture = false,
  label,
  placeholderStart = 'Start date',
  placeholderEnd = 'End date',
  error,
  isClearable = true,
  disabled = false,
  showPresets = true,
  presets,
  className = '',
}: DateRangePickerProps) {
  const generatedId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activePresets = presets || getDefaultPresets();

  // Track selection count to ensure we wait for 2 clicks before closing
  const selectionCountRef: MutableRefObject<number> = useRef(0);

  // Convert string values to Date objects
  const startDate = toDate(value.start);
  const endDate = toDate(value.end);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMaxDate = disableFuture ? today : toDate(maxDate);
  const effectiveMinDate = toDate(minDate);

  // Build disabled days matcher
  const disabledDays: Array<(date: Date) => boolean> = [];
  if (effectiveMinDate) {
    disabledDays.push((date: Date) => date < effectiveMinDate);
  }
  if (effectiveMaxDate) {
    disabledDays.push((date: Date) => date > effectiveMaxDate);
  }

  // Calculate popover position to avoid cutoff
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const inputRect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;
      const popoverHeight = 380; // Approximate calendar height with presets

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        setPopoverPosition('top');
      } else {
        setPopoverPosition('bottom');
      }
    }

    // Reset selection count when calendar opens
    if (isOpen) {
      selectionCountRef.current = 0;
    }
  }, [isOpen]);

  // Handle range selection
  const handleSelect = useCallback(
    (range: DateRange | undefined) => {
      selectionCountRef.current += 1;

      onChange({
        start: toISOString(range?.from),
        end: toISOString(range?.to),
      });

      // Close after both dates selected (need at least 2 clicks)
      if (range?.from && range?.to && selectionCountRef.current >= 2) {
        setTimeout(() => setIsOpen(false), 150);
      }
    },
    [onChange],
  );

  // Handle preset selection
  const handlePresetClick = useCallback(
    (preset: DateRangePreset) => {
      onChange(preset.getValue());
      setIsOpen(false);
    },
    [onChange],
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange({ start: null, end: null });
    },
    [onChange],
  );

  // Close on outside click
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

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Format display value
  const getDisplayValue = () => {
    if (!startDate && !endDate) return null;
    if (startDate && endDate) {
      return `${format(startDate, DISPLAY_FORMAT)} – ${format(endDate, DISPLAY_FORMAT)}`;
    }
    if (startDate) {
      return `${format(startDate, DISPLAY_FORMAT)} – ...`;
    }
    return null;
  };

  const displayValue = getDisplayValue();
  const hasValue = value.start || value.end;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={generatedId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className={`
            w-full flex items-center gap-2 text-left
            px-3 py-1.5 text-sm
            border rounded-md transition-all
            focus:outline-none focus:ring-2 focus:ring-primary
            ${error ? 'border-error focus:ring-error' : 'border-border'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-surface' : 'bg-card hover:border-border-hover'}
          `}
        >
          <Calendar className="w-4 h-4 text-text-secondary shrink-0" />

          <span
            className={`flex-1 truncate ${!displayValue ? 'text-text-disabled' : 'text-text-primary'}`}
          >
            {displayValue || `${placeholderStart} – ${placeholderEnd}`}
          </span>

          {isClearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-surface-hover rounded transition-colors shrink-0"
              aria-label="Clear dates"
            >
              <X className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          )}
        </button>

        {/* Calendar popover */}
        {isOpen && (
          <div
            className={`absolute left-0 z-50 bg-card border border-border rounded-lg shadow-lg animate-fadeIn ${
              popoverPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Choose date range"
          >
            <div className="flex">
              {/* Presets sidebar */}
              {showPresets && (
                <div className="border-r border-border p-2 min-w-30">
                  <div className="text-xs font-medium text-text-secondary mb-2 px-2">
                    Quick Select
                  </div>
                  <div className="space-y-0.5">
                    {activePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-background transition-colors text-text-primary"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar */}
              <DayPicker
                mode="range"
                selected={{ from: startDate, to: endDate }}
                onSelect={handleSelect}
                disabled={disabledDays}
                defaultMonth={startDate || today}
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
                    'w-9 h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset cursor-pointer rounded-md hover:bg-surface-hover group-data-[selected]:hover:bg-primary group-data-[range-middle]:hover:bg-primary/20',
                  selected: 'bg-primary text-white font-semibold rounded-md',
                  range_start: 'rounded-r-none data-[range-end]:rounded-r-md',
                  range_end: 'rounded-l-none data-[range-start]:rounded-l-md',
                  range_middle: 'bg-primary/10 text-text-primary rounded-none !bg-primary/10 !text-text-primary',
                  today: 'bg-info/10 text-info font-semibold rounded-md [not([data-selected])]:bg-info/10',
                  outside: 'text-text-disabled opacity-40',
                  disabled:
                    'text-text-disabled line-through opacity-50 cursor-not-allowed hover:bg-transparent pointer-events-none',
                  hidden: 'invisible',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}

export default DateRangePicker;
