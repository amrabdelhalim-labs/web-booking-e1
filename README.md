# مناسباتي — منصة حجز المناسبات

منصة متكاملة لإنشاء وحجز المناسبات مبنية بـ **React 18 + TypeScript** في الواجهة و**GraphQL + Apollo Server** في الخلفية مع دعم الإشعارات الفورية عبر **Subscriptions**.

---

## جدول المحتويات

- [نظرة عامة](#نظرة-عامة)
- [الميزات الرئيسية](#الميزات-الرئيسية)
- [البنية التقنية](#البنية-التقنية)
- [متطلبات التشغيل](#متطلبات-التشغيل)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [البنية الهيكلية](#البنية-الهيكلية)
- [المعمارية](#المعمارية)
- [الاختبارات](#الاختبارات)
- [واجهة GraphQL](#واجهة-graphql)
- [الأمان والمصادقة](#الأمان-والمصادقة)
- [النشر والإنتاج](#النشر-والإنتاج)
- [التوثيق](#التوثيق)
- [الترخيص](#الترخيص)

---

## نظرة عامة

**مناسباتي** نظام شامل لإدارة المناسبات الحديثة. يسمح للمستخدمين بـ:

- إنشاء مناسبات مع تحديد التفاصيل (العنوان، الوصف، السعر، التاريخ)
- حجز المناسبات التي أنشأها مستخدمون آخرون
- إدارة الحجوزات وإلغائها وتتبع التحديثات الفورية
- البحث عن المناسبات بالعنوان أو الوصف
- التصفح بالصفحات (Infinite Scroll Pagination)
- تعديل وحذف المناسبات الخاصة
- عرض ملفات المستخدمين ومناسباتهم
- تلقي إشعارات فورية عند إضافة مناسبة جديدة

النظام مصمم بواجهة عربية كاملة مع دعم RTL وتصميم متجاوب يعمل على جميع الأجهزة.

---

## الميزات الرئيسية

### المصادقة والأمان
- تسجيل حساب جديد مع تشفير bcrypt
- تسجيل دخول آمن مع JWT tokens
- حماية المسارات الخاصة (Private Routes)
- تعديل الملف الشخصي وحذف الحساب

### إدارة المناسبات
- إنشاء مناسبات مع تحديد السعر والتاريخ
- عرض 8 مناسبات لكل صفحة
- بحث ديناميكي (debounced 300ms)
- تعديل وحذف المناسبات الخاصة

### نظام الحجوزات
- حجز المناسبات مع التحقق من الصلاحيات
- تحديث فوري لقائمة الحجوزات
- منع حجز مناسباتك الشخصية
- إلغاء الحجز بسهولة

### الإشعارات الفورية
- WebSocket subscriptions للمناسبات الجديدة
- تحديث الحجوزات في الوقت الفعلي
- إشعارات بصرية فورية

### الواجهة والتصميم
- تصميم متجاوب 100% (Mobile-first)
- دعم كامل للعربية واتجاه RTL
- شبكة ديناميكية: 4/3/2/1 بطاقة حسب حجم الشاشة
- أزرار محسّنة مع تأثيرات hover/focus

### الأداء والتحسينات
- Apollo Client optimistic updates
- Debounced search
- Code splitting مع Vite

---

## البنية التقنية

### Frontend

| التقنية | الإصدار | الدور |
|---------|---------|------|
| React | 18.3.1 | واجهات المستخدم |
| TypeScript | 5.6 | اللغة البرمجية |
| Vite | 6.4.1 | أداة البناء |
| Apollo Client | 3.12.4 | GraphQL + إدارة الحالة |
| React Router | 7.1.1 | التوجيه |
| Bootstrap | 5.3.3 | تصاميم قابلة للاستخدام |

### Backend

| التقنية | الإصدار | الدور |
|---------|---------|------|
| Node.js | 18+ | بيئة التشغيل |
| Apollo Server | 4.11.3 | خادم GraphQL |
| Express | 4.21.2 | إطار العمل |
| MongoDB | 8.x | قاعدة البيانات |
| JWT | 9.0.2 | المصادقة |
| bcryptjs | 2.4.3 | تجزئة كلمات المرور |

---

## متطلبات التشغيل

- **Node.js 18+** و **npm 9+**
- **MongoDB 6.0+** (محلي أو MongoDB Atlas)
- **متصفح حديث** يدعم ES2020+

---

## التثبيت والإعداد

### 1. استنساخ المشروع

```bash
git clone https://github.com/username/web-booking-e1.git
cd web-booking-e1
```

### 2. إعداد الخادم

```bash
cd server
npm install
```

أنشئ ملف `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/event-booking
JWT_SECRET=your-super-secret-key-change-in-production
PORT=4000
NODE_ENV=development
```

### 3. إعداد العميل

```bash
cd ../client
npm install
```

أنشئ ملف `.env.local`:

```env
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
VITE_APP_DOMAIN=http://localhost:5173
VITE_BASE_PATH=/
```

### 4. تشغيل التطبيق

**Terminal 1 — الخادم:**
```bash
cd server
npm run dev
```
يعمل على: `http://localhost:4000/graphql`

**Terminal 2 — العميل:**
```bash
cd client
npm run dev
```
يعمل على: `http://localhost:5173`

---

## البنية الهيكلية

```
web-booking-e1/
│
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # المكونات القابلة لإعادة الاستخدام
│   │   │   ├── Alert.tsx
│   │   │   ├── BookingItem.tsx
│   │   │   ├── EventItem.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── ProfileEditor.tsx
│   │   │   ├── SimpleModal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── UserDropdown.tsx
│   │   ├── pages/                   # صفحات التطبيق
│   │   │   ├── Bookings.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── UserEvents.tsx
│   │   │   └── NotFound.tsx
│   │   ├── context/                 # إدارة الحالة العامة
│   │   │   ├── auth-context.ts
│   │   │   └── AuthProvider.tsx
│   │   ├── graphql/                 # استعلامات GraphQL
│   │   │   ├── fragments.ts
│   │   │   └── queries.ts
│   │   ├── hooks/                   # خطافات مخصصة
│   │   │   └── useAuth.ts
│   │   ├── utils/                   # دوال مساعدة
│   │   │   └── formatDate.ts
│   │   ├── tests/                   # اختبارات Vitest
│   │   │   ├── config.test.ts
│   │   │   ├── types.test.ts
│   │   │   ├── formatDate.test.ts
│   │   │   ├── useAuth.test.tsx
│   │   │   └── graphql.test.ts
│   │   ├── types.ts
│   │   ├── config.ts
│   │   ├── setupTests.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/                          # GraphQL Backend
│   ├── src/
│   │   ├── models/                  # نماذج MongoDB
│   │   │   ├── booking.ts
│   │   │   ├── event.ts
│   │   │   └── user.ts
│   │   ├── repositories/            # طبقة الوصول للبيانات
│   │   │   ├── repository.interface.ts
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── event.repository.ts
│   │   │   ├── booking.repository.ts
│   │   │   └── index.ts
│   │   ├── validators/
│   │   │   └── index.ts
│   │   ├── resolvers/               # GraphQL Resolvers
│   │   │   ├── auth.ts
│   │   │   ├── booking.ts
│   │   │   ├── event.ts
│   │   │   ├── index.ts
│   │   │   └── transform.ts
│   │   ├── schema/
│   │   │   └── index.ts
│   │   ├── middlewares/
│   │   │   └── isAuth.ts
│   │   ├── tests/
│   │   │   ├── test.helpers.ts
│   │   │   ├── repositories.test.ts
│   │   │   ├── comprehensive.test.ts
│   │   │   └── api.test.ts
│   │   └── index.ts
│   └── package.json
│
├── docs/                            # التوثيق
│   ├── database-abstraction.md
│   ├── repository-quick-reference.md
│   ├── graphql-api.md
│   └── testing.md
│
└── README.md
```

---

## المعمارية

### Repository Pattern (الخادم)

الخادم يستخدم **نمط Repository** لفصل منطق الوصول للبيانات عن منطق العمل:

```
GraphQL Resolvers → Repository Manager → Specialized Repositories → Mongoose Models
```

| المستودع | المهمة |
|---------|--------|
| `BaseRepository` | عمليات CRUD عامة مع pagination (max 50) |
| `UserRepository` | `findByEmail`, `emailExists`, `updateProfile` |
| `EventRepository` | `findAllWithCreator`, `search`, `titleExists` |
| `BookingRepository` | `userHasBooked`, `createAndPopulate`, `deleteByUserCascade` |
| `RepositoryManager` | Singleton للوصول الموحد |

> التفصيل: [docs/database-abstraction.md](docs/database-abstraction.md) · [docs/repository-quick-reference.md](docs/repository-quick-reference.md)

### Validators (التحقق من المدخلات)

رسائل خطأ عربية تُرسل كـ `GraphQLError` مع كود `BAD_USER_INPUT`:
- `validateUserInput` — التحقق من بيانات التسجيل
- `validateLoginInput` — التحقق من بيانات الدخول
- `validateEventInput` — التحقق من بيانات المناسبة

### Auth Provider (العميل)

مكون `AuthProvider` يدير حالة المصادقة عبر React Context. خطاف `useAuth()` للوصول من أي مكون.

---

## الاختبارات

### اختبارات الخادم (131 اختبار)

```bash
cd server
npm run test:all
```

| الحزمة | الأمر | العدد |
|--------|-------|-------|
| Repository Tests | `npm test` | 43 |
| Comprehensive Tests | `npm run test:comprehensive` | 45 |
| E2E API Tests | `npm run test:e2e` | 43 |

**المتطلبات:** MongoDB يعمل على `localhost:27017`

### اختبارات العميل (54 اختبار)

```bash
cd client
npm test
```

| الملف | العدد | التغطية |
|-------|-------|---------|
| `config.test.ts` | 9 | ثوابت التطبيق وروابط GraphQL |
| `types.test.ts` | 10 | أنواع TypeScript |
| `formatDate.test.ts` | 11 | دوال تنسيق التاريخ |
| `useAuth.test.tsx` | 5 | خطاف المصادقة |
| `graphql.test.ts` | 19 | عمليات GraphQL (14 عملية) |

**المجموع الكلي: 185 اختبار**

> التفصيل: [docs/testing.md](docs/testing.md)

---

## واجهة GraphQL

**نقطة الوصول الواحدة:** `/graphql`

- HTTP: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`
- المصادقة: `Authorization: JWT <token>`

### الاستعلامات

```graphql
events(searchTerm: String, skip: Int = 0, limit: Int = 8): [Event!]
getUserEvents(userId: ID!): [Event!]
bookings: [Booking!]
```

### التعديلات

```graphql
# المصادقة
createUser(userInput: UserInput): AuthData
login(email: String, password: String): AuthData
updateUser(updateUserInput: UpdateUserInput): User
deleteUser: Boolean

# المناسبات (🔒 تتطلب مصادقة)
createEvent(eventInput: EventInput): Event
updateEvent(eventId: ID, eventInput: UpdateEventInput): Event
deleteEvent(eventId: ID): [Event]

# الحجوزات (🔒 تتطلب مصادقة)
bookEvent(eventId: ID): Booking
cancelBooking(bookingId: ID): Event
```

### الاشتراكات

```graphql
eventAdded: Event      # مناسبة جديدة
bookingAdded: Booking  # حجز جديد
```

> التفصيل: [docs/graphql-api.md](docs/graphql-api.md)

---

## الأمان والمصادقة

- **JWT:** إصدار عند التسجيل/الدخول، تخزين في localStorage، إرساله مع كل طلب
- **bcrypt:** تشفير كلمات المرور (salt rounds: 12)
- **Private Routes:** حماية الصفحات وإعادة توجيه للـ login
- **صلاحيات GraphQL:**
  - لا يمكن حجز مناسباتك
  - لا يمكن تعديل مناسبة الآخرين
  - لا يمكن إلغاء حجز الآخرين

---

## النشر والإنتاج

### بناء الملفات

```bash
cd client && npm run build
cd server && npm run build
```

### متغيرات الإنتاج

**الخادم:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-booking
JWT_SECRET=<مفتاح قوي طويل>
NODE_ENV=production
PORT=4000
```

**العميل:**
```env
VITE_GRAPHQL_HTTP_URL=https://your-api.com/graphql
VITE_GRAPHQL_WS_URL=wss://your-api.com/graphql
```

### منصات النشر

| المكون | المنصة |
|--------|--------|
| Frontend | Vercel / Netlify |
| Backend | Railway / Render |
| Database | MongoDB Atlas |

---

## السكريبتات المتاحة

### العميل

```bash
npm run dev          # تطوير
npm run build        # بناء
npm test             # اختبارات
npm run test:watch   # اختبارات مستمرة
```

### الخادم

```bash
npm run dev               # تطوير
npm run build             # بناء TypeScript
npm start                 # إنتاج
npm test                  # اختبارات Repository (43)
npm run test:comprehensive # اختبارات شاملة (45)
npm run test:e2e          # اختبارات E2E (43)
npm run test:all          # جميع الاختبارات
```

---

## تاريخ المشروع

| الإصدار | التغيير الرئيسي |
|---------|----------------|
| v1.0.0 | البنية الأساسية: GraphQL + MongoDB + React |
| v1.1.0 | نظام المصادقة JWT |
| v1.2.0 | Repository Pattern للخادم |
| v1.3.0 | Validators عربية |
| v1.4.0 | اختبارات شاملة (185 اختبار) |

---

## التوثيق

| الملف | الوصف |
|-------|-------|
| [docs/database-abstraction.md](docs/database-abstraction.md) | شرح Repository Pattern |
| [docs/repository-quick-reference.md](docs/repository-quick-reference.md) | دليل سريع مرجعي |
| [docs/graphql-api.md](docs/graphql-api.md) | توثيق واجهة GraphQL |
| [docs/testing.md](docs/testing.md) | دليل الاختبارات |
| [CONTRIBUTING.md](CONTRIBUTING.md) | دليل المساهمة |

---

## الترخيص

ISC License — يمكنك استخدام هذا المشروع بحرية.
