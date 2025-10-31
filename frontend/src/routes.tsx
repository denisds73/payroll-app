import type { RouteObject } from 'react-router-dom';
import App from './App';
import TestPage from './pages/TestPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <div className="p-6">
            <h1>Welcome to Payroll App</h1>
          </div>
        ),
      },
      {
        path: 'test',
        element: <TestPage />,
      },
    ],
  },
];
