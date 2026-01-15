import type { RouteObject } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard/Dashboard';
import TestPage from './pages/TestPage';
import { AddWorker } from './pages/Workers/AddWorker';
import { UpdateWorker } from './pages/Workers/UpdateWorker';
import WorkerDetail from './pages/Workers/WorkerDetail';
import WorkersDashboard from './pages/Workers/WorkersDashboard';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'test',
        element: <TestPage />,
      },
      // Worker routes
      {
        path: 'workers',
        children: [
          {
            index: true,
            element: <WorkersDashboard />,
          },
          {
            path: 'add',
            element: <AddWorker />,
          },
          {
            path: ':id/edit',
            element: <UpdateWorker />,
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
