/**
 * Navigation Bar Component
 *
 * Displays the main navigation with links that adapt based on
 * the user's authentication state. Shows login for guests,
 * and bookings + user dropdown for authenticated users.
 *
 * Features:
 * - Responsive Bootstrap navbar with RTL support
 * - Conditional rendering based on auth state
 * - Active link highlighting via NavLink
 * - UserDropdown with hover menu (edit profile, logout)
 */

import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import UserDropdown from "./UserDropdown";

export default function Navbar() {
  const { token } = useAuth();

  return (
    <nav className="navbar navbar-expand-md navbar-dark main-navigation">
      <div className="container-fluid">
        <NavLink to="/events" className="navbar-brand">
          <h1>مناسبات عمرو</h1>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="تبديل القائمة"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className="collapse navbar-collapse main-navigation-items"
          id="navbarContent"
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink to="/events">المناسبات</NavLink>
            </li>

            {token && (
              <li className="nav-item">
                <NavLink to="/bookings">حجوزاتي</NavLink>
              </li>
            )}

            {token && (
              <li className="nav-item">
                <NavLink to="/my-events">مناسباتي</NavLink>
              </li>
            )}

            {!token && (
              <li className="nav-item">
                <NavLink to="/login">تسجيل دخول</NavLink>
              </li>
            )}
          </ul>

          {token && (
            <ul className="navbar-nav">
              <li className="nav-item">
                <UserDropdown />
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
