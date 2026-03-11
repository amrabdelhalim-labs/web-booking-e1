# الدرس التاسع: اختبار الخادم — E2E والمستودعات 🧪

> **هدف الدرس:** فهم كيف تُكتب اختبارات الخادم وكيف تُشغَّل

---

## 1. نظرة عامة على الاختبارات

يحتوي المشروع على ثلاثة ملفات اختبار في `server/src/tests/`:

| الملف | النوع | ما يختبر |
|-------|-------|---------|
| `api.test.ts` | E2E عبر HTTP | طلبات GraphQL الفعلية من البداية للنهاية |
| `repositories.test.ts` | وحدة (Unit) | طبقة Repository مع قاعدة البيانات |
| `comprehensive.test.ts` | تكامل (Integration) | سيناريو كامل متعدد المراحل |

---

## 2. كيفية تشغيل الاختبارات

```bash
npm run test:api          # اختبارات E2E فقط
# من مجلد server/
npm run test:repositories  # اختبارات المستودعات فقط
npm run test:comprehensive # الاختبار الشامل فقط
npm run test:all          # جميع الاختبارات
```

> **مهم:** تأكد من أن `TEST_MONGODB_URI` مضبوط في ملف `.env`. الاختبارات تستخدم قاعدة بيانات مستقلة (لا تؤثر على بيانات التطوير).

---

## 3. ملف `api.test.ts` — اختبار E2E لـ GraphQL

### ما هو الاختبار E2E؟

E2E = End-to-End = اختبار من البداية للنهاية.

```text
الاختبار يُنشئ خادماً فعلياً
        ↓
يُرسل طلبات HTTP حقيقية لـ GraphQL
        ↓
يتحقق من الاستجابات
        ↓
يُوقف الخادم ويُنظّف قاعدة البيانات
```

### بنية الملف الرئيسية

```typescript
async function graphqlRequest(query: string, token?: string) {
// دالة مساعدة ترسل طلبات GraphQL عبر HTTP
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: API_PORT,
      path: "/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: `jwt ${token}` } : {}),
      },
    };
    // إرسال الطلب وقراءة الاستجابة
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.write(JSON.stringify({ query }));
    req.end();
  });
}
```

**لماذا دالة مساعدة؟**

بدلاً من كتابة كود HTTP المعقّد في كل اختبار، نُعرّف `graphqlRequest()` مرة واحدة ونستخدمها في كل مكان.

### ما يختبره `api.test.ts`

**1. التحقق من نقطة GraphQL:**
```typescript
const introspection = await graphqlRequest(`{
  __schema { queryType { name } }
}`);
assert(introspection.data?.__schema?.queryType?.name === "Query", "...");
```

**2. تسجيل المستخدمين:**
```typescript
const register = await graphqlRequest(`
  mutation {
    createUser(userInput: {
      username: "عمرو"
      email: "amr@test.com"
      password: "Test123!"
    }) { userId token username }
  }
`);
assert(!register.errors, "تسجيل بدون أخطاء");
assert(register.data?.createUser?.token, "يُرجع token");
```

**3. منع التسجيل المكرر:**
```typescript
const dupEmail = await graphqlRequest(`
  mutation { createUser(userInput: { email: "amr@test.com", ... }) { userId } }
`);
// يجب أن يُرجع خطأ!
assert(dupEmail.errors?.length > 0, "بريد مكرر = خطأ");
```

**4. اختبار تسجيل الدخول:**
```typescript
const login = await graphqlRequest(`
// بيانات صحيحة
  mutation { login(email: "amr@test.com", password: "Test123!") { token userId } }
`);
assert(!login.errors, "تسجيل دخول ناجح");

// كلمة مرور خاطئة
const badLogin = await graphqlRequest(`
  mutation { login(email: "amr@test.com", password: "خطأ") { token } }
`);
assert(badLogin.errors?.length > 0, "كلمة مرور خاطئة = خطأ");
```

**5. عمليات المناسبات (CRUD):**
```typescript
const createEvent = await graphqlRequest(`
// إنشاء مناسبة (يحتاج token)
  mutation {
    createEvent(eventInput: {
      title: "مؤتمر التقنية"
      description: "مؤتمر سنوي"
      price: 150
      date: "2026-06-15T10:00:00"
    }) { _id title price }
  }
`, authToken);

// قراءة المناسبات (لا يحتاج token)
const events = await graphqlRequest(`
  query { events { rows { _id title price } count } }
`);
```

**6. اختبار الحجوزات:**
```typescript
const booking = await graphqlRequest(`
// حجز مناسبة
  mutation { bookEvent(eventId: "${eventId}") { _id event { title } } }
`, authToken);

// منع الحجز المكرر
const dupBooking = await graphqlRequest(`
  mutation { bookEvent(eventId: "${eventId}") { _id } }
`, authToken);
assert(dupBooking.errors?.length > 0, "حجز مكرر = خطأ");

// إلغاء الحجز
const cancel = await graphqlRequest(`
  mutation { cancelBooking(bookingId: "${bookingId}") { _id } }
`, authToken);
```

**7. اختبار الأمان:**
```typescript
const noAuth = await graphqlRequest(`
// محاولة حجز بدون token
  mutation { bookEvent(eventId: "${eventId}") { _id } }
`);
assert(noAuth.errors?.length > 0, "بدون مصادقة = خطأ UNAUTHENTICATED");

// محاولة حذف مناسبة من مستخدم آخر
const wrongUser = await graphqlRequest(`
  mutation { deleteEvent(eventId: "${eventId}") }
`, secondUserToken);
assert(wrongUser.errors?.length > 0, "مستخدم آخر = خطأ FORBIDDEN");
```

### لماذا هذه الاختبارات مهمة؟

```text
api.test.ts يختبر "السلوك الكامل" كما يراه المستخدم الحقيقي:
    ✓ هل GraphQL يستجيب صحيحاً؟
    ✓ هل المصادقة تمنع الوصول غير المصرح؟
    ✓ هل الأخطاء تُرسَل بالصيغة الصحيحة؟
    ✓ هل بيانات الاستجابة مكتملة؟
```

---

## 4. ملف `repositories.test.ts` — اختبار المستودعات

### الهدف

اختبار طبقة Repository مباشرة مع MongoDB — بدون تشغيل خادم HTTP.

```text
الاختبار يتصل بـ MongoDB
       ↓
يستدعي دوال Repository مباشرة
       ↓
يتحقق من النتائج
```

### مثال: اختبار UserRepository

```typescript
const repos = getRepositoryManager();

// إنشاء مستخدم
const user = await repos.user.create({
  username: "أحمد",
  email: "ahmed@test.com",
  password: "hashed_password",
});
assert(user !== null, "المستخدم أُنشئ بنجاح");
assert(user.username === "أحمد", "الاسم صحيح");

// البحث بالبريد الإلكتروني
const found = await repos.user.findByEmail("ahmed@test.com");
assert(found !== null, "تم إيجاد المستخدم");
assert(found!.email === "ahmed@test.com", "البريد صحيح");

// التحقق من وجود بريد
const exists = await repos.user.emailExists("ahmed@test.com");
assert(exists === true, "البريد موجود");

const notExists = await repos.user.emailExists("nobody@test.com");
assert(notExists === false, "البريد غير موجود");
```

### مثال: اختبار EventRepository

```typescript
const event = await repos.event.create({
// إنشاء مناسبة
  title: "مؤتمر التقنية",
  description: "مؤتمر سنوي للتقنية",
  price: 150,
  date: new Date("2026-06-15"),
  creator: userId,
});
assert(event.title === "مؤتمر التقنية", "العنوان صحيح");

// البحث النصي
const results = await repos.event.search("مؤتمر");
assert(results.length === 1, "البحث يُرجع نتيجة واحدة");

// التحقق من تكرار العنوان
const titleExists = await repos.event.titleExists("مؤتمر التقنية");
assert(titleExists === true, "العنوان موجود");

// الصفحات (Pagination)
const page = await repos.event.findPaginated({ skip: 0, limit: 8 });
assert(page.rows.length <= 8, "لا تتجاوز 8 نتائج");
assert(page.count >= 1, "إجمالي الأعداد صحيح");
```

### مثال: اختبار BookingRepository

```typescript
const booking = await repos.booking.createAndPopulate(
// إنشاء حجز
  userId.toString(),
  eventId.toString()
);
assert(booking._id !== undefined, "الحجز أُنشئ");
assert(booking.event.title === "مؤتمر التقنية", "بيانات المناسبة محضرة");

// التحقق من عدم تكرار الحجز
const alreadyBooked = await repos.booking.userHasBooked(userId, eventId);
assert(alreadyBooked === true, "المستخدم حجز مسبقاً");

// حذف حجوزات مناسبة (Cascade Delete)
await repos.booking.deleteByEvent(eventId.toString());
const count = await repos.booking.count({ event: eventId });
assert(count === 0, "كل حجوزات المناسبة حُذفت");
```

### لماذا نختبر Repository بشكل مستقل؟

```text
Repository Tests ↔ API Tests

api.test.ts:
    ✓ يختبر "هل يعمل التطبيق ككل؟"
    ✗ إذا فشل, قد يكون Resolver أو Schema أو Repository

repositories.test.ts:
    ✓ يختبر "هل قاعدة البيانات تتصرف صحيحاً؟"
    ✓ إذا فشل  // المشكلة محددة في Repository
```

---

## 5. ملف `comprehensive.test.ts` — الاختبار الشامل

### الهدف

محاكاة **سيناريو استخدام كامل** يشمل كل العمليات معاً بترتيب منطقي.

### المراحل الست:

```text
Phase 1: User Creation (إنشاء 3 مستخدمين + تحقق من bcrypt)
    ↓
Phase 2: Event Creation (إنشاء 3 مناسبات + تحقق من العناوين)
    ↓
Phase 3: Event Search & Queries (بحث + تصفية + صفحات)
    ↓
Phase 4: Booking Management (حجوزات + منع التكرار)
    ↓
Phase 5: Update Operations (تعديل مناسبة + ملف شخصي)
    ↓
Phase 6: Cascade Delete (حذف مستخدم  // حجوزاته + مناسباته تُحذف تلقائياً)
```

### مثال: Phase 1 — إنشاء المستخدمين

```typescript
logSection("Phase 1: User Creation");

// تجزئة كلمة المرور (تحاكي ما يفعله Auth Resolver)
const hashedPass = await bcrypt.hash("Test123!", 12);

const user1 = await repos.user.create({
  username: "عمرو",
  email: "amr@test.com",
  password: hashedPass,
});

// التحقق من صحة التجزئة
const isCorrect = await bcrypt.compare("Test123!", user1.password);
assert(isCorrect === true, "التجزئة صحيحة");

// التحقق من منع التكرار
const emailTaken = await repos.user.emailExists("amr@test.com");
assert(emailTaken === true, "البريد مكرر");
```

### مثال: Phase 6 — الحذف التتالي (Cascade Delete)

```typescript
logSection("Phase 6: Cascade Delete");

// احفظ عدد الحجوزات قبل الحذف
const bookingsBefore = await repos.booking.count();
assert(bookingsBefore > 0, "توجد حجوزات");

// احذف مناسبات المستخدم (التي تحمل حجوزات)
const eventIds = await repos.event.getEventIdsByCreator(user1Id);
for (const eventId of eventIds) {
  await repos.booking.deleteByEvent(eventId); // [1] احذف الحجوزات
  await repos.event.delete(eventId);           // [2] احذف المناسبة
}

// تحقق أن كل شيء حُذف
const bookingsAfter = await repos.booking.count({ event: { $in: eventIds } });
assert(bookingsAfter === 0, "كل الحجوزات المرتبطة حُذفت");
```

---

## 6. نظام التقارير المخصص

الاختبارات لا تستخدم framework جاهزاً (مثل Jest). بدلاً من ذلك، تستخدم دوالاً مساعدة مخصصة:

```typescript
function assert(condition: boolean, message: string) {
// أداة الفحص الأساسية
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

// عرض قسم جديد
function logSection(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(60));
}

// عرض خطوة
function logStep(msg: string) {
  console.log(`  → ${msg}`);
}

// عرض خطأ
function logError(msg: string) {
  console.error(`\n❌ ERROR: ${msg}`);
}
```

**مثال على مخرجات الاختبار:**
```text
════════════════════════════════════════════════════════════
  API E2E Tests — Event Booking GraphQL
════════════════════════════════════════════════════════════
  → Connecting to test DB: mongodb://localhost:27017/test-db

════════════════════════════════════════════════════════════
  User Registration
════════════════════════════════════════════════════════════
  → Registering user 1...
  ✅ User 1 registered without errors
  ✅ Registration returns token
  ✅ Registration returns username
  → Testing duplicate email...
  ✅ Duplicate email returns error
```

---

## 7. إعداد البيئة للاختبارات

### ملف `.env` (قيم الاختبار):
```env
TEST_MONGODB_URI=mongodb://localhost:27017/event-booking-test
# قاعدة بيانات مستقلة للاختبارات
```

### تنظيف قاعدة البيانات قبل كل تشغيل:
```typescript
const collections = mongoose.connection.collections;
// في بداية كل ملف اختبار
for (const key of Object.keys(collections)) {
  await collections[key].deleteMany({});
}
```

لماذا؟ لضمان أن كل تشغيل يبدأ بقاعدة بيانات نظيفة وغير متأثرة بتشغيلات سابقة.

---

## 8. خلاصة

```text
api.test.ts

ثلاثة مستويات من الاختبارات:
  └── اختبر "ماذا يرى المستخدم النهائي"
  └── يُشغّل خادماً حقيقياً ويُرسل HTTP requests

repositories.test.ts
  └── اختبر "هل قاعدة البيانات تتصرف صحيحاً"
  └── يستدعي Repository مباشرة بدون خادم

comprehensive.test.ts
  └── اختبر "هل التدفق الكامل يعمل معاً"
  └── سيناريو واقعي من البداية للنهاية
```

---

**📖 الخطوة التالية:** [اختبارات العميل](../client/07-testing.md)
