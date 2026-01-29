import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

export default function NavLink({ to, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  const baseClasses = 'text-sm font-medium transition-colors duration-200 relative pb-1';
  const activeClasses = 'text-primary font-semibold';
  const inactiveClasses = 'text-text-secondary hover:text-primary';

  const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

  return (
    <div className="relative">
      <Link to={to} className={className}>
        {children}
      </Link>
    </div>
  );
}
