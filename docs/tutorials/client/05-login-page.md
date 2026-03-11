# الدرس الخامس (العميل): صفحة تسجيل الدخول 🚪

> **هدف الدرس:** فهم كيف تعمل صفحة تسجيل الدخول من الحالة إلى الـ GraphQL mutation

---

## 1. الملف: `pages/Login.tsx`

الصفحة تقوم بـ:
1. عرض نموذج (form) ببريد وكلمة مرور
2. عند الإرسال → إرسال mutation لـ GraphQL
3. عند النجاح → حفظ بيانات المصادقة والانتقال للمناسبات
4. عند الفشل → عرض رسالة خطأ

---

## 2. استيراد الأدوات

```tsx
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../graphql/queries";
import { useAuth } from "../hooks/useAuth";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";
```

| الأداة | الغرض |
|-------|--------|
| `useState` | إدارة حالة النموذج (email, password, رسالة الخطأ) |
| `useEffect` | تنفيذ إجراء عند تغيير البيانات |
| `useNavigate` | التنقل البرمجي بين الصفحات |
| `useMutation` | تنفيذ GraphQL mutation |
| `useAuth` | الوصول لدالة `login` لحفظ البيانات |

---

## 3. الحالات الداخلية

```tsx
const [alert, setAlert] = useState("");      // رسالة الخطأ
const [email, setEmail] = useState("");      // البريد الإلكتروني
const [password, setPassword] = useState(""); // كلمة المرور
```

---

## 4. `useMutation` — الطفرة

```tsx
const [loginMutation, { loading, data }] = useMutation(LOGIN, {
  onError: (error) => setAlert(error.message),
});
```

`useMutation` يُرجع:
- **`loginMutation`** = دالة نستدعيها عند الإرسال
- **`loading`** = هل الطلب جارٍ؟ (نُظهر Spinner)
- **`data`** = النتيجة عند النجاح
- **`onError`** = دالة تُستدعى عند الفشل (نحفظ الخطأ في `alert`)

---

## 5. `useEffect` — التفاعل مع النتائج

```tsx
useEffect(() => {
  if (!loading && data) {
    const { token, userId, username } = data.login;
    login(token, userId, username);      // [1] احفظ في Context + localStorage
    navigate("/events", { replace: true }); // [2] انتقل للمناسبات
  }
}, [data, loading, login, navigate]);
```

**لماذا `useEffect` وليس مباشرة في `onSuccess`؟**

Apollo's `useMutation` لا يوفر `onSuccess` مباشرة.  
`useEffect` يراقب `data` و `loading`:
- `loading = false` = انتهى الطلب
- `data` موجود = نجح الطلب
- كلاهما معاً = تنفيذ إجراء ما بعد النجاح

**`{ replace: true }`:**  
يُبدّل السجل الحالي في تاريخ الصفحات بدلاً من إضافة جديد.  
= الزر "رجوع" لن يعيدك لصفحة تسجيل الدخول بعد أن دخلت ✓

---

## 6. معالج الإرسال

```tsx
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();       // [1] منع إعادة تحميل الصفحة
  setAlert("");             // [2] امسح أي خطأ سابق
  loginMutation({
    variables: {
      email: email.trim(),     // [3] أزل المسافات الزائدة
      password: password.trim(),
    },
  });
};
```

**`e.preventDefault()`** = الأحداث الافتراضية لـ `form` تُعيد تحميل الصفحة!  
نمنع ذلك لنتحكم بالسلوك بأنفسنا.

---

## 7. الشرط الخاص بـ Loading

```tsx
if (loading) return <Spinner />;
```

أثناء انتظار الخادم → نُخفي النموذج ونُظهر دوراً تحميل.  
لماذا؟ لمنع المستخدم من الضغط على الزر أكثر من مرة.

---

## 8. النموذج (Form)

```tsx
return (
  <form className="auth-form" onSubmit={handleSubmit}>
    <Alert message={alert} />    {/*  // رسالة الخطأ */}

    <div className="mb-3">
      <label htmlFor="login-email">البريد الالكتروني</label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={({ target }) => setEmail(target.value)}  // ← state مرتبطة
        required
        autoComplete="email"
      />
    </div>

    <div className="mb-3">
      <label htmlFor="login-password">كلمة المرور</label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={({ target }) => setPassword(target.value)}
        required
        minLength={6}                    // ← 6 أحرف على الأقل
        autoComplete="current-password"
      />
    </div>

    <div className="form-actions">
      <button type="submit">تسجيل الدخول</button>
      <button type="button" onClick={() => navigate("/signup")}>
        انتقل إلى إنشاء حساب
      </button>
    </div>
  </form>
);
```

---

## 9. Controlled Component — المعنى

```tsx
value={email}                              // ← القيمة من state
onChange={({ target }) => setEmail(target.value)}  // ← تحديث state عند الكتابة
```

ما يكتبه المستخدم → `onChange` → `setEmail` → `email` state → `value`  
(React يتحكم بالقيمة = "Controlled")

---

## 10. تدفق تسجيل الدخول الكامل

```text
[3] loginMutation({ variables: { email, password } })
    ↓
[2] يضغط "تسجيل الدخول" → handleSubmit
    ↓
[1] المستخدم يكتب email و password
    ↓ (HTTP POST إلى /graphql)
[4] الخادم: validateLoginInput → findByEmail → bcrypt.compare → jwt.sign
    ↓ (النتيجة)
[5] النجاح → data.login = { token, userId, username }
    أو الفشل → onError → setAlert(error.message)
    ↓ (عند النجاح)
[6] useEffect → login(token, userId, username) → localStorage
    ↓
[7] navigate("/events", { replace: true })
    ↓
[8] AppRoutes يرى token  // يُحوّل /login إلى /events
```
