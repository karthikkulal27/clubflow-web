import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { authStore } from './store/auth.store';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PaymentsPage from './pages/PaymentsPage';
import FinancePage from './pages/FinancePage';
import EventsPage from './pages/EventsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import MorePage from './pages/MorePage';
import NotificationsPage from './pages/NotificationsPage';
import ClubSettingsPage from './pages/ClubSettingsPage';
import Layout from './components/Layout';
import { InstallBanner } from './components/InstallBanner';
import { Toaster } from './components/ui/Toaster';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!authStore.isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = authStore.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  if (authStore.isAuthenticated()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <InstallBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route
            path="/"
            element={<RequireAuth><Layout /></RequireAuth>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="more" element={<MorePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="members" element={<RequireAdmin><MembersPage /></RequireAdmin>} />
            <Route path="club-settings" element={<RequireAdmin><ClubSettingsPage /></RequireAdmin>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
