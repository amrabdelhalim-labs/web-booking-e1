/**
 * Private Route Component
 *
 * A route guard that redirects unauthenticated users to the login page.
 * Wraps protected routes to enforce authentication.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
