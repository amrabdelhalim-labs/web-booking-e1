# واجهة GraphQL

## نظرة عامة

السيرفر يستخدم **Apollo Server 4** مع **GraphQL** بدلاً من REST API.
جميع العمليات تتم عبر نقطة واحدة: `/graphql`

- **HTTP**: `http://localhost:4000/graphql` — للاستعلامات والطفرات
- **WebSocket**: `ws://localhost:4000/graphql` — للاشتراكات (real-time)
- **المصادقة**: JWT token في header بصيغة `Authorization: JWT <token>`

---

## المصادقة (Authentication)

### تسجيل مستخدم جديد

```graphql
mutation {
  createUser(userInput: {
    username: "أحمد"
    email: "ahmed@example.com"
    password: "123456"
  }) {
    token
    userId
    username
  }
}
```

**استجابة ناجحة:**
```json
{
  "data": {
    "createUser": {
      "token": "eyJhbGciOiJIUzI1...",
      "userId": "6756a1b2c3d4e5f6",
      "username": "أحمد"
    }
  }
}
```

**أخطاء محتملة:**
- `اسم المستخدم يجب أن يكون 3 أحرف على الأقل` (BAD_USER_INPUT)
- `البريد الإلكتروني غير صالح` (BAD_USER_INPUT)
- `كلمة المرور يجب أن تكون 6 أحرف على الأقل` (BAD_USER_INPUT)
- `البريد الإلكتروني مسجل مسبقاً` (BAD_USER_INPUT)

### تسجيل الدخول

```graphql
mutation {
  login(email: "ahmed@example.com", password: "123456") {
    token
    userId
    username
  }
}
```

**أخطاء محتملة:**
- `البريد الإلكتروني أو كلمة المرور غير صحيحة` (UNAUTHENTICATED)

---

## المناسبات (Events)

### استعلام المناسبات (مع بحث وتصفح)

```graphql
query {
  events(searchTerm: "مؤتمر", skip: 0, limit: 8) {
    _id
    title
    description
    price
    date
    creator {
      _id
      username
      email
    }
  }
}
```

| معامل | النوع | الوصف |
|-------|-------|-------|
| `searchTerm` | String | بحث في العنوان والوصف (اختياري) |
| `skip` | Int | عدد العناصر للتخطي (افتراضي: 0) |
| `limit` | Int | الحد الأقصى (افتراضي: 8) |

### مناسبات مستخدم محدد

```graphql
query {
  getUserEvents(userId: "6756a1b2c3d4e5f6") {
    _id
    title
    price
    date
    creator { _id username email }
  }
}
```

### إنشاء مناسبة 🔒

```graphql
mutation {
  createEvent(eventInput: {
    title: "مؤتمر التقنية 2024"
    description: "مؤتمر تقني سنوي في الرياض"
    price: 150.0
    date: "2024-06-15T10:00:00"
  }) {
    _id
    title
    price
    date
    creator { _id username }
  }
}
```

**أخطاء محتملة:**
- `عنوان المناسبة يجب أن يكون 3 أحرف على الأقل` (BAD_USER_INPUT)
- `وصف المناسبة يجب أن يكون 10 أحرف على الأقل` (BAD_USER_INPUT)
- `سعر المناسبة يجب أن يكون أكبر من صفر` (BAD_USER_INPUT)
- `تاريخ المناسبة مطلوب` (BAD_USER_INPUT)
- `يوجد مناسبة بنفس العنوان` (BAD_USER_INPUT)

### تعديل مناسبة 🔒 (المنشئ فقط)

```graphql
mutation {
  updateEvent(
    eventId: "6756a1b2c3d4e5f6"
    eventInput: {
      title: "مؤتمر التقنية 2025"
      price: 200.0
    }
  ) {
    _id
    title
    price
  }
}
```

### حذف مناسبة 🔒 (المنشئ فقط)

```graphql
mutation {
  deleteEvent(eventId: "6756a1b2c3d4e5f6") {
    _id
    title
  }
}
```

> **ملاحظة:** حذف المناسبة يحذف تلقائياً جميع الحجوزات المرتبطة بها.

---

## الحجوزات (Bookings)

### عرض حجوزاتي 🔒

```graphql
query {
  bookings {
    _id
    createdAt
    event {
      _id
      title
      price
      date
      creator { username }
    }
    user { username email }
  }
}
```

### حجز مناسبة 🔒

```graphql
mutation {
  bookEvent(eventId: "6756a1b2c3d4e5f6") {
    _id
    createdAt
  }
}
```

**أخطاء محتملة:**
- `المناسبة غير موجودة` (BAD_USER_INPUT)
- `لا يمكنك حجز مناسبتك الخاصة` (FORBIDDEN)
- `لقد قمت بحجز هذه المناسبة مسبقاً` (BAD_USER_INPUT)

### إلغاء حجز 🔒

```graphql
mutation {
  cancelBooking(bookingId: "6756a1b2c3d4e5f6") {
    _id
    title
  }
}
```

---

## إدارة الحساب (User Management)

### تعديل الملف الشخصي 🔒

```graphql
mutation {
  updateUser(updateUserInput: {
    username: "أحمد الجديد"
    password: "newPassword123"
  }) {
    _id
    username
  }
}
```

> كلا الحقلين اختياريان — أرسل فقط ما تريد تغييره.

### حذف الحساب 🔒

```graphql
mutation {
  deleteUser
}
```

> **تحذير:** حذف الحساب يحذف تلقائياً جميع المناسبات والحجوزات المرتبطة بالمستخدم.

---

## الاشتراكات (Subscriptions) — WebSocket

### اشتراك بالمناسبات الجديدة

```graphql
subscription {
  eventAdded {
    _id
    title
    price
    date
    creator { _id username email }
  }
}
```

### اشتراك بالحجوزات الجديدة

```graphql
subscription {
  bookingAdded {
    _id
    createdAt
    event {
      _id
      title
      price
      creator { username }
    }
    user { username email }
  }
}
```

---

## أكواد الأخطاء

| الكود | الوصف |
|-------|-------|
| `BAD_USER_INPUT` | خطأ في المدخلات (validation) |
| `UNAUTHENTICATED` | غير مسجل الدخول أو token غير صالح |
| `FORBIDDEN` | لا تملك صلاحية لهذه العملية |
| `INTERNAL_SERVER_ERROR` | خطأ داخلي في السيرفر |

### هيكل أخطاء التحقق

```json
{
  "errors": [{
    "message": "بيانات غير صالحة",
    "extensions": {
      "code": "BAD_USER_INPUT",
      "errors": [
        "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
        "البريد الإلكتروني غير صالح"
      ]
    }
  }]
}
```

---

## رمز 🔒

يشير إلى أن العملية تتطلب مصادقة. أرسل JWT token في HTTP header:

```
Authorization: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **ملاحظة:** البادئة `JWT` وليس `Bearer`.
