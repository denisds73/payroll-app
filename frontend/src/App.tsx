import './App.css';
import { Toaster } from 'react-hot-toast';
import { Outlet } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
        }}
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

      <main className="pt-24 px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
