import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return <h3 className={clsx('text-lg font-semibold text-primary', className)} {...props} />;
};
