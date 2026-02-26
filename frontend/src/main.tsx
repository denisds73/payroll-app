import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { ensureExpenseTypes } from './utils/ensureExpenseTypes';
import { ServerInitializationLoader } from './components/ServerInitializationLoader';
import './index.css';

const router = createHashRouter(routes);


function MainApp() {
  useEffect(() => {
    // Ensure expense types exist when app loads
    ensureExpenseTypes();
  }, []);

  return <RouterProvider router={router} />;
}

function Root() {
  return (
    <React.StrictMode>
      <ServerInitializationLoader>
        <MainApp />
      </ServerInitializationLoader>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
