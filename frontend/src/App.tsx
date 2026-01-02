import './App.css';
import { Toaster } from 'react-hot-toast';
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
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#18181b',
            color: '#F5F5F7',
            fontWeight: '600',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      {/* Page Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
