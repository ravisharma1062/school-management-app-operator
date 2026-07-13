import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '@/context/PlatformAuthContext';
import { LoadingState } from '@/components/ui';

/** Gates all operator console routes: redirects unauthenticated users to /login. */
export function RequireAuth() {
  const { isAuthenticated, isBootstrapping } = usePlatformAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
