import clsx from 'clsx';
import type React from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  default: 'bg-secondary/10 text-secondary',
  outline: 'bg-transparent border border-border text-text-secondary',
};

export default function Badge({
  text,
  variant = 'default',
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex items-center justify-center w-4 h-4" aria-hidden="true">
          {icon}
        </span>
      )}
      {text}
    </span>
  );
}
