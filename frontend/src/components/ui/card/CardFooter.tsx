import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 border-t border-zinc-200 bg-card/30 px-6 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
