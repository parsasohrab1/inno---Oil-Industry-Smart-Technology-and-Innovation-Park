import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/layout/AppShell'
import { RequireAuth, RequireRole } from '@/app/guards'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
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
import Contracts from '@/pages/Contracts'
import Reports from '@/pages/Reports'
import NotFound from '@/pages/NotFound'
import CompanyHome from '@/pages/company/CompanyHome'
import CompanyContracts from '@/pages/company/CompanyContracts'
import CompanyReports from '@/pages/company/CompanyReports'
import InvestorHome from '@/pages/investor/InvestorHome'
import MentorHome from '@/pages/mentor/MentorHome'
import AdminUsers from '@/pages/admin/Users'

const staff = ['admin', 'operator'] as const

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RequireRole roles={[...staff]}><Overview /></RequireRole> },
      { path: 'digital-twin', element: <RequireRole roles={[...staff]}><DigitalTwin /></RequireRole> },
      {
        path: 'companies',
        element: (
          <RequireRole roles={['admin', 'operator', 'investor', 'mentor']}>
            <Companies />
          </RequireRole>
        ),
      },
      { path: 'contracts', element: <RequireRole roles={[...staff]}><Contracts /></RequireRole> },
      {
        path: 'reports',
        element: <RequireRole roles={['admin', 'operator']}><Reports /></RequireRole>,
      },
      { path: 'admin/users', element: <RequireRole roles={['admin']}><AdminUsers /></RequireRole> },

      { path: 'investment', element: <RequireRole roles={[...staff]}><Investment /></RequireRole> },
      { path: 'market/domestic', element: <RequireRole roles={[...staff]}><DomesticMarket /></RequireRole> },
      { path: 'market/international', element: <RequireRole roles={[...staff]}><InternationalMarket /></RequireRole> },
      { path: 'mentoring', element: <RequireRole roles={[...staff]}><Mentoring /></RequireRole> },
      {
        path: 'startups',
        element: <RequireRole roles={['admin', 'operator', 'investor']}><Startups /></RequireRole>,
      },

      { path: 'finance', element: <RequireRole roles={[...staff]}><Finance /></RequireRole> },
      { path: 'access', element: <RequireRole roles={[...staff]}><Access /></RequireRole> },
      { path: 'facilities', element: <RequireRole roles={[...staff]}><Facilities /></RequireRole> },
      { path: 'events', element: <Events /> },
      { path: 'notifications', element: <Notifications /> },

      {
        path: 'company',
        element: <RequireRole roles={['company', 'startup']}><CompanyHome /></RequireRole>,
      },
      {
        path: 'company/contracts',
        element: <RequireRole roles={['company', 'startup']}><CompanyContracts /></RequireRole>,
      },
      {
        path: 'company/reports',
        element: <RequireRole roles={['company', 'startup']}><CompanyReports /></RequireRole>,
      },
      { path: 'investor', element: <RequireRole roles={['investor']}><InvestorHome /></RequireRole> },
      { path: 'mentor', element: <RequireRole roles={['mentor']}><MentorHome /></RequireRole> },

      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
