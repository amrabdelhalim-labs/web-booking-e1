/**
 * مكون موفر المصادقة (Auth Provider)
 * ────────────────────────────────────
 * يغلف شجرة المكونات بسياق المصادقة.
 * يدير حالة المصادقة (token, userId, username)
 * ويوفر دوال login و logout لجميع المكونات الفرعية.
 *
 * النمط: مطابق لـ AuthContextProvider في مشروع وصفاتي
 *
 * الموقع: client/src/context/AuthProvider.tsx
 */

import { useState, useCallback, type ReactNode } from "react";
import AuthContext from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * يقرأ القيم المخزنة في localStorage عند التحميل الأول
 * ويوفرها عبر AuthContext لجميع المكونات.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
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
   * يخزن بيانات المصادقة في الحالة و localStorage.
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
   * يمسح بيانات المصادقة من الحالة و localStorage.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.clear();
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
