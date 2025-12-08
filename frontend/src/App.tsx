import './App.css';
import { Link, Outlet } from 'react-router-dom';
import Button from './components/ui/Button';

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-card p-4">
        <div className="flex gap-4">
          <Link to="/">
            <Button>Home</Button>
          </Link>
          <Link to="/test">
            <Button>Test Component</Button>
          </Link>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
