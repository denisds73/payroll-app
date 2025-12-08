import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div className={clsx('border-b border-zinc-200 bg-card/50 px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};
