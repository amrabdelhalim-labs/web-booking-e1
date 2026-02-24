/**
 * اختبارات خطاف المصادقة (useAuth Hook)
 * ═══════════════════════════════════════
 *
 * تتحقق من:
 *  1. useAuth يعيد قيم السياق بشكل صحيح
 *  2. useAuth يعمل داخل AuthProvider
 *  3. دوال login و logout تعمل بشكل صحيح
 *  4. البيانات تُخزّن وتُمسح من localStorage
 *
 * الملف: client/src/tests/useAuth.test.tsx
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import AuthProvider from '../context/AuthProvider';
import type { ReactNode } from 'react';

// ─── غلاف AuthProvider للاختبارات ───
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth — خطاف المصادقة', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('يجب أن يعيد القيم الأولية عندما لا يوجد token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.username).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('يجب أن يقرأ token من localStorage عند التحميل', () => {
    localStorage.setItem('token', 'test-token-123');
    localStorage.setItem('userId', 'user-456');
    localStorage.setItem('username', 'أحمد');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('test-token-123');
    expect(result.current.userId).toBe('user-456');
    expect(result.current.username).toBe('أحمد');
  });

  it('يجب أن تخزّن login البيانات في الحالة و localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login('new-token', 'new-user-id', 'سارة');
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.userId).toBe('new-user-id');
    expect(result.current.username).toBe('سارة');
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('userId')).toBe('new-user-id');
    expect(localStorage.getItem('username')).toBe('سارة');
  });

  it('يجب أن تمسح logout جميع البيانات', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('userId', 'test-user');
    localStorage.setItem('username', 'تست');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('test-token');

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.username).toBeNull();
  });

  it('يجب أن تعمل login ثم logout بالتتابع', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // تسجيل دخول
    act(() => {
      result.current.login('token-1', 'user-1', 'محمد');
    });
    expect(result.current.token).toBe('token-1');

    // تسجيل خروج
    act(() => {
      result.current.logout();
    });
    expect(result.current.token).toBeNull();

    // تسجيل دخول مرة أخرى
    act(() => {
      result.current.login('token-2', 'user-2', 'علي');
    });
    expect(result.current.token).toBe('token-2');
    expect(result.current.username).toBe('علي');
  });
});
