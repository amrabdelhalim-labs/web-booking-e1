# المرجع السريع — خريطة التعلم 🗺️

> مرجع سريع لكل ما تحتاجه لفهم مشروع مناسباتي

---

## خريطة المشروع

```text
web-booking-e1/
├── server/              ← Node.js + TypeScript + GraphQL
│   └── src/
│       ├── index.ts         → [درس 1] نقطة البداية
│       ├── config/          → [درس 2] الإعدادات وـ MongoDB
│       ├── schema/          → [درس 3] مخطط GraphQL
│       ├── resolvers/
│       │   ├── auth.ts      → [درس 4] تسجيل الدخول والتسجيل
│       │   ├── event.ts     → [درس 7] عمليات المناسبات
│       │   └── booking.ts   → [درس 8] عمليات الحجوزات
│       ├── middlewares/
│       │   └── isAuth.ts    → [درس 5] حارس المصادقة
│       └── repositories/    → [درس 6] نمط المستودع
│
└── client/              ← React + TypeScript + Apollo
    └── src/
        ├── App.tsx          → [عميل-1] هيكل التطبيق والتوجيه
        ├── context/         → [عميل-2] سياق المصادقة
        ├── main.tsx         → [عميل-3] Apollo Client
        ├── graphql/         → [عميل-4] الاستعلامات والطفرات
        ├── pages/Login.tsx  → [عميل-5] صفحة تسجيل الدخول
        └── components/
            └── PrivateRoute → [عميل-6] حارس المسار
```

---

## مسار التعلم المقترح

### للمبتدئين (ابدأ من هنا):
1. [concepts-guide.md](./concepts-guide.md) ← اقرأ المفاهيم أولاً
2. [server/02-mongodb-connection.md](./server/02-mongodb-connection.md) ← قواعد البيانات
3. [server/03-graphql-schema.md](./server/03-graphql-schema.md) ← GraphQL
4. [server/04-auth-resolver.md](./server/04-auth-resolver.md) ← المصادقة
5. [client/01-app-structure.md](./client/01-app-structure.md) ← هيكل العميل

### لفهم الأمان:
1. [server/04-auth-resolver.md](./server/04-auth-resolver.md) ← JWT + bcrypt
2. [server/05-auth-middleware.md](./server/05-auth-middleware.md) ← isAuthenticated
3. [client/02-auth-context.md](./client/02-auth-context.md) ← Context + localStorage
4. [client/06-private-route.md](./client/06-private-route.md) ← PrivateRoute

### لفهم GraphQL مع Real-Time:
1. [server/03-graphql-schema.md](./server/03-graphql-schema.md) ← Schema
2. [server/07-event-resolver.md](./server/07-event-resolver.md) ← Subscriptions
3. [client/03-graphql-client.md](./client/03-graphql-client.md) ← Apollo WebSocket
4. [client/04-graphql-queries.md](./client/04-graphql-queries.md) ← Queries/Mutations

### لفهم نمط Repository:
1. [server/06-repository-pattern.md](./server/06-repository-pattern.md) ← المفهوم
2. [server/07-event-resolver.md](./server/07-event-resolver.md) ← التطبيق العملي
3. [server/08-booking-resolver.md](./server/08-booking-resolver.md) ← مزيد من الأمثلة

---

## مرجع سريع للأكواد الحرجة

### ⚠️ الـ Auth Header المختلف!
```typescript
authorization: token ? `JWT ${token}` : ""
// في client/src/main.tsx:
//                      ↑ "JWT " لا "Bearer "!

// في server/src/index.ts:
const authToken = auth.slice(4); // يزيل "jwt " (4 أحرف)
```

### طريقة حماية Resolver
```typescript
someAction: combineResolvers(
// دائماً هكذا لأي عملية تحتاج مصادقة:
  isAuthenticated,    // [1] التحقق
  async (_p, args, context) => { // [2] التنفيذ
    const repos = getRepositoryManager();
    // ✓ context.user متاح ومضمون هنا
  }
),
```

### طريقة استخدام Repository
```typescript
const repos = getRepositoryManager();
// الطريقة الصحيحة:
const user = await repos.user.findByEmail(email);
const event = await repos.event.findById(eventId);
const booking = await repos.booking.userHasBooked(userId, eventId);
```

### البث الفوري (Publish)
```typescript
pubsub.publish("EVENT_ADDED", { eventAdded: createdEvent });
// في Mutation — عند تغيير البيانات:

// في Subscription — للاستماع:
subscribe: () => pubsub.asyncIterator(["EVENT_ADDED"])
```

---

## نقاط التفتيش (Checkpoints)

بعد دراسة كل جزء، تأكد أنك تستطيع الإجابة على:

### الخادم:
- [ ] كيف يصل `context.user` لكل Resolver؟
- [ ] لماذا `auth.slice(4)` وليس `auth.slice(7)` (Bearer)؟
- [ ] ما الفرق بين `type` و `input` في GraphQL Schema؟
- [ ] كيف يمنع `combineResolvers` الوصول غير المصرح؟
- [ ] ما فائدة Repository Pattern عملياً؟
- [ ] كيف تعمل `pubsub.publish` و `asyncIterator` معاً؟

### العميل:
- [ ] لماذا `AppRoutes` مكوّن منفصل عن `App`؟
- [ ] ما دور `localStorage` في المصادقة؟
- [ ] كيف يوجّه `splitLink` بين HTTP و WebSocket؟
- [ ] ما الفرق بين `useQuery` و `useMutation`؟
- [ ] لماذا نحتاج حماية في العميل **و** الخادم معاً؟
- [ ] كيف يعمل Debounced Search مع Apollo في `Events.tsx`؟
- [ ] لماذا `useAuth` بدلاً من `useContext` مباشرة؟
- [ ] كيف تخدم `UserEventsPage` مسارين مختلفين؟
---

## الاختصارات المفيدة

| الاختصار | المعنى |
|----------|--------|
| JWT | JSON Web Token |
| ODM | Object Document Mapper (Mongoose) |
| ORM | Object Relational Mapper (Sequelize) |
| GQL | GraphQL |
| WS | WebSocket |
| RTL | Right-To-Left (عربي) |
| CRUD | Create, Read, Update, Delete |
| DRY | Don't Repeat Yourself |
| TSX | TypeScript + JSX (React) |

---

## روابط الدروس

### الخادم (Server):
- [01 - الإعداد والخادم](./server/01-server-setup.md)
- [02 - الاتصال بـ MongoDB](./server/02-mongodb-connection.md)
- [03 - مخطط GraphQL](./server/03-graphql-schema.md)
- [04 - محلّل المصادقة](./server/04-auth-resolver.md)
- [05 - حارس المصادقة](./server/05-auth-middleware.md)
- [06 - نمط المستودع](./server/06-repository-pattern.md)
- [07 - محلّل المناسبات](./server/07-event-resolver.md)
- [08 - محلّل الحجوزات](./server/08-booking-resolver.md)
- [09 - الاختبارات](./server/09-testing.md)
- [10 - المدققات والأنواع والتحويلات](./server/10-validators-types.md)

### العميل (Client):
- [01 - هيكل التطبيق](./client/01-app-structure.md)
- [02 - سياق المصادقة](./client/02-auth-context.md)
- [03 - Apollo Client](./client/03-graphql-client.md)
- [04 - الاستعلامات](./client/04-graphql-queries.md)
- [05 - صفحة الدخول](./client/05-login-page.md)
- [06 - حارس المسار](./client/06-private-route.md)
- [07 - الاختبارات](./client/07-testing.md)
- [08 - صفحات التطبيق](./client/08-pages.md)
- [09 - المكوّنات والأدوات المساعدة](./client/09-components.md)

### المراجع:
- [دليل المفاهيم](./concepts-guide.md)
- [المرجع السريع](./quick-reference.md) ← أنت هنا

---

## 🔗 أدوات سريعة

| الأداة | الأمر | الملاحظة |
|-------|-------|----------|
| 🎨 تنسيق الكود | `node format.mjs` | تنسيق جميع الملفات |
| 🎨 فحص التنسيق | `node format.mjs --check` | يخرج برمز 1 إذا وجد مشاكل |
| 🔍 فحص الورك فلو | `node validate-workflow.mjs` | يكتشف أخطاء CI محلياً قبل الرفع |
| 🧪 الاختبارات | `npm run test:all` / `npm test` | خادم / عميل |

---

*"المعرفة تُبنى طبقة فوق طبقة — لا تتعجّل، وستجد أن كل شيء منطقي في النهاية!"* 🚀
