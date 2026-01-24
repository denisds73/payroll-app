import './App.css';
import { Toaster } from 'react-hot-toast';
import { Link, Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-card px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/workers" className="text-xl font-bold text-primary">
              Payroll App
            </Link>
            <div className="flex items-center gap-6">
              <Link 
                to="/workers" 
                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              >
                Workers
              </Link>
              <Link 
                to="/advances" 
                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              >
                Advances
              </Link>
            </div>
          </div>
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
