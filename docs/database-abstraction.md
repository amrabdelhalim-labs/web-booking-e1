# معمارية Repository Pattern والتجريد في قاعدة البيانات

## 📚 المحتويات

1. [ما هو Repository Pattern؟](#ما-هو-repository-pattern)
2. [لماذا نستخدمه؟](#لماذا-نستخدمه)
3. [البنية المعمارية](#البنية-المعمارية)
4. [الطبقات الثلاث](#الطبقات-الثلاث)
5. [أمثلة عملية](#أمثلة-عملية)
6. [أفضل الممارسات](#أفضل-الممارسات)

---

## ما هو Repository Pattern؟

**Repository Pattern** هو نمط معماري يستخدم لفصل منطق الوصول إلى البيانات عن منطق العمل (Business Logic).

### المقارنة - بدون Repository Pattern:

```typescript
// ❌ السيء - كود مخلوط وصعب الصيانة
import User from '../models/user';
import Event from '../models/event';

const resolver = {
  createEvent: async (_: any, { eventInput }: any, context: any) => {
    // منطق الوصول للبيانات مخلوط مع منطق العمل!
    const event = new Event({
      title: eventInput.title,
      description: eventInput.description,
      price: +eventInput.price,
      date: new Date(eventInput.date),
      creator: context.userId,
    });
    const result = await event.save();
    const creator = await User.findById(context.userId);
    // ...
  }
};
```

### مع Repository Pattern:

```typescript
// ✅ الجيد - فصل الاهتمامات (Separation of Concerns)
import { getRepositoryManager } from '../repositories';

const resolver = {
  createEvent: async (_: any, { eventInput }: any, context: any) => {
    const repos = getRepositoryManager();
    
    // استدعاء repository بسيط وواضح
    const event = await repos.event.create({
      ...eventInput,
      price: +eventInput.price,
      date: new Date(eventInput.date),
      creator: context.userId,
    });
    
    return transformEvent(event);
  }
};
```

---

## لماذا نستخدمه؟

| الميزة | بدون Repository | مع Repository |
|--------|-----------------|---------------|
| **قابلية الصيانة** | تغيير DB يتطلب تعديل كل resolver | تغيير DB يتطلب تعديل Repository فقط |
| **قابلية الاختبار** | يجب محاكاة Mongoose مباشرة | يمكن محاكاة Repository بسهولة |
| **إعادة الاستخدام** | تكرار كود الاستعلامات | استعلام واحد يُستخدم في كل مكان |
| **وضوح الكود** | resolver مخلوط بتفاصيل DB | resolver يركز على منطق العمل |
| **فصل الاهتمامات** | طبقة واحدة للكل | طبقات واضحة ومنظمة |

---

## البنية المعمارية

```
┌─────────────────────────────────────────────────────┐
│                GraphQL Resolvers                     │
│        (auth.ts, event.ts, booking.ts)               │
│                                                      │
│  • يتعامل مع طلبات GraphQL                          │
│  • يستدعي Repositories و Validators                 │
│  • يحول البيانات للعميل (transform)                  │
└───────────────────────┬─────────────────────────────┘
                        │ يستدعي
                        ▼
┌─────────────────────────────────────────────────────┐
│              Repository Manager                      │
│            (repositories/index.ts)                   │
│                                                      │
│  • نقطة وصول موحدة (Singleton)                       │
│  • repos.user / repos.event / repos.booking          │
│  • healthCheck() للتحقق من الاتصال                   │
└───────────────────────┬─────────────────────────────┘
                        │ يديرها
                        ▼
┌─────────────────────────────────────────────────────┐
│              Base Repository                         │
│         (repositories/base.repository.ts)            │
│                                                      │
│  • CRUD عام: findAll, findById, create, update...    │
│  • pagination: safePage, safeLimit (max 50)           │
│  • يعمل مع أي Mongoose Model                        │
└───────────────────────┬─────────────────────────────┘
                        │ يمتد
                        ▼
┌─────────────────────────────────────────────────────┐
│           Specialized Repositories                   │
│  UserRepository  EventRepository  BookingRepository  │
│                                                      │
│  • عمليات خاصة بكل نموذج                             │
│  • findByEmail, search, userHasBooked...             │
│  • Singleton pattern للكفاءة                          │
└─────────────────────────────────────────────────────┘
```

---

## الطبقات الثلاث

### 1. واجهة Repository (IRepository\<T\>)

```typescript
// repositories/repository.interface.ts
export interface IRepository<T> {
  findAll(filter?: object, sort?: object): Promise<T[]>;
  findOne(filter: object): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  findPaginated(filter: object, page: number, limit: number): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  exists(filter: object): Promise<boolean>;
  count(filter?: object): Promise<number>;
}
```

### 2. Repository أساسي (BaseRepository)

يوفر التنفيذ العام لجميع عمليات CRUD:

```typescript
// repositories/base.repository.ts
export class BaseRepository<T extends Document> implements IRepository<T> {
  constructor(private model: Model<T>) {}
  
  // تصفح آمن مع حدود
  protected safePage(page: number): number { return Math.max(1, page); }
  protected safeLimit(limit: number): number { return Math.min(Math.max(1, limit), 50); }
  
  async findAll(filter = {}, sort = { createdAt: -1 }): Promise<T[]> { ... }
  async findById(id: string): Promise<T | null> { ... }
  async create(data: Partial<T>): Promise<T> { ... }
  // ...
}
```

### 3. Repositories متخصصة

كل نموذج له repository خاص يضيف عمليات متخصصة:

```typescript
// repositories/user.repository.ts
export class UserRepository extends BaseRepository<IUser> {
  async findByEmail(email: string): Promise<IUser | null> { ... }
  async emailExists(email: string): Promise<boolean> { ... }
  async updateProfile(id: string, data: { username?: string; password?: string }): Promise<IUser | null> { ... }
}

// repositories/event.repository.ts
export class EventRepository extends BaseRepository<IEvent> {
  async findAllWithCreator(skip: number, limit: number): Promise<IEvent[]> { ... }
  async search(searchTerm: string, skip: number, limit: number): Promise<IEvent[]> { ... }
  async titleExists(title: string, excludeId?: string): Promise<boolean> { ... }
}

// repositories/booking.repository.ts
export class BookingRepository extends BaseRepository<IBooking> {
  async userHasBooked(userId: string, eventId: string): Promise<boolean> { ... }
  async createAndPopulate(data: Partial<IBooking>): Promise<IBooking> { ... }
  async deleteByUserCascade(userId: string): Promise<number> { ... }
}
```

---

## أمثلة عملية

### مثال: تسجيل مستخدم جديد

```typescript
// resolvers/auth.ts
const repos = getRepositoryManager();

// التحقق من صحة المدخلات
validateUserInput({ username, email, password });

// التحقق من عدم تكرار البريد
if (await repos.user.emailExists(email)) {
  throw new GraphQLError("البريد الإلكتروني مسجل مسبقاً");
}

// إنشاء المستخدم
const hashedPassword = await bcrypt.hash(password, 12);
const user = await repos.user.create({ username, email, password: hashedPassword });
```

### مثال: حجز مناسبة

```typescript
// resolvers/booking.ts
const repos = getRepositoryManager();

// التحقق من أن المناسبة ليست للمستخدم نفسه
const event = await repos.event.findById(eventId);
if (String(event.creator) === userId) {
  throw new GraphQLError("لا يمكنك حجز مناسبتك الخاصة");
}

// التحقق من عدم تكرار الحجز
if (await repos.booking.userHasBooked(userId, eventId)) {
  throw new GraphQLError("لقد قمت بحجز هذه المناسبة مسبقاً");
}

// إنشاء الحجز
const booking = await repos.booking.createAndPopulate({ user: userId, event: eventId });
```

---

## أفضل الممارسات

### ✅ استخدم RepositoryManager

```typescript
// ✅ صحيح - نقطة وصول واحدة
const repos = getRepositoryManager();
const user = await repos.user.findById(id);
const events = await repos.event.findByCreator(userId);
```

### ✅ استخدم الأساليب المتخصصة

```typescript
// ✅ صحيح - واضح ومقروء
await repos.user.emailExists("test@example.com");

// ❌ خاطئ - تكرار المنطق
const user = await repos.user.findOne({ email: "test@example.com" });
const exists = user !== null;
```

### ✅ تحقق من المدخلات قبل Repository

```typescript
// ✅ صحيح - الترتيب: validate → check → create
validateUserInput(input);
if (await repos.user.emailExists(input.email)) throw error;
const user = await repos.user.create(input);
```

### ✅ استخدم Pagination الآمن

```typescript
// BaseRepository يحمي تلقائياً:
// - الحد الأقصى: 50 عنصر لكل صفحة
// - الصفحة الأدنى: 1
const events = await repos.event.findPaginated({}, page, limit);
```
