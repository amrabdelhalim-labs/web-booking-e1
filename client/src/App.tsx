/**
 * Root Application Component
 *
 * Sets up routing, authentication context provider,
 * and the main layout structure of the application.
 *
 * Features:
 * - BrowserRouter with RTL-aware navigation
 * - AuthContext provider for global auth state
 * - Public routes: /events, /login, /signup
 * - Protected routes: /bookings (requires auth)
 * - Auto-redirect for authenticated users on auth pages
 */

import { useState, useCallback } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import EventsPage from "./pages/Events";
import BookingsPage from "./pages/Bookings";
import AuthContext from "./context/auth-context";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("userId")
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  /**
   * Stores authentication data in state and localStorage.
   */
  const login = useCallback(
    (userToken: string, loginUserId: string, loginUsername: string) => {
      if (userToken) {
        setToken(userToken);
        localStorage.setItem("token", userToken);
      }
      if (loginUserId) {
        setUserId(loginUserId);
        localStorage.setItem("userId", loginUserId);
      }
      if (loginUsername) {
        setUsername(loginUsername);
        localStorage.setItem("username", loginUsername);
      }
    },
    []
  );

  /**
   * Clears authentication data from state and localStorage.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.clear();
  }, []);

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ token, userId, username, login, logout }}>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Redirect authenticated users away from auth pages */}
            {token && (
              <Route
                path="/login"
                element={<Navigate replace to="/events" />}
              />
            )}
            <Route path="/login" element={<LoginPage />} />

            {token && (
              <Route
                path="/signup"
                element={<Navigate replace to="/events" />}
              />
            )}
            <Route path="/signup" element={<SignUpPage />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate replace to="/events" />} />

            {/* Public route */}
            <Route path="/events" element={<EventsPage />} />

            {/* Protected route */}
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <BookingsPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}
