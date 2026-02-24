/**
 * إعداد بيئة الاختبارات (Test Setup)
 * ─────────────────────────────────────
 * يتم تحميل هذا الملف تلقائياً قبل كل ملف اختبار عبر Vitest.
 *
 * يقوم بـ:
 *  1. إضافة matchers مكتبة jest-dom (مثل toBeInTheDocument)
 *  2. محاكاة (Mock) واجهات المتصفح غير المتوفرة في بيئة jsdom
 *  3. محاكاة localStorage
 */
import '@testing-library/jest-dom';

// ─── محاكاة localStorage (في حال لم توفرها jsdom بالكامل) ───
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ─── محاكاة import.meta.env ───
if (!import.meta.env.BASE_URL) {
  Object.defineProperty(import.meta.env, 'BASE_URL', { value: '/' });
}
