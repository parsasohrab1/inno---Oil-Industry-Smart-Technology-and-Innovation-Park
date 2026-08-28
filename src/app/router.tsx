import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/layout/AppShell'
import Overview from '@/pages/Overview'
import DigitalTwin from '@/pages/DigitalTwin'
import Companies from '@/pages/Companies'
import Investment from '@/pages/Investment'
import DomesticMarket from '@/pages/DomesticMarket'
import InternationalMarket from '@/pages/InternationalMarket'
import Mentoring from '@/pages/Mentoring'
import Startups from '@/pages/Startups'
import Finance from '@/pages/Finance'
import Access from '@/pages/Access'
import Facilities from '@/pages/Facilities'
import Events from '@/pages/Events'
import Notifications from '@/pages/Notifications'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'digital-twin', element: <DigitalTwin /> },
      { path: 'companies', element: <Companies /> },
      { path: 'investment', element: <Investment /> },
      { path: 'market/domestic', element: <DomesticMarket /> },
      { path: 'market/international', element: <InternationalMarket /> },
      { path: 'mentoring', element: <Mentoring /> },
      { path: 'startups', element: <Startups /> },
      { path: 'finance', element: <Finance /> },
      { path: 'access', element: <Access /> },
      { path: 'facilities', element: <Facilities /> },
      { path: 'events', element: <Events /> },
      { path: 'notifications', element: <Notifications /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
