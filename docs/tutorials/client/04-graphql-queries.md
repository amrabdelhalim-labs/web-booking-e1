# الدرس الرابع (العميل): استعلامات GraphQL وطفراتها 📡

> **هدف الدرس:** فهم كيف تُكتب الاستعلامات والطفرات في العميل وكيف تُستخدم

---

## 1. ما هو `gql`؟

`gql` = دالة تحوّل نص GraphQL إلى كائن يفهمه Apollo:

```typescript
import { gql } from "@apollo/client";

const MY_QUERY = gql`
  query {
    events {
      title
      price
    }
  }
`;
```

---

## 2. Fragments — حقول مشتركة

```typescript
// من graphql/fragments.ts
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    _id
    title
    description
    price
    date
    creator {
      _id
      username
    }
  }
`;
```

**Fragment** = "قالب" للحقول المتكررة.  
بدلاً من كتابة نفس الحقول في كل استعلام، نكتبها مرة واحدة وندرجها:

```graphql
# داخل الاستعلام:
${EVENT_FIELDS}
query Events {
  events {
    ...EventFields    ← الاستيراد (spread)
  }
}
```

---

## 3. Queries — استعلامات القراءة

### `EVENTS` — قائمة المناسبات
```typescript
export const EVENTS = gql`
  ${EVENT_FIELDS}
  query Events($searchTerm: String, $skip: Int = 0, $limit: Int = 8) {
    events(searchTerm: $searchTerm, skip: $skip, limit: $limit) {
      ...EventFields
    }
  }
`;
```

**الاستخدام في المكوّن:**
```tsx
const { data, loading } = useQuery(EVENTS, {
  variables: { skip: 0, limit: 8, searchTerm: "حفل" }
});
```

### `BOOKINGS` — حجوزات المستخدم
```typescript
export const BOOKINGS = gql`
  ${EVENT_FIELDS}
  query Bookings {
    bookings {
      _id
      createdAt
      event {
        ...EventFields   ← بيانات المناسبة كاملة داخل الحجز
      }
      user {
        username
        email
      }
    }
  }
`;
```

---

## 4. Auth Mutations — طفرات المصادقة

### `LOGIN` — تسجيل الدخول
```typescript
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      userId
      username
    }
  }
`;
```

**الاستخدام:**
```tsx
const [loginMutation, { loading, data }] = useMutation(LOGIN, {
  onError: (error) => setAlert(error.message),
});

loginMutation({
  variables: { email: "x@x.com", password: "123456" }
});
```

### `CREATE_USER` — إنشاء حساب
```typescript
export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!, $password: String!) {
    createUser(
      userInput: { username: $username, email: $email, password: $password }
    ) {
      token
      userId
      username
    }
  }
`;
```

---

## 5. Event Mutations — طفرات المناسبات

### `CREATE_EVENT`
```typescript
export const CREATE_EVENT = gql`
  ${EVENT_FIELDS}
  mutation CreateEvent(
    $title: String!
    $description: String!
    $price: Float!
    $date: String!
  ) {
    createEvent(
      eventInput: { title: $title, description: $description, price: $price, date: $date }
    ) {
      ...EventFields
    }
  }
`;
```

### `UPDATE_EVENT` — تعديل مناسبة (حقول اختيارية)
```typescript
export const UPDATE_EVENT = gql`
  ${EVENT_FIELDS}
  mutation UpdateEvent(
    $eventId: ID!
    $title: String        ← بدون ! = اختياري
    $description: String
    $price: Float
    $date: String
  ) {
    updateEvent(eventId: $eventId, eventInput: {...}) {
      ...EventFields
    }
  }
`;
```

### `DELETE_EVENT` — حذف مناسبة (يُرجع القائمة المحدّثة)
```typescript
export const DELETE_EVENT = gql`
  ${EVENT_FIELDS}
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(eventId: $eventId) {
      ...EventFields    ← قائمة المناسبات بعد الحذف
    }
  }
`;
```

---

## 6. Booking Mutations

### `BOOK_EVENT` — حجز مناسبة
```typescript
export const BOOK_EVENT = gql`
  mutation BookEvent($eventId: ID!) {
    bookEvent(eventId: $eventId) {
      _id
      createdAt
    }
  }
`;
```

### `CANCEL_BOOKING` — إلغاء حجز (يُرجع المناسبة!)
```typescript
export const CANCEL_BOOKING = gql`
  ${EVENT_FIELDS}
  mutation CancelBooking($bookingId: ID!) {
    cancelBooking(bookingId: $bookingId) {
      ...EventFields   ← المناسبة المُلغى حجزها
    }
  }
`;
```

---

## 7. المتغيرات (`$`) — لماذا نستخدمها؟

**بدون متغيرات (مكشوف وخطير):**
```graphql
# ❌ القيم مضمّنة في النص
mutation { login(email: "x@x.com", password: "123456") { token } }
```

**مع متغيرات (الطريقة الصحيحة):**
```graphql
# ✅ القيم مفصولة عن الـ query
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) { token }
}
```
```typescript
// القيم تُرسَل بشكل منفصل
loginMutation({ variables: { email, password } });
```

**الفوائد:**
- أمان (لا Injection هجمات)
- أداء (Apollo يُعيد استخدام نفس الـ query مع قيم مختلفة)
- وضوح

---

## 8. خلاصة

```
graphql/fragments.ts
    └── EVENT_FIELDS     ← حقول Event المشتركة

graphql/queries.ts
    ├── Queries:
    │   ├── EVENTS           (useQuery)
    │   ├── GET_USER_EVENTS  (useQuery)
    │   └── BOOKINGS         (useQuery)
    │
    └── Mutations:
        ├── LOGIN            (useMutation)
        ├── CREATE_USER      (useMutation)
        ├── UPDATE_USER      (useMutation)
        ├── CREATE_EVENT     (useMutation)
        ├── UPDATE_EVENT     (useMutation)
        ├── DELETE_EVENT     (useMutation)
        ├── BOOK_EVENT       (useMutation)
        └── CANCEL_BOOKING   (useMutation)
```
