import { Link } from 'react-router-dom';
import NavLink from './NavLink';

interface NavItem {
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Workers', path: '/workers' },
  { label: 'Advances', path: '/advances' },
  { label: 'Settings', path: '/settings' },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-card px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link
          to="/"
          className="text-xl font-bold text-primary hover:text-primary-hover transition-colors"
        >
          Payroll App
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
