import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const CardDescription = ({ className, ...props }: CardDescriptionProps) => {
  return <p className={clsx('text-sm text-secondary', className)} {...props} />;
};
