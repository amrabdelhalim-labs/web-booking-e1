# خطة تطوير مشروع web-booking-e1

> تطبيق حجز مناسبات مبني بـ TypeScript بالكامل (خادم + عميل)  
> المرجع الأساسي: مجلد `graphql` (JavaScript)  
> التقنيات: Apollo Server/Client، Express، MongoDB/Mongoose، React، GraphQL  
> **جميع الملفات الحالية تحتوي على بيانات تجريبية (Placeholder) وسيتم تطويرها بالتفصيل لاحقاً**

---

## المرحلة الأولى: تهيئة المشروع وإعداد الخادم (الدروس 01-04)

### 1.1 تهيئة مشروع الخادم (Server)
- [x] إنشاء هيكل المجلدات الأساسي للخادم (`server/src/`)
- [ ] إعداد `package.json` مع الاعتماديات (dependencies) بنسخ TypeScript الحديثة
- [ ] إعداد `tsconfig.json` للخادم
- [ ] إعداد ملف `.env` مع المتغيرات البيئية (PORT, DB_URL, JWT_SECRET)
- [ ] إنشاء ملف الإعدادات `server/src/config/index.ts` لتجميع المتغيرات البيئية

### 1.2 تهيئة Apollo Server (الدرس 02)
- [ ] إنشاء نقطة الدخول الرئيسية `server/src/index.ts` مع Apollo Server 4 + Express
- [ ] إعداد HTTP Server و WebSocket Server
- [ ] إعداد السياق (Context) مع فك رمز JWT
- [ ] إعداد الإضافات (Plugins) لإدارة دورة حياة الخادم

### 1.3 إعداد تخطيط التطبيق - Schema (الدرس 03)
- [ ] تعريف الأنواع (Types): `User`, `Event`, `Booking`, `AuthData`
- [ ] تعريف المدخلات (Inputs): `UserInput`, `EventInput`
- [ ] تعريف الاستعلامات (Queries): `events`, `bookings`, `getUserEvents`
- [ ] تعريف التحويلات (Mutations): `createUser`, `login`, `createEvent`, `bookEvent`, `cancelBooking`, `deleteEvent`
- [ ] تعريف الاشتراكات (Subscriptions): `eventAdded`

### 1.4 تهيئة قاعدة البيانات (الدرس 04)
- [ ] إنشاء نماذج Mongoose بـ TypeScript:
  - [ ] نموذج المستخدم `User` مع الواجهة (Interface)
  - [ ] نموذج المناسبة `Event` مع الواجهة
  - [ ] نموذج الحجز `Booking` مع الواجهة
- [ ] الاتصال بقاعدة بيانات MongoDB

### 1.5 إعداد الأنواع المشتركة (TypeScript Types)
- [ ] تعريف أنواع السياق (Context Types)
- [ ] تعريف أنواع المُحوِّلات (Resolver Types)
- [ ] تعريف أنواع المصادقة (Auth Types)

---

## المرحلة الثانية: منطق الأعمال في الخادم (الدروس 05-08)

### 2.1 إعداد المصادقة - Authentication (الدرس 05)
- [ ] إنشاء محوِّل المصادقة `resolvers/auth.ts`:
  - [ ] تسجيل مستخدم جديد (`createUser`) مع تشفير كلمة المرور بـ bcrypt
  - [ ] تسجيل الدخول (`login`) مع إنشاء رمز JWT
- [ ] إنشاء حارس المصادقة (Auth Guard) `middlewares/isAuth.ts`
- [ ] دمج المصادقة مع السياق (Context)

### 2.2 إضافة المناسبات (الدرس 06)
- [ ] إنشاء محوِّل المناسبات `resolvers/event.ts`:
  - [ ] استعلام جميع المناسبات (`events`)
  - [ ] استعلام مناسبات مستخدم محدد (`getUserEvents`)
  - [ ] إنشاء مناسبة جديدة (`createEvent`) - محمي بالمصادقة
  - [ ] حذف مناسبة (`deleteEvent`)

### 2.3 حجز المناسبات وإلغاؤها (الدرس 07)
- [ ] إنشاء محوِّل الحجوزات `resolvers/booking.ts`:
  - [ ] استعلام حجوزات المستخدم (`bookings`) - محمي بالمصادقة
  - [ ] حجز مناسبة (`bookEvent`) - محمي بالمصادقة
  - [ ] إلغاء حجز (`cancelBooking`) - محمي بالمصادقة

### 2.4 تحسين الشيفرة (الدرس 08)
- [ ] إنشاء دوال التحويل `resolvers/transform.ts` لتنسيق البيانات
- [ ] دمج جميع المحوِّلات في `resolvers/index.ts` باستخدام lodash merge
- [ ] إعداد نظام PubSub للاشتراكات (Subscriptions)
- [ ] اختبار جميع العمليات عبر Apollo Sandbox

---

## المرحلة الثالثة: تهيئة تطبيق العميل (الدروس 09-11)

### 3.1 إعداد تطبيق React مع TypeScript (الدرس 09)
- [ ] تهيئة مشروع React بـ Vite + TypeScript
- [ ] إعداد `package.json` مع الاعتماديات
- [ ] إعداد `tsconfig.json` للعميل
- [ ] إعداد ملفات CSS الأساسية (`index.css`, `App.css`)
- [ ] إعداد ملف `index.html` مع دعم RTL والخط العربي

### 3.2 إعداد الترويسة - Navbar (الدرس 10)
- [ ] إنشاء مكون شريط التنقل `components/Navbar.tsx`
- [ ] دعم عرض/إخفاء الروابط بحسب حالة المصادقة
- [ ] تصميم متجاوب باستخدام Bootstrap

### 3.3 إعداد Apollo Client وربطه بـ React (الدرس 11)
- [ ] إعداد Apollo Client مع HTTP Link
- [ ] إعداد WebSocket Link للاشتراكات
- [ ] إعداد Auth Link لإرفاق رمز JWT
- [ ] إعداد Split Link (HTTP vs WebSocket)
- [ ] تغليف التطبيق بـ `ApolloProvider`

---

## المرحلة الرابعة: المصادقة في العميل (الدروس 12-13)

### 4.1 المصادقة من جانب العميل (الدرس 12)
- [ ] إنشاء سياق المصادقة `context/auth-context.ts` بـ TypeScript
- [ ] إدارة الحالة (token, userId, username) مع localStorage
- [ ] دوال تسجيل الدخول والخروج

### 4.2 استخدام رمز الوصول (الدرس 13)
- [ ] إنشاء صفحة تسجيل الدخول `pages/Login.tsx`
- [ ] إنشاء صفحة إنشاء الحساب `pages/SignUp.tsx`
- [ ] إنشاء مكون `PrivateRoute.tsx` لحماية المسارات
- [ ] تعريف استعلامات GraphQL: `LOGIN`, `CREATE_USER`

---

## المرحلة الخامسة: صفحات التطبيق (الدروس 14-17)

### 5.1 إعداد صفحة المناسبات (الدرس 14)
- [ ] إنشاء صفحة المناسبات `pages/Events.tsx`
- [ ] إنشاء مكون عنصر المناسبة `components/EventItem.tsx`
- [ ] عرض قائمة المناسبات مع التصفح والتفاصيل
- [ ] تعريف استعلام `EVENTS`

### 5.2 تنظيم عرض التنبيهات والأخطاء (الدرس 15)
- [ ] إنشاء مكون عرض الأخطاء `components/Error.tsx`
- [ ] إنشاء مكون التحميل `components/Spinner.tsx`
- [ ] دمج إدارة الأخطاء في جميع الصفحات

### 5.3 تفعيل إضافة مناسبة عبر Modal (الدرس 16)
- [ ] إنشاء مكون النافذة المنبثقة `components/SimpleModal.tsx`
- [ ] نموذج إنشاء مناسبة جديدة
- [ ] نموذج عرض تفاصيل المناسبة وحجزها
- [ ] تعريف استعلامات `CREATE_EVENT`, `BOOK_EVENT`

### 5.4 إعداد صفحة الحجوزات (الدرس 17)
- [ ] إنشاء صفحة الحجوزات `pages/Bookings.tsx`
- [ ] إنشاء مكون عنصر الحجز `components/BookingItem.tsx`
- [ ] عرض حجوزات المستخدم مع إمكانية الإلغاء
- [ ] تعريف استعلامات `BOOKINGS`, `CANCEL_BOOKING`

---

## المرحلة السادسة: الميزات المتقدمة (الدروس 18-19)

### 6.1 استخدام الاشتراكات لتنبيه المستخدمين (الدرس 18)
- [ ] إعداد اشتراك `eventAdded` في الخادم
- [ ] استقبال الإشعارات في العميل عند إضافة مناسبة جديدة
- [ ] عرض تنبيه للمستخدم مع تحديث القائمة تلقائياً

### 6.2 تحسينات ومزايا (الدرس 19)
- [ ] تحسين تجربة المستخدم
- [ ] تحسين أداء الاستعلامات
- [ ] مراجعة وتنظيف الشيفرة النهائية

---

## المرحلة السابعة: النشر (الدرس 20)

### 7.1 نشر التطبيق على الإنترنت
- [ ] إعداد ملفات النشر
- [ ] بناء نسخة الإنتاج للعميل
- [ ] نشر الخادم
- [ ] نشر العميل
- [ ] اختبار التطبيق المنشور

---

## ملاحظات تقنية

### الفروقات عن المرجع (تحسينات TypeScript)
| العنصر | المرجع (JS) | المشروع الجديد (TS) |
|--------|-------------|---------------------|
| اللغة | JavaScript | TypeScript |
| الخادم | Apollo Server 3 (apollo-server-express) | Apollo Server 4 (@apollo/server) |
| العميل | Create React App (React 17) | Vite + React 18 |
| الأنواع | بدون أنواع | واجهات وأنواع TypeScript كاملة |
| Node.js | CommonJS (require) | ES Modules (import/export) |
| التحقق | لا يوجد | أنواع صارمة + حراس الأنواع |

### هيكل المشروع
```
web-booking-e1/
├── server/                    # الخادم (Backend)
│   ├── src/
│   │   ├── index.ts          # نقطة الدخول الرئيسية
│   │   ├── config/           # إعدادات التطبيق
│   │   │   └── index.ts
│   │   ├── schema/           # تخطيط GraphQL
│   │   │   └── index.ts
│   │   ├── models/           # نماذج قاعدة البيانات
│   │   │   ├── user.ts
│   │   │   ├── event.ts
│   │   │   └── booking.ts
│   │   ├── resolvers/        # محوِّلات GraphQL
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── event.ts
│   │   │   ├── booking.ts
│   │   │   └── transform.ts
│   │   ├── middlewares/       # البرمجيات الوسيطة
│   │   │   └── isAuth.ts
│   │   └── types/            # أنواع TypeScript
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── client/                    # العميل (Frontend)
│   ├── src/
│   │   ├── main.tsx          # نقطة الدخول
│   │   ├── App.tsx           # المكون الرئيسي
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   ├── graphql/          # استعلامات GraphQL
│   │   │   ├── queries.ts
│   │   │   └── fragments.ts
│   │   ├── context/          # سياقات React
│   │   │   └── auth-context.ts
│   │   ├── components/       # المكونات
│   │   │   ├── Navbar.tsx
│   │   │   ├── EventItem.tsx
│   │   │   ├── BookingItem.tsx
│   │   │   ├── SimpleModal.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── Error.tsx
│   │   │   └── Spinner.tsx
│   │   └── pages/            # الصفحات
│   │       ├── Events.tsx
│   │       ├── Bookings.tsx
│   │       ├── Login.tsx
│   │       └── SignUp.tsx
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── TASKS.md                   # هذا الملف
└── LICENSE
```
