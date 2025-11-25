import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
}

export const Card = ({ title, children, variant = 'default', className }: CardProps) => {
  const cardClasses = clsx(
    'bg-card rounded-lg shadow-md transition-shadow duration-200',
    {
      'hover:shadow-lg': variant === 'default',
      'shadow-lg hover:shadow-xl': variant === 'elevated',
    },
    className,
  );

  return (
    <div className={cardClasses}>
      {title && (
        <div className="border-b border-zinc-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
