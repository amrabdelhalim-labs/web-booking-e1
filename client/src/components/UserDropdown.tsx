/**
 * User Dropdown Component
 *
 * Displays the authenticated user's username in the navbar.
 * On hover, reveals a dropdown menu with:
 * - "تعديل البيانات" — opens the profile editor modal
 * - "تسجيل خروج" — logs the user out
 *
 * Features:
 * - CSS-only hover-triggered dropdown (no JS toggle)
 * - RTL-aware positioning
 * - Integrates ProfileEditor modal inline
 */

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import ProfileEditor from "./ProfileEditor";

export default function UserDropdown() {
  const { username, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div className="user-dropdown">
        <span className="user-dropdown-toggle">{username}</span>
        <ul className="user-dropdown-menu">
          <li>
            <button type="button" onClick={() => setShowProfile(true)}>
              تعديل البيانات
            </button>
          </li>
          <li>
            <button type="button" onClick={logout}>
              تسجيل خروج
            </button>
          </li>
        </ul>
      </div>

      {showProfile && (
        <ProfileEditor onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
