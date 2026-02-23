/**
 * useAuth — خطاف المصادقة
 * ────────────────────────
 * غلاف مريح حول AuthContext يتحقق من وجود السياق
 * ويوفر دوال وقيم المصادقة مباشرة.
 *
 * الاستخدام:
 * ```tsx
 * const { token, userId, username, login, logout } = useAuth();
 * ```
 */

import { useContext } from "react";
import AuthContext from "../context/auth-context";
import type { AuthContextType } from "../context/auth-context";

/**
 * يقرأ سياق المصادقة ويعيده.
 * يرمي خطأ إذا استُخدم خارج AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
