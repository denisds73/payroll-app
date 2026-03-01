import clsx from 'clsx';

export type ExpenseTypeValue = number;

interface ExpenseType {
  id: number;
  name: string;
}

interface TypeStyle {
  shortLabel: string;
  activeClass: string;
  hoverClass: string;
  focusClass: string;
}

// Map expense type names to their styles
const typeStyleMap: Record<string, TypeStyle> = {
  Food: {
    shortLabel: 'Food',
    activeClass: 'bg-success text-white border-success',
    hoverClass: 'hover:bg-success/10 hover:border-success hover:text-success',
    focusClass: 'focus:ring-success/50',
  },
  Other: {
    shortLabel: 'Other',
    activeClass: 'bg-secondary text-white border-secondary',
    hoverClass: 'hover:bg-secondary/10 hover:border-secondary hover:text-secondary',
    focusClass: 'focus:ring-secondary/50',
  },
};

const defaultStyle: TypeStyle = {
  shortLabel: '?',
  activeClass: 'bg-primary text-white border-primary',
  hoverClass: 'hover:bg-primary/10 hover:border-primary hover:text-primary',
  focusClass: 'focus:ring-primary/50',
};

function getTypeStyle(typeName: string): TypeStyle {
  return typeStyleMap[typeName] || { ...defaultStyle, shortLabel: typeName };
}

interface ExpenseTypeGroupProps {
  expenseTypes: ExpenseType[];
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function ExpenseTypeGroup({
  expenseTypes,
  value,
  onChange,
  disabled = false,
  className,
}: ExpenseTypeGroupProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {expenseTypes.map((type) => {
        const isActive = value === type.id;
        const style = getTypeStyle(type.name);

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => !disabled && onChange(type.id)}
            disabled={disabled}
            title={type.name}
            aria-label={type.name}
            aria-pressed={isActive}
            className={clsx(
              'px-3 h-9 rounded-lg border-2 font-semibold text-sm transition-all duration-150',
              'flex items-center justify-center',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              style.focusClass,
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && !isActive && 'cursor-pointer',
              isActive
                ? style.activeClass
                : clsx(
                    'bg-background border-border text-text-secondary',
                    !disabled && style.hoverClass,
                  ),
            )}
          >
            {style.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
