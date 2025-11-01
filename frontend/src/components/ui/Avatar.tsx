import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: number;
  alt?: string;
  className?: string;
}

function getInitials(name: string) {
  if (!name) return '';

  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase();
}

export default function Avatar({ name, src, size = 40, alt, className, ...props }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const dimension = typeof size === 'number' ? size : 40;
  const initials = getInitials(name);

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-secondary/10 text-secondary select-none overflow-hidden',
        className,
      )}
      style={{ width: dimension, height: dimension, fontSize: dimension / 2 }}
      {...props}
      aria-label={initials}
      role="img"
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover rounded-full"
          style={{ width: dimension, height: dimension }}
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
