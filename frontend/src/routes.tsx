import { Navigate, type RouteObject } from 'react-router-dom';
import App from './App';
import TestPage from './pages/TestPage';
import WorkerDetail from './pages/Workers/WorkerDetail';
import WorkersDashboard from './pages/Workers/WorkersDashboard';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/workers" replace />,
      },
      {
        path: 'test',
        element: <TestPage />,
      },
      // Worker routes - main app functionality
      {
        path: 'workers',
        children: [
          {
            index: true,
            element: <WorkersDashboard />,
          },
          {
            path: ':id',
            element: <WorkerDetail />,
          },
        ],
      },
    ],
  },
];
