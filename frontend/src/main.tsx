import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { ensureExpenseTypes } from './utils/ensureExpenseTypes';
import './index.css';

const router = createBrowserRouter(routes);

function Root() {
  useEffect(() => {
    // Ensure expense types exist when app loads
    ensureExpenseTypes();
  }, []);

  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
