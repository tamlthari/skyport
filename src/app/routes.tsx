import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import ManagerDashboard from './pages/ManagerDashboard';
import DataScientistDashboard from './pages/DataScientistDashboard';
import GroundServicesDashboard from './pages/GroundServicesDashboard';
import DataPipelineGuide from './pages/DataPipelineGuide';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: ManagerDashboard,
      },
      {
        path: 'data-scientist',
        Component: DataScientistDashboard,
      },
      {
        path: 'ground-services',
        Component: GroundServicesDashboard,
      },
      {
        path: 'data-pipeline',
        Component: DataPipelineGuide,
      },
    ],
  },
]);