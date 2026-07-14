import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { SignupQueuePage } from '@/pages/SignupQueuePage';
import { SchoolsPage } from '@/pages/SchoolsPage';
import { SchoolDetailPage } from '@/pages/SchoolDetailPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/signup-requests" replace />} />
          <Route path="/signup-requests" element={<SignupQueuePage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/schools/:id" element={<SchoolDetailPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
