# Testing Guide - Event Booking (مناسباتي)

## نظرة عامة

المشروع يحتوي على مجموعتين من الاختبارات:
- **اختبارات السيرفر**: بدون مكتبات خارجية (Custom test framework)
- **اختبارات العميل**: Vitest + Testing Library

---

## البدء السريع

### اختبارات السيرفر

```bash
cd server
npm install

# جميع الاختبارات
npm run test:all

# اختبارات فردية
npm test                    # Repository tests (43 اختبار)
npm run test:comprehensive  # Comprehensive tests (45 اختبار)
npm run test:e2e            # E2E API tests (43 اختبار)
```

### اختبارات العميل

```bash
cd client
npm install

npm test           # تشغيل الاختبارات (54 اختبار)
npm run test:watch # تشغيل مستمر
```

**المتطلبات:**
- خادم MongoDB يعمل على `localhost:27017`
- Node.js 22.x

---

## اختبارات السيرفر

### حزمة 1: Repository Tests (43 اختبار)

```bash
npm test
```

تختبر جميع عمليات CRUD لكل repository:

| القسم | عدد الاختبارات | التغطية |
|-------|---------------|---------|
| Repository Manager | 4 | Health check + وصول للـ repositories |
| User Repository | 6 | Create, findByEmail, emailExists, findById, updateProfile, count |
| Event Repository | 7 | Create, findAllWithCreator, findByCreator, search, titleExists, getEventIdsByCreator, count |
| Booking Repository | 6 | Create, userHasBooked, findByUser, findByIdWithDetails, countByEvent, deleteByEvent |
| Cascade Delete | 3 | حذف متسلسل للمستخدم مع المناسبات والحجوزات |
| **Cleanup** | — | تنظيف قاعدة بيانات الاختبار |

### حزمة 2: Comprehensive Tests (45 اختبار)

```bash
npm run test:comprehensive
```

تختبر سيناريوهات العمل الكاملة عبر 8 مراحل:

| المرحلة | الوصف |
|---------|-------|
| 1. Registration | تسجيل مستخدمين، تكرار البريد |
| 2. Event Creation | إنشاء مناسبات، تكرار العنوان |
| 3. Search & Queries | البحث والاستعلامات |
| 4. Bookings | الحجز، منع التكرار، منع حجز مناسبتك |
| 5. Event Updates | تعديل المناسبات، تحقق الملكية |
| 6. Booking Cancellation | إلغاء الحجز |
| 7. Cascade Delete | حذف مستخدم متسلسل |
| 8. Input Validation | التحقق من المدخلات (validators) |

### حزمة 3: E2E API Tests (43 اختبار)

```bash
npm run test:e2e
```

تختبر واجهة GraphQL كاملة عبر HTTP:

| القسم | التغطية |
|-------|---------|
| GraphQL Endpoint | Introspection |
| User Registration | تسجيل + تكرار البريد |
| Login | نجاح + كلمة مرور خاطئة + بريد غير موجود |
| Auth Protection | حماية المسارات |
| Event Operations | CRUD + بحث + ملكية |
| Booking Operations | حجز + تكرار + إلغاء |
| User Profile | تعديل الملف الشخصي |
| Delete Operations | حذف مناسبة + حذف مستخدم |
| Error Structure | هيكل أخطاء GraphQL |

---

## اختبارات العميل

### الإعداد

الاختبارات تستخدم:
- **Vitest** — إطار الاختبار (متوافق مع Vite)
- **@testing-library/react** — اختبار مكونات React
- **@testing-library/jest-dom** — matchers إضافية للـ DOM
- **jsdom** — بيئة DOM اصطناعية

### التكوين

```typescript
// vite.config.ts
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: "./src/setupTests.ts",
}
```

### ملفات الاختبار (5 ملفات، 54 اختبار)

| الملف | عدد الاختبارات | التغطية |
|-------|---------------|---------|
| `config.test.ts` | 9 | ثوابت التطبيق، روابط GraphQL، قيم افتراضية |
| `types.test.ts` | 10 | أنواع Creator, EventData, BookingData |
| `formatDate.test.ts` | 11 | formatDateShort, formatDateArabic, formatDateForInput, formatDateFull |
| `useAuth.test.tsx` | 5 | خطاف المصادقة: قراءة، تخزين، login, logout |
| `graphql.test.ts` | 19 | جميع العمليات (14 عملية) + fragments + تغطية شاملة |

### تفصيل الاختبارات

#### config.test.ts — ثوابت الإعدادات
```
✓ اسم التطبيق معرّف
✓ المسار الأساسي معرّف
✓ نطاق التطبيق معرّف
✓ رابط HTTP يبدأ بـ http
✓ رابط HTTP ينتهي بـ /graphql
✓ رابط WebSocket يبدأ بـ ws
✓ رابط WebSocket ينتهي بـ /graphql
✓ بروتوكول WS يتطابق مع HTTP
✓ القيمة الافتراضية تشير إلى localhost
```

#### types.test.ts — أنواع TypeScript
```
✓ Creator يحتوي على _id, username, email
✓ EventData يتطابق مع استجابة GraphQL
✓ EventData يتضمن بيانات المنشئ
✓ السعر رقم موجب
✓ التاريخ بصيغة ISO
✓ BookingData يتضمن المناسبة والمستخدم
```

#### formatDate.test.ts — أدوات التاريخ
```
✓ formatDateShort: ISO → YYYY/MM/DD
✓ formatDateShort: تاريخ بمسافة
✓ formatDateShort: تاريخ بدون وقت
✓ formatDateArabic: تحويل عربي
✓ formatDateForInput: datetime-local
✓ formatDateFull: بدون ملي ثانية
```

#### useAuth.test.tsx — خطاف المصادقة
```
✓ القيم الأولية null
✓ قراءة token من localStorage
✓ login يخزّن البيانات
✓ logout يمسح البيانات
✓ login ثم logout بالتتابع
```

#### graphql.test.ts — عمليات GraphQL
```
✓ EVENT_FIELDS fragment معرّف
✓ EVENTS يدعم البحث والتصفح
✓ GET_USER_EVENTS يتطلب userId
✓ LOGIN يتطلب email + password
✓ CREATE_EVENT يستخدم eventInput
✓ جميع العمليات (14) معرّفة ولها نص مصدري
```

---

## إطار الاختبار المخصص (Server)

السيرفر يستخدم إطار اختبار خاص بدون مكتبات خارجية:

```typescript
// test.helpers.ts
function assert(condition: boolean, message: string): void;
function logSection(title: string): void;
function logStep(message: string): void;
function printSummary(): void;
```

### لماذا بدون مكتبات؟

| الميزة | مكتبات (Jest/Mocha) | إطار مخصص |
|--------|---------------------|------------|
| الاعتماديات | عديدة | صفر |
| سرعة التشغيل | بطيء (JIT) | فوري |
| حجم node_modules | كبير | لا زيادة |
| التعلم | يحتاج وقت | بسيط جداً |
| مناسب للتعليم | معقد | واضح ومباشر |

---

## الناتج المتوقع

### السيرفر (npm run test:all)
```
═══ Repository Tests — Event Booking ═══
  ✓ ALL 43 TESTS PASSED

═══ Comprehensive Tests — Event Booking ═══
  ✓ ALL 45 TESTS PASSED

═══ API E2E Tests — Event Booking GraphQL ═══
  ✓ ALL 43 TESTS PASSED
```

### العميل (npm test)
```
 ✓ src/tests/types.test.ts (10 tests)
 ✓ src/tests/config.test.ts (9 tests)
 ✓ src/tests/formatDate.test.ts (11 tests)
 ✓ src/tests/useAuth.test.tsx (5 tests)
 ✓ src/tests/graphql.test.ts (19 tests)

 Test Files  5 passed (5)
      Tests  54 passed (54)
```

---

## الملخص الكامل

| الحزمة | الإطار | عدد الاختبارات |
|--------|--------|---------------|
| Server: Repositories | Custom | 43 |
| Server: Comprehensive | Custom | 45 |
| Server: E2E API | Custom | 43 |
| Client: Vitest | Vitest + Testing Library | 54 |
| **المجموع** | — | **185** |
