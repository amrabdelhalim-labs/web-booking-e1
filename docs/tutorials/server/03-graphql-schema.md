# الدرس الثالث: مخطط GraphQL — عقد الاتفاق بين العميل والخادم 📋

> **هدف الدرس:** فهم كيف يُعرَّف مخطط GraphQL وما هو دوره في التطبيق

---

## 1. ما الفرق بين REST و GraphQL؟

### REST التقليدي:
```http
GET  /api/posts  // كل المنشورات
GET  /api/posts/1  // منشور واحد
POST /api/posts  // إنشاء منشور
PUT  /api/posts/1  // تعديل منشور
DELETE /api/posts/1  // حذف منشور
```
لكل عملية **مسار مختلف** في الرابط.

### GraphQL (هذا المشروع):
```http
POST /graphql  // مسار **واحد** فقط لكل شيء!
```

في GraphQL، بدلاً من تغيير المسار، نغيّر **نص الاستعلام**:
```graphql
query { events { title price } }
# اقرأ

# أنشئ  
mutation { createEvent(eventInput: {...}) { _id title } }

# اشترك للتحديثات الفورية
subscription { eventAdded { title } }
```

---

## 2. ما هو المخطط (Schema)؟

المخطط = **عقد الاتفاق** بين العميل والخادم.

يقول: "هذه الأنواع الموجودة، وهذه الاستعلامات المتاحة، وهذه البيانات التي ستُرسَل."

إذا طلب العميل حقلاً غير موجود في المخطط → **خطأ فوري**. لا مفاجآت!

---

## 3. الأنواع في المخطط (Types)

```graphql
type User {
  _id: ID!
  username: String!
  email: String!
  password: String!
}
```

| الرمز | المعنى |
|-------|--------|
| `String!` | نص مطلوب (لا يقبل null) |
| `String` | نص اختياري (يمكن أن يكون null) |
| `Float!` | رقم عشري مطلوب |
| `ID!` | معرّف فريد مطلوب |
| `Boolean!` | صح/خطأ مطلوب |
| `[Event!]` | قائمة من Events |

---

## 4. الأنواع الموجودة في هذا المشروع

### `User` — المستخدم
```graphql
type User {
  _id: ID!
  username: String!   # اسم المستخدم
  email: String!      # البريد الإلكتروني
  password: String!   # كلمة المرور (مشفرة)
}
```

### `AuthData` — بيانات المصادقة
```graphql
type AuthData {
  userId: ID!      # معرّف المستخدم
  token: String!   # JWT Token
  username: String!
}
```
هذا ما يُرجَع عند تسجيل الدخول أو إنشاء حساب.

### `Event` — المناسبة
```graphql
type Event {
  _id: ID!
  title: String!
  description: String!
  price: Float!
  date: String!
  creator: User!   # مرتبط بمستخدم!
}
```
لاحظ أن `creator` نوعه `User` — يعني GraphQL يحل الارتباطات تلقائياً!

### `Booking` — الحجز
```graphql
type Booking {
  _id: ID!
  event: Event!      # المناسبة المحجوزة
  user: User!        # من حجز
  createdAt: String!
  updatedAt: String!
}
```

---

## 5. المُدخلات (Inputs)

عند إرسال بيانات إلى الخادم، نستخدم `input` بدلاً من `type`:

```graphql
input EventInput {
  title: String!
  description: String!
  price: Float!
  date: String!
}
```

**لماذا نفصل بين `type` و `input`؟**
- `type` → البيانات التي يُرسلها الخادم **للعميل**
- `input` → البيانات التي يُرسلها العميل **للخادم**

---

## 6. الاستعلامات (Queries) — القراءة

```graphql
type Query {
  events(searchTerm: String, skip: Int = 0, limit: Int = 8): [Event!]
  bookings: [Booking!]
  getUserEvents(userId: ID!): [Event]
}
```

| الاستعلام | ماذا يفعل | مَن يستطيع؟ |
|-----------|-----------|----------|
| `events` | قائمة المناسبات مع pagination وبحث | الجميع |
| `bookings` | حجوزات المستخدم الحالي | مسجّل الدخول فقط |
| `getUserEvents` | مناسبات مستخدم معين | الجميع |

**المعاملات:**
- `searchTerm: String` → اختياري، للبحث في العنوان/الوصف
- `skip: Int = 0` → تخطي عدد من النتائج (للـ pagination)
- `limit: Int = 8` → الحد الأقصى للنتائج في الصفحة

---

## 7. الطفرات (Mutations) — الكتابة

```graphql
type Mutation {
  # المصادقة
  createUser(userInput: UserInput!): AuthData
  login(email: String!, password: String!): AuthData
  updateUser(updateUserInput: UpdateUserInput!): User
  deleteUser: Boolean

  # المناسبات
  createEvent(eventInput: EventInput!): Event
  updateEvent(eventId: ID!, eventInput: UpdateEventInput!): Event
  deleteEvent(eventId: ID!): [Event]

  # الحجوزات
  bookEvent(eventId: ID!): Booking
  cancelBooking(bookingId: ID!): Event
}
```

---

## 8. الاشتراكات (Subscriptions) — التحديث الفوري ⚡

```graphql
type Subscription {
  eventAdded: Event!
  bookingAdded: Booking!
}
```

هذه الميزة فريدة في هذا المشروع! تعمل عبر **WebSocket**:
```text
العميل يقول: "أخبرني عندما تُضاف مناسبة جديدة"
الخادم: "تمام, سأرسل لك تلقائياً عند الإضافة"
```

---

## 9. كيف يتحول المخطط إلى كود؟

```typescript
import gql from "graphql-tag";
// من ملف schema/index.ts

export const typeDefs = gql`
  type User { ... }
  type Event { ... }
  type Query { ... }
  type Mutation { ... }
  type Subscription { ... }
`;
```

ثم في `index.ts`:
```typescript
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: combinedResolvers,
});
```

`typeDefs` = المخطط (النظرية)  
`resolvers` = الكود الفعلي الذي ينفّذ كل عملية

---

## 10. خلاصة

```text
    ├── Queries: ما الذي يمكن قراءته؟
    يحدد:
    ├── الأنواع: ما هي البيانات؟
المخطط (typeDefs) = دستور التطبيق
    ├── Mutations: ما الذي يمكن تغييره؟
    └── Subscriptions: ما الذي يمكن الاستماع إليه؟
```

- **الـ Schema** يمنع الأخطاء مبكراً — إذا طلبت حقلاً غير موجود، GraphQL يرفض الطلب
- **الـ Types** تضمن أن البيانات المُرسلة والمُستقبلة صحيحة
- **الـ Subscriptions** تضيف Real-time دون الحاجة لـ polling (سؤال متكرر)
