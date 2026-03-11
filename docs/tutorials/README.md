# توثيقات تعليمية — مشروع مناسباتي 📖

> شروحات تفصيلية بأسلوب تعليمي لجميع الملفات المعقدة في المشروع

---

## لمحة عن المشروع

**مناسباتي** = تطبيق ويب لحجز المناسبات (Event Booking)

| الجانب | التقنية |
|--------|---------|
| الخادم | Node.js + Express + TypeScript |
| API | GraphQL (Apollo Server 4) |
| Real-Time | WebSocket + graphql-ws |
| قاعدة البيانات | MongoDB + Mongoose |
| النمط المعماري | Repository Pattern |
| العميل | React + TypeScript + Vite |
| إدارة GraphQL | Apollo Client |

---

## فهرس الدروس

### الخادم (Server)

| # | الملف | الموضوع |
|---|-------|---------|
| 1 | [01-server-setup.md](./server/01-server-setup.md) | إعداد الخادم — Apollo + WebSocket |
| 2 | [02-mongodb-connection.md](./server/02-mongodb-connection.md) | الاتصال بـ MongoDB والإعدادات |
| 3 | [03-graphql-schema.md](./server/03-graphql-schema.md) | مخطط GraphQL — عقد الاتفاق |
| 4 | [04-auth-resolver.md](./server/04-auth-resolver.md) | محلّل المصادقة — login وcreateUser |
| 5 | [05-auth-middleware.md](./server/05-auth-middleware.md) | حارس المصادقة — isAuthenticated |
| 6 | [06-repository-pattern.md](./server/06-repository-pattern.md) | نمط المستودع — IRepository |
| 7 | [07-event-resolver.md](./server/07-event-resolver.md) | محلّل المناسبات — CRUD + Real-Time |
| 8 | [08-booking-resolver.md](./server/08-booking-resolver.md) | محلّل الحجوزات |
| 9 | [09-testing.md](./server/09-testing.md) | اختبارات الخادم — E2E والمستودعات |
| 10 | [10-validators-types.md](./server/10-validators-types.md) | المدققات والأنواع والتحويلات |

### العميل (Client)

| # | الملف | الموضوع |
|---|-------|---------|
| 1 | [01-app-structure.md](./client/01-app-structure.md) | هيكل التطبيق والتوجيه |
| 2 | [02-auth-context.md](./client/02-auth-context.md) | سياق المصادقة وـ useAuth |
| 3 | [03-graphql-client.md](./client/03-graphql-client.md) | Apollo Client — HTTP + WebSocket |
| 4 | [04-graphql-queries.md](./client/04-graphql-queries.md) | الاستعلامات والطفرات |
| 5 | [05-login-page.md](./client/05-login-page.md) | صفحة تسجيل الدخول |
| 6 | [06-private-route.md](./client/06-private-route.md) | حارس المسار الخاص |
| 7 | [07-testing.md](./client/07-testing.md) | اختبارات العميل — Vitest |
| 8 | [08-pages.md](./client/08-pages.md) | صفحات التطبيق — Events، Bookings، SignUp، UserEvents |
| 9 | [09-components.md](./client/09-components.md) | المكوّنات والأنواع والأدوات المساعدة |

### المراجع

| الملف | الغرض |
|-------|--------|
| [concepts-guide.md](./concepts-guide.md) | شرح كل التقنيات والمفاهيم |
| [quick-reference.md](./quick-reference.md) | خريطة التعلم والمرجع السريع |

---

## مسار التعلم المقترح

```text
  concepts-guide → server/02 → server/03 → server/04 → client/01
للمبتدئ تماماً:

لفهم GraphQL بعمق:
  server/03 (Schema) → server/04 (Auth) → server/07 (Events) → client/03 (Apollo)

لفهم الأمان:
  server/04 → server/05 → client/02 → client/06

لفهم Real-Time:
  server/07 → server/08 → client/03 → client/04

لفهم التحقق والأنواع:
  server/10 → server/06 → server/04

لفهم مكوّنات الواجهة كاملاً:
  client/01 → client/08 → client/09
```

---

*جميع الشروحات بالعربية — أسماء الملفات بالإنجليزية*
