import clsx from 'clsx';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerLight' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className,
  icon,
  iconPosition = 'left',
  title,
}) => {
  const baseStyles = `inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer`;

  const variantStyles = {
    primary: `bg-primary text-white hover:bg-primary-hover focus:ring-primary`,
    secondary: `bg-secondary text-white hover:bg-secondary-hover focus:ring-secondary`,
    danger: `bg-error text-white hover:bg-error-hover focus:ring-error`,
    dangerLight: `border border-error text-error hover:bg-error/10 focus:ring-error`,
    outline: `border border-primary text-primary hover:bg-neutral-50 focus:ring-primary`,
  };

  const sizeStyles = {
    sm: `px-2 py-1 text-xs`,
    md: `px-3 py-1.5 text-sm`,
    lg: `px-4 py-2 text-base`,
  };

  const combined = clsx(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    (loading || disabled) && 'opacity-60 cursor-not-allowed',
    className,
  );

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={combined} title={title}>
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-t border-white rounded-full animate-spin border-t-transparent" />
          Loading...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </span>
      )}
    </button>
  );
};

export default Button;
