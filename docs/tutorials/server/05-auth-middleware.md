# الدرس الخامس: حارس المصادقة في GraphQL 🛡️

> **هدف الدرس:** فهم كيف يُحمى الوصول للعمليات الحساسة في GraphQL

---

## 1. المشكلة: من يحق له فعل ماذا؟

في تطبيقنا:
- **الجميع** يمكنهم رؤية المناسبات ✅
- **المسجّلون فقط** يمكنهم إنشاء مناسبة، حجز، تعديل، حذف 🔒

كيف نُطبّق هذا في GraphQL؟

---

## 2. ملف `middlewares/isAuth.ts`

```typescript
import { GraphQLError } from "graphql";
import { skip } from "graphql-resolvers";

export const isAuthenticated = (
  _parent: unknown,
  _args: unknown,
  context: GraphQLContext
) => {
  if (!context.user) {
    throw new GraphQLError("يجب تسجيل الدخول أولاً!", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return skip; // ← تمرير التحكم للـ Resolver التالي
};
```

### شرح كل جزء:

**`context.user`** → كائن المستخدم الكامل، يوضع في الـ context عند كل طلب.  
إذا وُجد = المستخدم سجّل دخوله. إذا لم يوجد = لم يسجل.

**`throw new GraphQLError(...)`** → يوقف الطلب ويُرسل رسالة خطأ.  
`extensions: { code: "UNAUTHENTICATED" }` → كود الخطأ الذي يفهمه العميل.

**`return skip`** → من مكتبة `graphql-resolvers`.  
يعني: "هذا الحارس نجح، انتقل للخطوة التالية".

---

## 3. كيف يصل `context.user`؟

من ملف `server/src/index.ts`:
```typescript
context: async ({ req }) => {
  const auth = req.headers.authorization || "";
  if (!auth) return {};

  try {
    // auth = "jwt eyJhbGci..."
    // نزيل أول 4 أحرف "jwt " ← نحصل على الـ token فقط
    const token = auth.slice(4);
    const decodedToken = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await User.findById(decodedToken.id);
    return { user };
  } catch {
    return {};
  }
},
```

### ⚠️ تنبيه مهم: الـ Prefix

الخادم يتوقع الـ Token بصيغة: `jwt TOKEN` (بادئة "هjwt " أربعة أحرف).

لذلك نستخدم `auth.slice(4)` هنا (نزيل 4 أحرف "jwt ").

### الرحلة الكاملة:

```
[1] العميل يُرسل: Authorization: "jwt eyJhbGci..."
    ↓
[2] context function في index.ts تُفكّك الـ token
    → JWT.verify → يحصل على { id: "64ab12..." }
    → User.findById("64ab12...") → كائن المستخدم
    ↓
[3] { user: userObject } يُوضع في context
    ↓
[4] isAuthenticated يفحص: هل context.user موجود؟
    ← نعم → skip (تابع)
    ← لا  → throw GraphQLError (ارفض)
```

---

## 4. `combineResolvers` — دمج المحللات

```typescript
import { combineResolvers } from "graphql-resolvers";

// بدون حماية:
createEvent: async (_parent, { eventInput }, context) => { ... }

// مع حماية:
createEvent: combineResolvers(
  isAuthenticated,              // ← يُفحص أولاً
  async (_parent, { eventInput }, context) => { ... }  // ← ينفَّذ إذا نجح
)
```

**كيف يعمل `combineResolvers`؟**
```
[isAuthenticated] → إذا return skip → [actualResolver]
[isAuthenticated] → إذا throw error → توقف، أرسل الخطأ للعميل
```

يمكن إضافة أكثر من حارس:
```typescript
combineResolvers(
  isAuthenticated,   // هل سجّل؟
  isOwner,          // هل هو المالك؟
  actualResolver    // العملية الفعلية
)
```

---

## 5. رموز الأخطاء القياسية في GraphQL

| الكود | المعنى |
|-------|--------|
| `UNAUTHENTICATED` | لم يسجّل الدخول |
| `FORBIDDEN` | سجّل لكن ليس لديه صلاحية |
| `BAD_USER_INPUT` | مدخلات خاطئة |
| `NOT_FOUND` | البيان غير موجود |

---

## 6. مثال عملي كامل

**الموقف:** مستخدم غير مسجّل يحاول حجز مناسبة.

```
العميل يرسل:
mutation {
  bookEvent(eventId: "abc123") {
    _id
  }
}
(بدون Authorization header)

    ↓
context يُعيد: {}  (لا user)
    ↓
combineResolvers ينفّذ isAuthenticated أولاً
    ↓
isAuthenticated: context.user ؟ ... لا!
    ↓
throw GraphQLError("يجب تسجيل الدخول أولاً!")
    ↓
الاستجابة للعميل:
{
  "errors": [{
    "message": "يجب تسجيل الدخول أولاً!",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

---

## 7. خلاصة

- **`isAuthenticated`** = حارس بسيط يفحص `context.user`
- **`combineResolvers`** = يُتيح تجميع محللات على التسلسل
- **`context`** = حقيبة تُرسَل مع كل طلب، تحمل بيانات مشتركة
- الـ Prefix في هذا المشروع هو `"jwt "` (4 أحرف)
- `return skip` = "نجح الحارس، انتقل للتالي"
- `throw GraphQLError` = "فشل الحارس، أوقف كل شيء"
