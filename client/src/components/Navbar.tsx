/**
 * Navigation Bar Component
 *
 * Displays the main navigation with links that adapt based on
 * the user's authentication state. Shows login/signup for guests,
 * and bookings/logout for authenticated users.
 *
 * TODO: Implement full navigation (Phase 3.2)
 */

import { useContext } from "react";
import { NavLink } from "react-router-dom";
import AuthContext from "../context/auth-context";

export default function Navbar() {
  const { token, username, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-md navbar-light main-navigation">
      <div className="container-fluid">
        <NavLink to="/events" className="navbar-brand">
          <h1>مناسبات حسوب</h1>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse main-navigation-items"
          id="navbarContent"
        >
          <ul className="navbar-nav me-auto">
            {/* Show bookings link only for authenticated users */}
            {token && (
              <li className="nav-item">
                <NavLink to="/bookings">حجوزاتي</NavLink>
              </li>
            )}

            {/* Show login link only for guests */}
            {!token && (
              <li className="nav-item">
                <NavLink to="/login">تسجيل دخول</NavLink>
              </li>
            )}

            <li className="nav-item">
              <NavLink to="/events">المناسبات</NavLink>
            </li>
          </ul>

          {/* User actions for authenticated users */}
          {token && (
            <ul className="navbar-nav">
              <button onClick={logout}>تسجيل خروج</button>
              <li className="nav-item">
                <NavLink to="#">{username}</NavLink>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
