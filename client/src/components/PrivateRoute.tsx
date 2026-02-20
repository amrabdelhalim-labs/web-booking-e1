/**
 * Private Route Component
 *
 * A route guard that redirects unauthenticated users to the login page.
 * Wraps protected routes to enforce authentication.
 */

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/auth-context";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
