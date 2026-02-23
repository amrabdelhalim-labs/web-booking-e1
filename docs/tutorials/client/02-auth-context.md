# الدرس الثاني (العميل): سياق المصادقة وخطاف `useAuth` 🔑

> **هدف الدرس:** فهم كيف تُخزَّن بيانات المصادقة وتُتاح لكل مكونات التطبيق

---

## 1. المشكلة: كيف نشارك الـ Token بين المكونات؟

```
App
 ├── Navbar         ← يحتاج: هل المستخدم مسجّل؟ ما اسمه؟
 ├── EventsPage     ← يحتاج: هل نعرض زر "إنشاء مناسبة"؟
 ├── BookingsPage   ← يحتاج: token لإرساله مع الطلب
 └── PrivateRoute   ← يحتاج: هل لديه token؟
```

**الحل الخاطئ:** تمرير الـ token كـ prop من App لكل مكوّن.  
→ "Prop Drilling" = كود معقد وسيء! 😩

**الحل الصحيح:** React Context = بيانات "عالمية" متاحة لأي مكوّن مباشرة.

---

## 2. الملفات الثلاثة:

```
auth-context.ts    ← تعريف الواجهة + إنشاء الـ Context
AuthProvider.tsx   ← الحالة الفعلية والمنطق
useAuth.ts         ← خطاف مريح للوصول للـ Context
```

---

## 3. `auth-context.ts` — تعريف الشكل

```typescript
import { createContext } from "react";

// الواجهة: ماذا يحوي الـ Context؟
export interface AuthContextType {
  token: string | null;      // JWT Token أو null
  userId: string | null;     // ID المستخدم أو null
  username: string | null;   // اسم المستخدم أو null
  login: (token: string, userId: string, username: string) => void;
  logout: () => void;
}

// إنشاء الـ Context بقيم افتراضية فارغة
const AuthContext = createContext<AuthContextType>({
  token: null,
  userId: null,
  username: null,
  login: () => {},   // دالة فارغة كقيمة افتراضية
  logout: () => {},
});

export default AuthContext;
```

**`createContext`** = ينشئ "وعاء" يمكن وضع البيانات فيه وأخذها من أي مكان.

---

## 4. `AuthProvider.tsx` — المنطق الفعلي

```tsx
export default function AuthProvider({ children }: AuthProviderProps) {
  // [1] قراءة البيانات المحفوظة مسبقاً (مستمرة عند تحديث الصفحة)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")    // ← عند التحميل أول مرة
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("userId")
  );
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem("username")
  );

  // [2] دالة تسجيل الدخول — تحفظ في الحالة + localStorage
  const login = useCallback((userToken, loginUserId, loginUsername) => {
    setToken(userToken);
    localStorage.setItem("token", userToken);

    setUserId(loginUserId);
    localStorage.setItem("userId", loginUserId);

    setUsername(loginUsername);
    localStorage.setItem("username", loginUsername);
  }, []);

  // [3] دالة تسجيل الخروج — تمسح كل شيء
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUsername(null);
    localStorage.clear();   // ← احذف كل ما في localStorage
  }, []);

  // [4] تغليف الأبناء بالـ Context
  return (
    <AuthContext.Provider value={{ token, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 5. لماذا `localStorage`؟

```
بدون localStorage:
- المستخدم يسجّل دخوله ✓
- يضغط F5 (تحديث الصفحة) ← token يختفي!
- يجد نفسه مسجّل خروجه 😲

مع localStorage:
- token يُحفظ في المتصفح
- عند التحديث: useState يقرأ localStorage → token لا يزال موجود ✓
```

---

## 6. `useAuth.ts` — الخطاف المريح

```typescript
import { useContext } from "react";
import AuthContext from "../context/auth-context";
import type { AuthContextType } from "../context/auth-context";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

**بدون `useAuth`:**
```tsx
// في كل مكون يحتاج Authentication:
const context = useContext(AuthContext);  // 3 أسطر
if (!context) throw new Error("...");
const { token, login } = context;
```

**مع `useAuth`:**
```tsx
// سطر واحد!
const { token, login, logout } = useAuth();
```

---

## 7. استخدام `useAuth` في المكونات

### في Navbar:
```tsx
const { token, username, logout } = useAuth();

return (
  <nav>
    {token ? (
      <>
        <span>مرحباً {username}!</span>
        <button onClick={logout}>خروج</button>
      </>
    ) : (
      <Link to="/login">دخول</Link>
    )}
  </nav>
);
```

### في LoginPage:
```tsx
const { login } = useAuth();

// بعد نجاح mutation تسجيل الدخول:
login(data.login.token, data.login.userId, data.login.username);
```

### في PrivateRoute:
```tsx
const { token } = useAuth();
if (!token) return <Navigate to="/login" />;
// إذا وصلنا هنا → المستخدم مسجّل
```

---

## 8. `useCallback` — لماذا نستخدمه؟

```typescript
const login = useCallback((token, userId, username) => {
  // ...
}, []);  // ← [] = لا يتغير إطلاقاً
```

`useCallback` يمنع إنشاء دالة `login` جديدة في **كل** render.  
بدونه → مكونات كثيرة تُعيد الرسم بلا سبب عند تغيير أي حالة في `AuthProvider`.

---

## 9. الرحلة الكاملة: من تسجيل الدخول للوصول

```
[1] LoginPage: useMutation(LOGIN) → GraphQL mutation
    ↓
[2] الخادم يُرجع: { token, userId, username }
    ↓
[3] LoginPage تستدعي: login(token, userId, username)
    ↓
[4] AuthProvider:
    setToken(token) → يُحدّث الحالة
    localStorage.setItem("token", token) → يُحفظ في المتصفح
    ↓
[5] كل المكونات التي تستخدم useAuth() تحصل على القيم الجديدة تلقائياً!
    ↓
[6] Navbar يرى token → يُظهر اسم المستخدم
    AppRoutes يرى token → يُعيد توجيه /login إلى /events
```
