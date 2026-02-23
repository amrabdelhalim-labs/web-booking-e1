/**
 * Root Application Component
 *
 * Sets up routing, authentication context provider,
 * and the main layout structure of the application.
 *
 * Features:
 * - BrowserRouter with RTL-aware navigation
 * - AuthProvider for global auth state (extracted)
 * - Public routes: /events, /login, /signup, /events/user/:userId
 * - Protected routes: /bookings, /my-events (requires auth)
 * - Auto-redirect for authenticated users on auth pages
 */

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import EventsPage from "./pages/Events";
import BookingsPage from "./pages/Bookings";
import UserEventsPage from "./pages/UserEvents";
import NotFoundPage from "./pages/NotFound";
import AuthProvider from "./context/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "./hooks/useAuth";

/**
 * Inner layout that uses auth context for conditional routing.
 * Separated from App to allow useAuth() inside AuthProvider.
 */
function AppRoutes() {
  const { token } = useAuth();

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Redirect authenticated users away from auth pages */}
          {token && (
            <Route path="/login" element={<Navigate replace to="/events" />} />
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

          {/* Creator's events (public) */}
          <Route path="/events/user/:userId" element={<UserEventsPage />} />

          {/* Protected routes */}
          <Route
            path="/bookings"
            element={
              <PrivateRoute>
                <BookingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-events"
            element={
              <PrivateRoute>
                <UserEventsPage />
              </PrivateRoute>
            }
          />

          {/* 404 Not Found - Must be last */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
