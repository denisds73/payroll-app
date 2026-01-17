import clsx from 'clsx';

export type AttendanceStatus = 'present' | 'absent' | 'half' | '';

interface StatusOption {
  value: AttendanceStatus;
  label: string;
  shortLabel: string;
  activeClass: string;
  hoverClass: string;
  focusClass: string;
}

const statusOptions: StatusOption[] = [
  {
    value: 'present',
    label: 'Present',
    shortLabel: 'P',
    activeClass: 'bg-success text-white border-success',
    hoverClass: 'hover:bg-success/10 hover:border-success hover:text-success',
    focusClass: 'focus:ring-success/50',
  },
  {
    value: 'absent',
    label: 'Absent',
    shortLabel: 'A',
    activeClass: 'bg-error text-white border-error',
    hoverClass: 'hover:bg-error/10 hover:border-error hover:text-error',
    focusClass: 'focus:ring-error/50',
  },
  {
    value: 'half',
    label: 'Half Day',
    shortLabel: 'H',
    activeClass: 'bg-warning text-white border-warning',
    hoverClass: 'hover:bg-warning/10 hover:border-warning hover:text-warning',
    focusClass: 'focus:ring-warning/50',
  },
];

interface AttendanceStatusGroupProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function AttendanceStatusGroup({
  value,
  onChange,
  disabled = false,
  className,
}: AttendanceStatusGroupProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {statusOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            title={option.label}
            aria-label={option.label}
            aria-pressed={isActive}
            className={clsx(
              'w-9 h-9 rounded-lg border-2 font-bold text-base transition-all duration-150',
              'flex items-center justify-center',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              option.focusClass,
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && !isActive && 'cursor-pointer',
              isActive
                ? option.activeClass
                : clsx(
                    'bg-background border-gray-300 text-text-secondary',
                    !disabled && option.hoverClass,
                  ),
            )}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
