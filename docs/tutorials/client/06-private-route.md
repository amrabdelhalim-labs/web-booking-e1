# الدرس السادس (العميل): حارس المسار الخاص — PrivateRoute 🚧

> **هدف الدرس:** فهم كيف نحمي الصفحات على جانب العميل

---

## 1. ما هو `PrivateRoute`؟

مكوّن يعمل كـ **بوّاب** أمام الصفحات المحمية:

```
المستخدم يذهب لـ /bookings
    ↓
<PrivateRoute>
    ├── لديه token؟ → أكمل وأظهر <BookingsPage />
    └── لا token؟  → وجّهه لـ /login
```

---

## 2. الكود الكامل

```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
```

---

## 3. شرح كل سطر

### `interface PrivateRouteProps`
```tsx
interface PrivateRouteProps {
  children: React.ReactNode;
}
```
TypeScript يقول: "هذا المكوّن يقبل `children` فقط (أي مكوّن React داخله)."

### `const { token } = useAuth()`
يقرأ الـ token من `AuthContext`.  
- token موجود = مستخدم مسجّل  
- token = null = غير مسجّل

### `<Navigate replace to="/login" />`
مكوّن من React Router يُعيد التوجيه **فوراً بدون إظهار الصفحة**.  
`replace` = لا يُضيف إلى تاريخ الصفحات (نفس فكرة `navigate("/login", { replace: true })`)

### `return <>{children}</>`
إذا وصلنا لهذا السطر = المستخدم مسجّل ← نُظهر الصفحة المطلوبة.  
`<>...</>` = Fragment (لا يُضيف عنصر HTML إضافي)

---

## 4. كيف يُستخدم في `App.tsx`

```tsx
<Route
  path="/bookings"
  element={
    <PrivateRoute>       {/* ← الحارس */}
      <BookingsPage />   {/* ← الصفحة المحمية */}
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
```

---

## 5. مستويات الحماية

هذا المشروع يستخدم **حمايتين**:

### الحماية الأولى: العميل (PrivateRoute)
```
المستخدم → /bookings → PrivateRoute → لا token؟ → /login
```
سريعة، لكن يمكن تجاوزها (المستخدم قد يضع token مزيف)

### الحماية الثانية: الخادم (isAuthenticated)
```
طلب bookings → Resolver → isAuthenticated → context.user ؟
    ← لا → GraphQLError: UNAUTHENTICATED
    ← نعم → بيانات المستخدم فقط
```
لا يمكن تجاوزها — الخادم يتحقق من صحة الـ Token فعلياً

> **القاعدة الذهبية:** حماية العميل = تجربة مستخدم جيدة.  
> حماية الخادم = الأمان الحقيقي.  
> **يجب الاثنان معاً!** 🔐

---

## 6. مثال تتبع رحلة المستخدم

### سيناريو: مستخدم غير مسجّل يكتب `/bookings` مباشرة في المتصفح

```
[1] URL: /bookings
    ↓
[2] React Router يطابقه مع:
    <Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
    ↓
[3] PrivateRoute يُشغَّل:
    const { token } = useAuth(); // → null
    ↓
[4] !token → true
    return <Navigate replace to="/login" />
    ↓
[5] URL يتغير لـ /login
    المستخدم يرى صفحة تسجيل الدخول
```

### سيناريو: مستخدم مسجّل يذهب لـ `/bookings`

```
[1] URL: /bookings
    ↓
[2] PrivateRoute:
    const { token } = useAuth(); // → "eyJhbGci..."
    ↓
[3] !token → false (المستخدم مسجّل)
    return <>{children}</>
    ↓
[4] <BookingsPage /> تُظهر ✓
    ↓
[5] BookingsPage تُرسل طلب BOOKINGS query
    مع Token في الـ headers (Apollo authLink تفعل هذا تلقائياً)
    ↓
[6] الخادم: isAuthenticated يتحقق → context.user موجود → يُرجع الحجوزات ✓
```

---

## 7. خلاصة

```
PrivateRoute = حارس بسيط وفعّال:
    ✓ سطر واحد للتحقق: const { token } = useAuth()
    ✓ سطر واحد للرفض: return <Navigate to="/login" />
    ✓ سطر واحد للقبول: return <>{children}</>

يُستخدم كـ wrapper حول أي صفحة تحتاج مصادقة:
    <PrivateRoute>
      <YourProtectedPage />
    </PrivateRoute>
```
