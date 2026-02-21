# خطة تطوير مشروع web-booking-e1

> تطبيق حجز مناسبات مبني بـ TypeScript بالكامل (خادم + عميل)  
> المرجع الأساسي: مجلد `graphql` (JavaScript)  
> التقنيات: Apollo Server/Client، Express، MongoDB/Mongoose، React، GraphQL  
> **جميع الملفات الحالية تحتوي على بيانات تجريبية (Placeholder) وسيتم تطويرها بالتفصيل لاحقاً**

---

## المرحلة الأولى: تهيئة المشروع وإعداد الخادم (الدروس 01-04)

### 1.1 تهيئة مشروع الخادم (Server)
- [x] إنشاء هيكل المجلدات الأساسي للخادم (`server/src/`)
- [x] إعداد `package.json` مع الاعتماديات (dependencies) بنسخ TypeScript الحديثة
- [x] إعداد `tsconfig.json` للخادم
- [x] إعداد ملف `.env` مع المتغيرات البيئية (PORT, DB_URL, JWT_SECRET)
- [x] إنشاء ملف الإعدادات `server/src/config/index.ts` لتجميع المتغيرات البيئية

### 1.2 تهيئة Apollo Server (الدرس 02)
- [x] إنشاء نقطة الدخول الرئيسية `server/src/index.ts` مع Apollo Server 4 + Express
- [x] إعداد HTTP Server و WebSocket Server
- [x] إعداد السياق (Context) مع فك رمز JWT
- [x] إعداد الإضافات (Plugins) لإدارة دورة حياة الخادم

### 1.3 إعداد تخطيط التطبيق - Schema (الدرس 03)
- [x] تعريف الأنواع (Types): `User`, `Event`, `Booking`, `AuthData`
- [x] تعريف المدخلات (Inputs): `UserInput`, `EventInput`
- [x] تعريف الاستعلامات (Queries): `events`, `bookings`, `getUserEvents`
- [x] تعريف التحويلات (Mutations): `createUser`, `login`, `createEvent`, `bookEvent`, `cancelBooking`, `deleteEvent`
- [x] تعريف الاشتراكات (Subscriptions): `eventAdded`

### 1.4 تهيئة قاعدة البيانات (الدرس 04)
- [x] إنشاء نماذج Mongoose بـ TypeScript:
  - [x] نموذج المستخدم `User` مع الواجهة (Interface)
  - [x] نموذج المناسبة `Event` مع الواجهة
  - [x] نموذج الحجز `Booking` مع الواجهة
- [x] الاتصال بقاعدة بيانات MongoDB

### 1.5 إعداد الأنواع المشتركة (TypeScript Types)
- [x] تعريف أنواع السياق (Context Types)
- [x] تعريف أنواع المُحوِّلات (Resolver Types)
- [x] تعريف أنواع المصادقة (Auth Types)

---

## المرحلة الثانية: منطق الأعمال في الخادم (الدروس 05-08)

### 2.1 إعداد المصادقة - Authentication (الدرس 05)
- [x] إنشاء محوِّل المصادقة `resolvers/auth.ts`:
  - [x] تسجيل مستخدم جديد (`createUser`) مع تشفير كلمة المرور بـ bcrypt
  - [x] تسجيل الدخول (`login`) مع إنشاء رمز JWT
- [x] إنشاء حارس المصادقة (Auth Guard) `middlewares/isAuth.ts`
- [x] دمج المصادقة مع السياق (Context)

### 2.1.1 إدارة حساب المستخدم (إضافي)
- [x] تعديل بيانات المستخدم (`updateUser`) - اسم المستخدم وكلمة المرور (بدون البريد الإلكتروني) - محمي بالمصادقة
- [x] حذف حساب المستخدم (`deleteUser`) مع حذف متسلسل (Cascade Delete) - محمي بالمصادقة
- [x] إضافة `UpdateUserInput` للسكيما والأنواع

### 2.2 إضافة المناسبات (الدرس 06)
- [x] إنشاء محوِّل المناسبات `resolvers/event.ts`:
  - [x] استعلام جميع المناسبات (`events`)
  - [x] استعلام مناسبات مستخدم محدد (`getUserEvents`)
  - [x] إنشاء مناسبة جديدة (`createEvent`) - محمي بالمصادقة
  - [x] حذف مناسبة (`deleteEvent`) مع حذف متسلسل للحجوزات - محمي بالمصادقة + تحقق من الملكية

### 2.3 حجز المناسبات وإلغاؤها (الدرس 07)
- [x] إنشاء محوِّل الحجوزات `resolvers/booking.ts`:
  - [x] استعلام حجوزات المستخدم (`bookings`) - محمي بالمصادقة
  - [x] حجز مناسبة (`bookEvent`) - محمي بالمصادقة + منع الحجز المكرر
  - [x] إلغاء حجز (`cancelBooking`) - محمي بالمصادقة + تحقق من الملكية

### 2.4 تحسين الشيفرة (الدرس 08)
- [x] إنشاء دوال التحويل `resolvers/transform.ts` لتنسيق البيانات
- [x] دمج جميع المحوِّلات في `resolvers/index.ts` باستخدام lodash merge
- [x] إعداد نظام PubSub للاشتراكات (Subscriptions)
- [x] إضافة ملف تعريف أنواع `graphql-resolvers.d.ts`
- [x] ضبط العلاقات المتسلسلة (Cascade Delete) في جميع المحوِّلات
- [x] اختبار جميع العمليات عبر Apollo Sandbox

---

## المرحلة الثالثة: تهيئة تطبيق العميل (الدروس 09-11)

### 3.1 إعداد تطبيق React مع TypeScript (الدرس 09)
- [x] تهيئة مشروع React بـ Vite + TypeScript
- [x] إعداد `package.json` مع الاعتماديات
- [x] إعداد `tsconfig.json` للعميل
- [x] إعداد ملفات CSS الأساسية (`index.css`, `App.css`)
- [x] إعداد ملف `index.html` مع دعم RTL والخط العربي

### 3.2 إعداد الترويسة - Navbar (الدرس 10)
- [x] إنشاء مكون شريط التنقل `components/Navbar.tsx`
- [x] دعم عرض/إخفاء الروابط بحسب حالة المصادقة
- [x] تصميم متجاوب باستخدام Bootstrap

### 3.3 إعداد Apollo Client وربطه بـ React (الدرس 11)
- [x] إعداد Apollo Client مع HTTP Link
- [x] إعداد WebSocket Link للاشتراكات
- [x] إعداد Auth Link لإرفاق رمز JWT
- [x] إعداد Split Link (HTTP vs WebSocket)
- [x] تغليف التطبيق بـ `ApolloProvider`

---

## المرحلة الرابعة: المصادقة في العميل (الدروس 12-13)

### 4.1 المصادقة من جانب العميل (الدرس 12)
- [x] إنشاء سياق المصادقة `context/auth-context.ts` بـ TypeScript
- [x] إدارة الحالة (token, userId, username) مع localStorage
- [x] دوال تسجيل الدخول والخروج

### 4.2 استخدام رمز الوصول (الدرس 13)
- [x] إنشاء صفحة تسجيل الدخول `pages/Login.tsx`
- [x] إنشاء صفحة إنشاء الحساب `pages/SignUp.tsx`
- [x] إنشاء مكون `PrivateRoute.tsx` لحماية المسارات
- [x] تعريف استعلامات GraphQL: `LOGIN`, `CREATE_USER`

### 4.3 إضافات على المرحلة (تحسينات)
- [x] إنشاء مكون القائمة المنسدلة `components/UserDropdown.tsx` — يظهر عند التحويم على اسم المستخدم في الترويسة
- [x] إنشاء مكون تعديل البيانات `components/ProfileEditor.tsx` — نموذج لتعديل اسم المستخدم وكلمة المرور مع زر حذف الحساب
- [x] تحديث مكون النموذج `components/SimpleModal.tsx` — دعم `footerExtra` و `confirmVariant` و `centered`
- [x] تعريف استعلامات GraphQL: `UPDATE_USER`, `DELETE_USER`
- [x] تحديث `components/Navbar.tsx` — استبدال زر الخروج بـ `UserDropdown`
- [x] إضافة أنماط CSS للقائمة المنسدلة (hover + animation)

---

## المرحلة الخامسة: صفحات التطبيق (الدروس 14-17)

### 5.1 إعداد صفحة المناسبات (الدرس 14)
- [x] إنشاء صفحة المناسبات `pages/Events.tsx`
- [x] إنشاء مكون عنصر المناسبة `components/EventItem.tsx`
- [x] عرض قائمة المناسبات مع التصفح والتفاصيل
- [x] تعريف استعلام `EVENTS`

### 5.2 تنظيم عرض التنبيهات والأخطاء (الدرس 15)
- [x] إنشاء مكون عرض الأخطاء `components/Error.tsx`
- [x] إنشاء مكون التحميل `components/Spinner.tsx`
- [x] دمج إدارة الأخطاء في جميع الصفحات

### 5.3 تفعيل إضافة مناسبة عبر Modal (الدرس 16)
- [x] إنشاء مكون النافذة المنبثقة `components/SimpleModal.tsx`
- [x] نموذج إنشاء مناسبة جديدة
- [x] نموذج عرض تفاصيل المناسبة وحجزها
- [x] تعريف استعلامات `CREATE_EVENT`, `BOOK_EVENT`

### 5.4 إعداد صفحة الحجوزات (الدرس 17)
- [x] إنشاء صفحة الحجوزات `pages/Bookings.tsx`
- [x] إنشاء مكون عنصر الحجز `components/BookingItem.tsx`
- [x] عرض حجوزات المستخدم مع إمكانية الإلغاء
- [x] تعريف استعلامات `BOOKINGS`, `CANCEL_BOOKING`

### 5.5 إضافات على المرحلة (تحسينات)
- [x] إنشاء صفحة مناسبات المستخدم `pages/UserEvents.tsx` — تخدم `/my-events` و `/events/user/:userId`
- [x] إمكانية تعديل المناسبة عبر نموذج منبثق (صاحب المناسبة فقط)
- [x] إمكانية حذف المناسبة مع تأكيد مضمَّن داخل البطاقة
- [x] إضافة حقل بحث مُرشَّح من الخادم (debounced) في صفحة المناسبات
- [x] عرض اسم ناشئ المناسبة في بطاقة المناسبة كرابط قابل للضغط
- [x] تحديث `EventFields` fragment ليتضمن بيانات الناشئ (`creator`)
- [x] تعريف استعلامات `GET_USER_EVENTS`, `UPDATE_EVENT`, `DELETE_EVENT`
- [x] إنشاء ملف أنواع مشتركة `client/src/types.ts` (`EventData`, `BookingData`, `Creator`)
- [x] إضافة رابط "مناسباتي" في الترويسة + مسارات جديدة في `App.tsx`
- [x] تحسين مكون عنصر الحجز `BookingItem.tsx` — عرض الناشئ وتاريخ الحجز
- [x] تحديث أنماط CSS: شريط البحث، رابط الناشئ، الحجوزات المتجاوبة

### 5.6 تعديلات الخادم
- [x] إضافة `UpdateEventInput` إلى السكيما
- [x] إضافة `searchTerm` اختياري لاستعلام `events`
- [x] إضافة محوِّل `updateEvent` مع التحقق من الملكية
- [x] إضافة واجهة `UpdateEventInput` في أنواع الخادم

---

## المرحلة السادسة: الميزات المتقدمة (الدروس 18-19)

### 6.1 استخدام الاشتراكات لتنبيه المستخدمين (الدرس 18)
- [x] إعداد اشتراك `eventAdded` في الخادم
- [x] استقبال الإشعارات في العميل عند إضافة مناسبة جديدة
- [x] عرض تنبيه للمستخدم مع تحديث القائمة تلقائياً

### 6.2 تحسينات ومزايا (الدرس 19)
- [x] تحسين تجربة المستخدم
- [x] تحسين أداء الاستعلامات
- [x] مراجعة وتنظيف الشيفرة النهائية

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

---

## تعليمات التطوير للمراحل القادمة

> هذه التعليمات مرجع مُوحَّد لأي نموذج ذكاء اصطناعي يعمل على المراحل التالية من المشروع.

### السياق العام
- المشروع عبارة عن تطبيق حجز مناسبات مبني بـ TypeScript بالكامل (خادم + عميل)
- المرجع الأساسي: مجلد `graphql/frontend` (JavaScript + CRA + React 17)
- المشروع الحالي: `web-booking-e1` (TypeScript + Vite + React 18 + Apollo Server 4)
- الاسم العام للتطبيق الظاهر للمستخدم: **مناسبات عمرو** (وليس مناسبات حسوب)

### خطوات العمل على أي مرحلة جديدة
1. **مراجعة ملف المهام** (`TASKS.md`): حدّد المهام المطلوبة في المرحلة المستهدفة
2. **مراجعة المرجع** (`graphql/frontend`): ادرس الشيفرة المرجعية بـ JavaScript لفهم المنطق الأصلي
3. **مراجعة الخادم** (`web-booking-e1/server/src`): افهم السكيما (`schema/index.ts`)، المحوِّلات (`resolvers/`)، والأنواع (`types/`) لمعرفة شكل البيانات القادمة من الخادم
4. **مراجعة ملفات العميل الحالية** (`web-booking-e1/client/src`): راجع الملفات الموجودة وعدِّل عليها مباشرة بدلاً من إنشاء ملفات جديدة
5. **التنفيذ**: نفِّذ المهام بشكل احترافي وفق أحدث الممارسات حتى وإن اختلفت عن المرجع
6. **التحقق**: تأكّد من خلو الشيفرة من أي أخطاء (TypeScript، تنسيق، بنية) عبر `npx tsc --noEmit` و `npx vite build`
7. **التحديث**: ضع علامة ✅ على المهام المُنجزة في هذا الملف

### قواعد التنفيذ الإلزامية
- **TypeScript صارم**: استخدم واجهات (Interfaces) وأنواع (Types) محددة، تجنب `any`
- **أحدث الممارسات**: استخدم React 18 APIs (`createRoot`)، Apollo Client 3.x الحديثة (`@apollo/client/link/context` بدلاً من `apollo-link-context`)، و `useCallback`/`useMemo` عند الحاجة
- **CSS Custom Properties**: الألوان الأساسية معرَّفة كمتغيرات CSS في `:root` داخل `index.css` — استخدم `var(--color-primary)` بدلاً من قيم مباشرة
- **بدون TODO في الشيفرة المُنجزة**: عند إتمام مهمة، أزِل تعليقات TODO المتعلقة بها
- **بيانات تجريبية للمكونات المستقبلية**: إذا صادفت مكوناً أو دالة لم تُبنَ بعد، ضع فيها بيانات تجريبية (Placeholder) تعمل بدون أخطاء
- **التعليقات**: اكتب تعليقات JSDoc واضحة بالإنجليزية أعلى كل ملف ودالة رئيسية
- **الواجهة**: جميع النصوص المعروضة للمستخدم بالعربية، اتجاه RTL

### البنية التقنية المُعتمدة
| العنصر | التقنية |
|--------|---------|
| إطار العميل | React 18 + Vite + TypeScript |
| إدارة البيانات | Apollo Client 3.x (`@apollo/client`) |
| التنسيق | Bootstrap 5 RTL + CSS Custom Properties |
| التوجيه | React Router DOM v6 |
| المصادقة | JWT عبر `localStorage` + `AuthContext` |
| الاشتراكات | `graphql-ws` + `GraphQLWsLink` |
| الخادم | Apollo Server 4 + Express + MongoDB |

### الملفات الأساسية (مُنجزة)
- `client/index.html` — نقطة الدخول HTML مع RTL + Arabic font + meta tags
- `client/src/main.tsx` — نقطة دخول React مع Apollo Client (HTTP + WS + Auth + Split Links)
- `client/src/App.tsx` — المكون الجذري مع التوجيه و `AuthContext.Provider` (يستخدم `useCallback`)
- `client/src/index.css` — الأنماط العامة مع CSS Custom Properties + شريط البحث + القائمة المنسدلة + التجاوبية
- `client/src/App.css` — أنماط التخطيط الرئيسي
- `client/src/types.ts` — أنواع TypeScript المشتركة (`EventData`, `BookingData`, `Creator`)
- `client/src/context/auth-context.ts` — سياق المصادقة مع TypeScript interfaces
- `client/src/graphql/fragments.ts` — أجزاء GraphQL (`EVENT_FIELDS` مع بيانات الناشئ)
- `client/src/graphql/queries.ts` — جميع استعلامات وتحويلات واشتراكات GraphQL
- `client/src/components/Navbar.tsx` — شريط التنقل المتجاوب مع `UserDropdown` + رابط مناسباتي
- `client/src/components/UserDropdown.tsx` — قائمة منسدلة عند التحويم: تعديل البيانات + تسجيل الخروج
- `client/src/components/ProfileEditor.tsx` — نموذج تعديل بيانات المستخدم (اسم + كلمة مرور) مع حذف الحساب
- `client/src/components/SimpleModal.tsx` — نموذج منبثق قابل لإعادة الاستخدام مع `footerExtra` و `confirmVariant`
- `client/src/components/EventItem.tsx` — بطاقة المناسبة مع اسم الناشئ كرابط قابل للضغط
- `client/src/components/BookingItem.tsx` — عنصر الحجز مع تفاصيل الناشئ وتاريخ الحجز
- `client/src/components/PrivateRoute.tsx` — حارس المسارات المحمية
- `client/src/components/Error.tsx` — مكون عرض التنبيهات والأخطاء
- `client/src/components/Spinner.tsx` — مكون التحميل (react-loader-spinner)
- `client/src/pages/Events.tsx` — صفحة المناسبات مع البحث والإنشاء والحجز والاشتراكات
- `client/src/pages/Bookings.tsx` — صفحة حجوزات المستخدم مع إلغاء الحجز
- `client/src/pages/UserEvents.tsx` — صفحة مناسبات المستخدم (تعديل/حذف) أو مناسبات ناشئ معيّن
- `client/src/pages/Login.tsx` — صفحة تسجيل الدخول مع التحقق + التوجيه التلقائي بعد النجاح
- `client/src/pages/SignUp.tsx` — صفحة إنشاء الحساب مع التحقق + التوجيه التلقائي بعد النجاح
