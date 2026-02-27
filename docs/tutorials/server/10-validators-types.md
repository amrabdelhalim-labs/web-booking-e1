````markdown
# الدرس العاشر: المدققات والأنواع والتحويلات 🔍

> **هدف الدرس:** فهم طبقة التحقق من المدخلات، الأنواع المشتركة TypeScript، دوال تحويل البيانات، ودمج المحلّلات

---

## 1. لماذا هذه الملفات مهمة؟

| الملف | دوره |
|-------|------|
| `validators/index.ts` | يتحقق من صحة المدخلات قبل أي عملية قاعدة بيانات |
| `types/index.ts` | يُعرّف عقود TypeScript المشتركة بين جميع طبقات الخادم |
| `resolvers/transform.ts` | يُحوّل مستندات Mongoose إلى شكل صالح لـ GraphQL |
| `resolvers/index.ts` | يدمج جميع المحلّلات في كائن واحد |

---

## 2. `validators/index.ts` — التحقق من المدخلات

### المبدأ العام

```typescript
// نمط موحّد لكل دالة تحقق:
export function validateUserInput(input: UserInput): void {
  const errors: string[] = [];

  // 1. اجمع كل الأخطاء في مصفوفة
  if (!input.username || input.username.trim().length < 3) {
    errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  }
  if (!input.email || !input.email.includes('@')) {
    errors.push('البريد الالكتروني غير صحيح');
  }
  if (!input.password || input.password.trim().length < 6) {
    errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }

  // 2. إذا وُجد خطأ، ارمِ GraphQLError واحداً بكل الأخطاء
  if (errors.length > 0) {
    throw new GraphQLError(errors.join('، '), {
      extensions: { code: 'BAD_USER_INPUT', errors },
    });
  }
}
```

### لماذا `GraphQLError` لا `throw new Error`؟

| `Error` العادي | `GraphQLError` |
|----------------|----------------|
| يُعاد كـ `500 Internal Server Error` | يُعاد ضمن `errors[]` في رد GraphQL |
| لا يصل للعميل بشكل نظيف | يصل بـ `code` قابل للمعالجة |
| لا يدعم بيانات إضافية | يدعم `extensions` مخصصة |

### الرد الذي يصل للعميل

```json
{
  "errors": [
    {
      "message": "اسم المستخدم يجب أن يكون 3 أحرف على الأقل، كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "errors": [
          "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        ]
      }
    }
  ]
}
```

### الدوال الخمس المتاحة

```typescript
// للتسجيل الجديد — يتحقق من username + email + password
validateUserInput({ username, email, password })

// لتحديث المستخدم — كل الحقول اختيارية لكن واحد على الأقل مطلوب
validateUpdateUserInput({ username?, password? })

// لتسجيل الدخول — يتحقق من email + password فقط
validateLoginInput({ email, password })

// لإنشاء مناسبة جديدة — يتحقق من title + description + price + date
validateEventInput({ title, description, price, date })

// لتحديث مناسبة — كل الحقول اختيارية
validateUpdateEventInput({ title?, description?, price?, date? })
```

### الاستخدام في المحلّلات

```typescript
// في resolvers/auth.ts — يُستدعى قبل أي عملية
createUser: async (_parent, { userInput }) => {
  validateUserInput(userInput);        // ← يرمي GraphQLError إذا فشل
  // ... الآن نتابع بثقة
  const hashedPassword = await bcrypt.hash(userInput.password, 12);
}
```

> **ملاحظة التصميم:** المحلّل يُنفَّذ فقط إذا اجتاز التحقق — لأن `GraphQLError` يقطع التنفيذ فوراً

---

## 3. `types/index.ts` — الأنواع المشتركة

### طبقات الأنواع

```
types/index.ts
├── Mongoose Document Interfaces  → IUser, IEvent, IBooking
├── GraphQL Context               → GraphQLContext, JwtPayload
├── Auth Types                    → AuthData
└── Input Types                   → UserInput, UpdateUserInput, EventInput, UpdateEventInput
```

### واجهات Mongoose

```typescript
// تمتد من Document — أي أنها تدعم كل دوال Mongoose
export interface IUser extends Document {
  _doc?: any;        // ← انتبه: مطلوب للـ transform (شرح لاحق)
  username: string;
  email: string;
  password: string;
}

export interface IEvent extends Document {
  _doc?: any;
  title: string;
  description: string;
  price: number;
  date: Date;
  creator: Types.ObjectId | IUser;  // ← مرتبط أو مُولَّج (populated)
}

export interface IBooking extends Document {
  _doc?: any;
  event: Types.ObjectId | IEvent;
  user: Types.ObjectId | IUser;
  createdAt: Date;   // ← تُضاف تلقائياً بـ { timestamps: true }
  updatedAt: Date;
}
```

### لماذا `_doc?: any`؟

حقل `_doc` داخلي في Mongoose يحتوي البيانات "النقية" بدون الدوال المضافة:

```typescript
// المستند الكامل (مع دوال Mongoose):
event = { title, price, date, save(), populate(), ... }

// event._doc (البيانات فقط):
event._doc = { title, price, date }
```

هذا ضروري في `transformEvent` (شرح في القسم التالي).

### سياق GraphQL

```typescript
export interface JwtPayload {
  id: string;   // ← userId المشفّر في الـ token
  iat?: number; // ← وقت الإصدار (issued at)
  exp?: number; // ← وقت الانتهاء (expiration)
}

export interface GraphQLContext {
  user?: IUser | null;  // ← null إذا لم يُسجَّل دخول، IUser إذا سُجِّل
}
```

### كيف يُحقن `GraphQLContext`؟

```typescript
// في server/src/index.ts:
context: async ({ req }) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('jwt ')) return {};

  const token = auth.slice(4);          // أزل "jwt "
  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  const user = await User.findById(decoded.id);

  return { user };   // ← يُصبح متاحاً في كل resolver كـ context.user
}
```

### أنواع المدخلات

```typescript
export interface UserInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
}

export interface EventInput {
  title: string;
  description: string;
  price: number;
  date: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  price?: number;
  date?: string;
}
```

> هذه الأنواع تُستخدم في المحلّلات والمدققات معاً — مصدر حقيقة واحد (Single Source of Truth)

---

## 4. `resolvers/transform.ts` — تحويل البيانات

### المشكلة: فجوة الأنواع

MongoDB تُعيد `Date` objects، لكن GraphQL Schema تتوقع `String`:

```graphql
# في Schema:
type Event {
  date: String!   # ← GraphQL يريد نصاً
}
```

```typescript
// ما يعيده Mongoose:
event.date = Date object  // ← ليس نصاً!
```

### الحل: `transformEvent`

```typescript
export const transformEvent = (event: IEvent) => ({
  ...event._doc,                                         // [1] انشر كل حقول المستند
  date: new Date(event.date).toISOString().replace(/T/, " "), // [2] حوّل التاريخ
});
```

**تفصيل كل خطوة:**

```
1. ...event._doc
   ↓ ينشر البيانات النقية (بدون دوال Mongoose)
   { _id, title, description, price, date, creator }

2. date: new Date(event.date).toISOString().replace(/T/, " ")
   ↓ Date object → "2024-01-15T18:30:00.000Z" → "2024-01-15 18:30:00.000Z"
```

> **لماذا `_doc` وليس `event` مباشرة؟**
> لأن انتشار `event` يشمل دوال Mongoose مثل `save()` و`populate()`. أما `_doc` فيحتوي البيانات فقط.

### `transformBooking`

```typescript
export const transformBooking = (booking: IBooking) => ({
  ...booking._doc,
  createdAt: new Date(booking.createdAt).toISOString().replace(/T/, " "),
  updatedAt: new Date(booking.updatedAt).toISOString().replace(/T/, " "),
});
```

`Booking` له تاريخان (`createdAt` و`updatedAt`) لأنه يستخدم `{ timestamps: true }` في النموذج.

### مثال على المخرجات

```typescript
// الإدخال (من Mongoose):
{
  _id: ObjectId("..."),
  title: "حفلة موسيقية",
  price: 150,
  date: Date("2024-06-15T18:30:00.000Z"),
  creator: { username: "أحمد" }
}

// الإخراج (بعد transformEvent):
{
  _id: "...",
  title: "حفلة موسيقية",
  price: 150,
  date: "2024-06-15 18:30:00.000Z",  // ← نص الآن
  creator: { username: "أحمد" }
}
```

---

## 5. `resolvers/index.ts` — دمج المحلّلات

### المشكلة: محلّلات منفصلة

كل domain له ملف محلّلات مستقل:

```
resolvers/
├── auth.ts      → { Query: {}, Mutation: { createUser, login, updateUser, deleteUser } }
├── event.ts     → { Query: { events, getUserEvents }, Mutation: { createEvent, ... } }
└── booking.ts   → { Query: { bookings }, Mutation: { bookEvent, cancelBooking } }
```

لكن Apollo Server يتوقع **كائناً واحداً** بكل المحلّلات.

### الحل: `lodash.merge`

```typescript
import { merge } from 'lodash';
import authResolver from './auth';
import bookingResolver from './booking';
import eventResolver from './event';

const resolvers = merge(authResolver, bookingResolver, eventResolver);
export default resolvers;
```

### لماذا `merge` وليس `Object.assign` أو `{...spread}`؟

```typescript
// المشكلة مع spread:
const merged = { ...authResolver, ...eventResolver };
// إذا كان لديهما نفس المفتاح (مثل Query):
// ← eventResolver.Query سيحل محل authResolver.Query كاملاً!

// الحل مع lodash.merge:
const merged = merge(authResolver, eventResolver);
// ← يدمج Query من الملفين معاً بدلاً من استبدال أحدهما
```

**مثال الفرق:**

```typescript
// authResolver:
{ Query: { getUserEvents: fn }, Mutation: { createUser: fn } }

// eventResolver:
{ Query: { events: fn }, Mutation: { createEvent: fn } }

// بـ merge:
{
  Query: { getUserEvents: fn, events: fn },     // ← مدمجان
  Mutation: { createUser: fn, createEvent: fn } // ← مدمجان
}

// بـ spread (❌ خطأ):
{
  Query: { events: fn },       // ← فقط من eventResolver!
  Mutation: { createEvent: fn }
}
```

---

## 6. تدفق الطلب الكامل (مع هذه الطبقات)

```
GraphQL Request
      │
      ▼
[Apollo Server] يستقبل الطلب
      │
      ▼
[index.ts context] يحقن user من JWT
      │
      ▼
[resolvers/index.ts] يُحدد المحلّل الصحيح
      │
      ▼
[isAuthenticated] (إذا كانت العملية محمية)
      │
      ▼
[validators/index.ts] يتحقق من المدخلات
      │
      ▼
[Repository] يُنفذ عملية قاعدة البيانات
      │
      ▼
[resolvers/transform.ts] يُحوّل البيانات
      │
      ▼
[Apollo Server] يُعيد الرد للعميل
```

---

## 7. خلاصة

| المفهوم | التطبيق |
|---------|---------|
| التحقق مبكراً | `validateInput()` أول سطر في كل Mutation |
| أخطاء واضحة | `GraphQLError` مع `code: 'BAD_USER_INPUT'` وأخطاء عربية |
| أنواع مركزية | `types/index.ts` ← مصدر حقيقة واحد |
| تحويل البيانات | `transform.ts` جسر بين Mongoose وGraphQL |
| دمج آمن | `lodash.merge` يجمع المحلّلات بدون تعارض |

> **أفضل ممارسة:** أضف التحقق دائماً في طبقة المحلّل، لا في المستودع — المستودع مسؤول فقط عن قاعدة البيانات
````
