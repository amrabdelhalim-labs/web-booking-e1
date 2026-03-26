# دليل المفاهيم — المصطلحات والتقنيات 📚

> مرجع شامل لكل التقنيات والمفاهيم المستخدمة في مشروع مناسباتي

---

## 1. GraphQL

### ما هو؟
بروتوكول للـ API طوّره Meta (Facebook) عام 2015.  
بديل لـ REST API، لكن أكثر مرونة وكفاءة.

### المفاهيم الأساسية:

| المفهوم | الشرح |
|---------|-------|
| **Schema** | عقد بين العميل والخادم — يحدد الأنواع والعمليات المتاحة |
| **Query** | طلب قراءة البيانات |
| **Mutation** | طلب تغيير البيانات (إنشاء/تعديل/حذف) |
| **Subscription** | اشتراك للتحديثات الفورية عبر WebSocket |
| **Resolver** | الدالة التي تنفّذ كل عملية في الخادم |
| **Type** | نوع البيانات (User, Event, Booking) |
| **Fragment** | حقول مشتركة قابلة لإعادة الاستخدام |

### الفرق عن REST:
```text
REST:
  GET  /events  // مسار خاص لكل عملية
  POST /events
  PUT  /events/1
  
GraphQL:
  POST /graphql  // مسار واحد لكل شيء
  body: { query: "..." }
```

---

## 2. Apollo Server (الخادم)

### ما هو؟
أكثر framework شعبية لبناء GraphQL API بـ Node.js.

### الإصدار المستخدم: Apollo Server 4
```typescript
const server = new ApolloServer({ schema });
```

### الميزات الرئيسية:
- دعم HTTP + WebSocket
- سياق (Context) متاح لكل Resolver
- Playground لاختبار الاستعلامات

---

## 3. Apollo Client (العميل)

### ما هو؟
مكتبة React للتواصل مع GraphQL API.

### الأدوات الرئيسية:
```typescript
useQuery(QUERY, { variables })    // قراءة
useMutation(MUTATION)             // كتابة
useSubscription(SUBSCRIPTION)     // تحديث فوري
```

### إدارة الـ Cache:
Apollo يُخزّن النتائج تلقائياً.  
نفس الاستعلام مرتين → نتيجة من الـ Cache (أسرع + أقل ضغطاً على الخادم).

---

## 4. MongoDB

### ما هو؟
قاعدة بيانات NoSQL تُخزّن البيانات كوثائق JSON.

### المصطلحات:
| MongoDB | SQL (مقارنة) |
|---------|-------------|
| Database | Database |
| Collection | Table |
| Document | Row |
| Field | Column |

### مثال Document:
```json
{
  "_id": "64ab12cd...",
  "title": "حفل موسيقي",
  "price": 50.0,
  "date": "2024-02-14T18:00:00.000Z",
  "creator": "64ab00xx..."   ← ObjectId يشير لمستخدم
}
```

---

## 5. Mongoose

### ما هو؟
ODM (Object Document Mapper) — مكتبة TypeScript/JavaScript لـ MongoDB.

### الأجزاء الرئيسية:
```typescript
// Schema = تعريف البنية
const eventSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
});

// Model = الباب للوصول لـ Collection
const Event = model("Event", eventSchema);

// الاستخدام:
const events = await Event.find({});
const event = await Event.findById("abc123");
const newEvent = await Event.create({ title: "...", price: 50 });
```

---

## 6. TypeScript

### ما هو؟
JavaScript + أنواع بيانات (Type System).

### الأنواع الأساسية:
```typescript
string    // نص
number    // رقم
boolean   // صح/خطأ
null      // بلا قيمة
undefined // غير معرّف
string[]  // مصفوفة نصوص
string | null  // نص أو null
```

### الـ Interfaces:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// الاستخدام:
const user: User = { id: "1", name: "أحمد", email: "x@x.com" };
```

### لماذا TypeScript؟
- اكتشاف الأخطاء قبل التشغيل
- Autocomplete في المحرر
- كود أوضح وأسهل للفهم

---

## 7. WebSocket

### ما هو؟
بروتوكول اتصال **ثنائي الاتجاه** و **مستمر**.

### الفرق عن HTTP:
```text
HTTP:
  العميل يسأل  // الخادم يُجيب  // الاتصال ينتهي
  (كل طلب = اتصال جديد)

WebSocket:
  العميل يتصل  // الاتصال يبقى مفتوحاً
  الخادم يُرسل بيانات في أي وقت  // بدون طلب!
```

### الاستخدام هنا:
```text
ws://localhost:4000/graphql  ← WebSocket endpoint
العميل يشترك: subscription { eventAdded { title } }
عند إنشاء مناسبة  // الخادم يُرسل فوراً لكل المشتركين
```

---

## 8. JWT (JSON Web Token)

### ما هو؟
وثيقة رقمية مشفرة تُثبت هوية المستخدم.

### البنية:
```text
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY0YWIxMiJ9.SIGNATURE
|_____ Header _____|.|___ Payload _____|.|___ Sig ___|
```

### الـ Payload:
```json
{ "id": "64ab12...", "iat": 1705123456 }
```

### كيف يعمل:
```text
[1] المستخدم يسجّل دخوله  // الخادم يُنشئ JWT و يُرسله
[2] العميل يحفظ JWT في localStorage
[3] في كل طلب: العميل يُرسل JWT في الـ header
[4] الخادم يُفكّك JWT  // يعرف هوية المستخدم
```

---

## 9. Repository Pattern

### ما هو؟
نمط تصميم (Design Pattern) يفصل منطق الوصول للبيانات عن منطق العمل.

### الطبقات:
```text
Resolver (منطق العمل)
  // يستخدم
Repository (الوصول للبيانات)
  // يستخدم
Database (MongoDB)
```

### الفائدة:
```text
تغيير قاعدة البيانات:
  بدون Repository  // تغيير جميع الـ Resolvers
  مع Repository  // تغيير الـ Repository فقط ✓
```

---

## 10. PubSub (Publish-Subscribe)

### ما هو؟
نمط اتصال يفصل المُرسِل عن المُستقبِل.

### كيف يعمل:
```typescript
pubsub.publish("EVENT_ADDED", { eventAdded: newEvent });
// الخادم ينشر حدثاً:

// العميل مشترك:
subscribe: () => pubsub.asyncIterator(["EVENT_ADDED"])
// → يستقبل الحدث فور نشره!
```

### في GraphQL Subscriptions:
```text
    ↓ pubsub.publish("EVENT_ADDED")
مستخدم ينشئ مناسبة
    ↓
كل العملاء المشتركين بـ subscription { eventAdded }
  // يستقبلون البيانات فوراً عبر WebSocket
```

---

## 11. React Context

### ما هو؟
آلية لمشاركة البيانات بين مكونات React بدون تمرير Props.

### الأجزاء:
```typescript
const MyContext = createContext(defaultValue);
// [1] إنشاء:

// [2] التوفير (Provider):
<MyContext.Provider value={sharedData}>
  <App />
</MyContext.Provider>

// [3] الاستهلاك (Consumer):
const data = useContext(MyContext);
// أو بـ custom hook:
const data = useMyHook();
```

---

## 12. React Router DOM

### ما هو؟
مكتبة التنقل بين الصفحات في React.

### المكونات الرئيسية:
```tsx
<BrowserRouter>  // يُمكّن التوجيه
  <Routes>  // يحتوي Route's
    <Route path="/events" element={<EventsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

### الـ Hooks:
```typescript
const navigate = useNavigate();          // التنقل برمجياً
const { userId } = useParams();          // معاملات URL
const location = useLocation();          // عنوان الصفحة الحالي
```

---

## 13. bcrypt — تشفير كلمات المرور

### لماذا لا نخزّن الـ passwords مباشرة؟
إذا سُرِّبت قاعدة البيانات → الكل يعرف كلمات مرور المستخدمين!

### bcrypt يحل المشكلة:
```typescript
const hash = await bcrypt.hash("123456", 12);
// التشفير (عند التسجيل):
// → "$2b$12$eImiTXuWVxfM37uY4JANjQ..."

// المقارنة (عند الدخول):
const isMatch = await bcrypt.compare("123456", hash);
// → true
```

`12` = قوة التشفير (كلما زادت = أبطأ = أصعب للاختراق).

---

## 14. combineResolvers

### ما هو؟
دالة من مكتبة `graphql-resolvers` تُسلسل محللات متعددة.

```typescript
import { combineResolvers, skip } from "graphql-resolvers";

// المحلل الحارس:
const isAuthenticated = (_parent, _args, context) => {
  if (!context.user) throw new GraphQLError("غير مصرح!");
  return skip;  // ← انتقل للتالي
};

// المحلل المحمي:
const protectedAction = combineResolvers(
  isAuthenticated,     // [1] يُفحص أولاً
  actualResolver       // [2] ينفّذ إذا نجح [1]
);
```

---

## 15. Docker و Docker Compose

### ما هو Docker؟
تقنية لتغليف التطبيق مع بيئة تشغيله داخل Image ثابتة وقابلة للنقل.

### الفرق بين Image و Container:

| المصطلح | الشرح |
|---------|-------|
| Image | قالب جاهز للتشغيل (immutable) |
| Container | نسخة تشغيل حية من Image |

### لماذا نستخدم Docker في هذا المشروع؟

- توحيد بيئة التشغيل بين المطور و CI
- تشغيل `client + server + mongo` بأمر واحد
- تسهيل مسار التسليم الأمني للصور

### ما هو Docker Compose؟

أداة لتعريف وتشغيل عدة خدمات في ملف YAML واحد:

```text
services:
  mongo
  server (depends on mongo)
  client (depends on server)
```

### healthcheck

يسمح للنظام بمعرفة أن الخدمة "جاهزة" وليس فقط "شغالة":

- `server`: endpoint `/health`
- `client`: endpoint `/health` من Nginx
- `mongo`: `db.adminCommand({ ping: 1 })`

### best practices مطبقة هنا

- multi-stage Dockerfiles
- runtime images خفيفة
- environment-driven ports
- smoke test مع cleanup إجباري
- security scan عبر Trivy
