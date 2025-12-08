import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div className={clsx('p-6', className)} {...props}>
      {children}
    </div>
  );
};
