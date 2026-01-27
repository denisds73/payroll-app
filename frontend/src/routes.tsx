import { Navigate, type RouteObject } from 'react-router-dom';
import App from './App';
import AdvancesIndexPage from './pages/Advances/AdvancesIndexPage';
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
      {
        path: 'advances',
        children: [
          {
            index: true,
            element: <AdvancesIndexPage />,
          },
          // {
          //   path: ':workerId',
          //   lazy: async () => {
          //     const { default: WorkerAdvancesPage } = await import(
          //       './pages/Advances/WorkerAdvancesPage'
          //     );
          //     return { element: <WorkerAdvancesPage /> };
          //   },
          // },
        ],
      },
    ],
  },
];
