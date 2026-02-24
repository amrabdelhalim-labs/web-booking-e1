/**
 * Authentication Context
 *
 * Provides authentication state (token, userId, username) and
 * auth actions (login, logout) to the entire component tree.
 * Used by Navbar, PrivateRoute, and auth pages.
 */

import { createContext } from 'react';

/**
 * Shape of the authentication context value.
 */
export interface AuthContextType {
  token: string | null;
  userId: string | null;
  username: string | null;
  login: (token: string, userId: string, username: string) => void;
  logout: () => void;
}

/**
 * Authentication context with default values.
 * Provides token, userId, username, login, and logout.
 */
const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  username: null,
  login: () => {},
  logout: () => {},
});

export default AuthContext;
