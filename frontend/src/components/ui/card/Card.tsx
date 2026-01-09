import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
}

export const Card = ({ children, variant = 'default', className }: CardProps) => {
  const cardClasses = clsx(
    'bg-card rounded-lg shadow-md transition-shadow duration-200',
    {
      'hover:shadow-lg': variant === 'default',
      'shadow-lg hover:shadow-xl': variant === 'elevated',
    },
    className,
  );

  return <div className={cardClasses}>{children}</div>;
};
