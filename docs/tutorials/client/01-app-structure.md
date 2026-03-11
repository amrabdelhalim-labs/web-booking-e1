# الدرس الأول (العميل): هيكل التطبيق والتوجيه 🗺️

> **هدف الدرس:** فهم كيف يُنظَّم تطبيق React ويوجَّه المستخدمون بين الصفحات

---

## 1. نظرة عامة على مجلد `client/`

```text
client/src/
├── App.tsx  // نقطة البداية + التوجيه الرئيسي
├── main.tsx  // نقطة دخول React والـ Apollo Client
├── config.ts  // إعدادات الـ URLs
├── context/
│   ├── auth-context.ts  // تعريف واجهة المصادقة
│   └── AuthProvider.tsx  // مزوّد حالة المصادقة
├── hooks/
│   └── useAuth.ts  // خطاف الوصول للمصادقة
├── graphql/
│   ├── fragments.ts  // حقول مشتركة
│   └── queries.ts  // كل الاستعلامات والطفرات
├── components/  // مكونات قابلة لإعادة الاستخدام
└── pages/  // صفحات التطبيق
```

---

## 2. ملف `App.tsx` — قلب التطبيق

```tsx
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### الطبقات (من الخارج للداخل):

```text
<BrowserRouter>  // يُمكّن التنقل بين الصفحات
  <AuthProvider>  // يوفر بيانات المصادقة لكل التطبيق
    <AppRoutes />  // يُحدد الصفحات والمسارات
  </AuthProvider>
</BrowserRouter>
```

**`basename={import.meta.env.BASE_URL}`:**  
يُضبط المسار الأساسي للتطبيق عند نشره على GitHub Pages  
(مثلاً: `.../web-booking-e1/events` بدلاً من `.../events`)

---

## 3. لماذا `AppRoutes` مكوّن منفصل؟

```tsx
export default function App() {
// ❌ لن يعمل — يستخدم useAuth خارج AuthProvider
  const { token } = useAuth(); // خطأ!
  return (
    <AuthProvider>
      {token && <Navigate to="/events" />}
    </AuthProvider>
  );
}
```

```tsx
function AppRoutes() {
// ✅ يعمل — AppRoutes داخل AuthProvider يمكنه استخدام useAuth
  const { token } = useAuth(); // ✓ داخل AuthProvider
  // ...
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />  {/*  // داخل AuthProvider */}
    </AuthProvider>
  );
}
```

**القاعدة:** `useAuth()` لا يعمل إلا داخل `<AuthProvider>`.  
لذلك جعلنا `AppRoutes` مكوناً منفصلاً داخل `<AuthProvider>`.

---

## 4. التوجيه في `AppRoutes`

```tsx
function AppRoutes() {
  const { token } = useAuth(); // هل المستخدم مسجّل؟

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* إعادة توجيه المسجّلين بعيداً عن صفحات الدخول */}
          {token && <Route path="/login" element={<Navigate replace to="/events" />} />}
          <Route path="/login" element={<LoginPage />} />

          {token && <Route path="/signup" element={<Navigate replace to="/events" />} />}
          <Route path="/signup" element={<SignUpPage />} />

          {/* توجيه / إلى /events */}
          <Route path="/" element={<Navigate replace to="/events" />} />

          {/* صفحات عامة */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/user/:userId" element={<UserEventsPage />} />

          {/* صفحات محمية */}
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

          {/* 404 - يجب أن يكون آخر Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}
```

---

## 5. جدول المسارات

| المسار | الصفحة | مَن يدخل؟ |
|--------|--------|-----------|
| `/` | تحويل إلى `/events` | الجميع |
| `/events` | قائمة المناسبات | الجميع |
| `/events/user/:userId` | مناسبات مستخدم | الجميع |
| `/login` | تسجيل الدخول | غير المسجّلين فقط |
| `/signup` | إنشاء حساب | غير المسجّلين فقط |
| `/bookings` | حجوزاتي | المسجّلون فقط |
| `/my-events` | مناسباتي | المسجّلون فقط |
| `/*` | صفحة 404 | الجميع |

---

## 6. منطق الحماية المزدوج

### لمستخدم مسجّل يذهب لـ `/login`:

```text
token = "eyJ..." (موجود)
    ↓
{token && <Route path="/login" element={<Navigate to="/events" />} />}
    ↓
هذا Route موجود  // ينتقل لـ /events مباشرة!
```

### لمستخدم غير مسجّل يذهب لـ `/bookings`:

```text
token = null (غير موجود)
    ↓
<Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
    ↓
PrivateRoute يفحص token → null  // ينتقل لـ /login!
```

---

## 7. `main.tsx` — نقطة دخول React

```tsx
// main.tsx (مبسّط)
import { ApolloProvider } from "@apollo/client";
import { client } from "./apolloClient";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
```

**`ApolloProvider`** = يوفر Apollo Client لكل التطبيق.  
كل مكون يمكنه الاستعلام من GraphQL عبره.

---

## 8. خلاصة

```text
main.tsx
  └── ApolloProvider (GraphQL Client متاح لكل التطبيق)
       └── App
            └── BrowserRouter (التوجيه)
                 └── AuthProvider (المصادقة متاحة لكل التطبيق)
                      └── AppRoutes
                           ├── Navbar
                           ├── Route: /events → EventsPage
                           ├── Route: /login → LoginPage (أو redirect)
                           ├── Route: /bookings → PrivateRoute → BookingsPage
                           └── Route: * → NotFoundPage
```
