# الدرس السادس: نمط المستودع (Repository Pattern) 📦

> **هدف الدرس:** فهم لماذا نفصل منطق الوصول للبيانات في طبقة مستقلة

---

## 1. المشكلة التي يحلّها هذا النمط

عندما نضع منطق قاعدة البيانات مباشرةً في كل مكان:
```typescript
const event = await Event.findOne({ title });         // Mongoose مباشرة
// منطق مختلط في Resolver — غير مناسب!
const events = await Event.find({ creator: userId }); // Mongoose مباشرة
```

**المشكلة:** منطق قاعدة البيانات منتشر في كل مكان!  
إذا قررنا تغيير قاعدة البيانات يوماً، نحتاج لتعديل **كل** الـ Resolvers!

---

## 2. الحل: Repository Pattern

```text
Resolver → Repository → Database
     ↑           ↑
  لا يعرف    يعرف فقط
  كيف تعمل   كيف يتحدث
  قاعدة       مع قاعدة
  البيانات    البيانات
```

فائدة عظيمة: إذا غيّرنا قاعدة البيانات، نغيّر **Repository فقط**، والـ Resolvers لا تتأثر!

---

## 3. واجهة المستودع (IRepository Interface)

```typescript
interface IRepository<T extends Document> {
// من repositories/repository.interface.ts
  findAll(): Promise<T[]>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  findPaginated(options: PaginationOptions<T>): Promise<PaginatedResult<T>>;

  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  updateWhere(filter: FilterQuery<T>, data: Partial<T>): Promise<T | null>;

  delete(id: string): Promise<boolean>;
  deleteWhere(filter: FilterQuery<T>): Promise<boolean>;

  exists(filter: FilterQuery<T>): Promise<boolean>;
  count(filter?: FilterQuery<T>): Promise<number>;
}
```

**ما هي `Interface` في TypeScript؟**

Interface = **عقد** يقول: "أي class يريد أن يكون Repository يجب أن ينفّذ هذه الدوال."

مثال: تعاقدتَ مع مطعم. العقد يقول: يجب تقديم وجبة خلال 30 دقيقة، والدفع بعد التسليم.  
كيف يطبخون؟ شأنهم! المهم يلتزمون بالعقد.

---

## 4. شرح كل دالة في الـ Interface

### دوال القراءة:

| الدالة | ماذا تفعل | مثال |
|--------|-----------|-------|
| `findAll()` | كل البيانات بلا فلتر | كل المستخدمين |
| `findOne(filter)` | بيانات واحدة بشرط | ابحث بالبريد |
| `findById(id)` | بيانة واحدة بالـ ID | مستخدم معين |
| `findPaginated(options)` | نتائج مقسّمة لصفحات | المناسبات (8 في كل مرة) |

### دوال الإنشاء والتعديل:

| الدالة | ماذا تفعل |
|--------|-----------|
| `create(data)` | إنشاء بيانة جديدة |
| `update(id, data)` | تعديل بيانة بمعرّفها |
| `updateWhere(filter, data)` | تعديل بيانة بشرط |

### دوال الحذف:

| الدالة | ماذا تفعل |
|--------|-----------|
| `delete(id)` | حذف بيانة بمعرّفها |
| `deleteWhere(filter)` | حذف بشرط |

### دوال المساعدة:

| الدالة | ماذا تفعل |
|--------|-----------|
| `exists(filter)` | هل توجد بيانة؟ (true/false) |
| `count(filter?)` | عدّ البيانات |

---

## 5. `findPaginated` — الصفحات

```typescript
findPaginated(options: {
  filter?: FilterQuery<T>;  // شرط التصفية
  skip?: number;            // كم سجل نتخطى
  limit?: number;           // كم سجل نأخذ
  populate?: string | string[];  // احضر البيانات المرتبطة
}): Promise<{
  rows: T[];         // النتائج
  count: number;     // إجمالي النتائج
  page: number;      // الصفحة الحالية
  totalPages: number; // إجمالي الصفحات
}>
```

**مثال:** صفحة المناسبات (8 في الصفحة):
```typescript
findPaginated({ skip: 0, limit: 8 })
// الصفحة الأولى
// → rows: [1..8], count: 50, page: 1, totalPages: 7

// الصفحة الثانية
findPaginated({ skip: 8, limit: 8 })
// → rows: [9..16], count: 50, page: 2, totalPages: 7
```

---

## 6. `getRepositoryManager()` — مدير المستودعات

```typescript
const repos = getRepositoryManager();
// من repositories/index.ts

// الآن يمكننا استخدام:
repos.user.findByEmail("x@x.com");
repos.event.findById("abc123");
repos.booking.createAndPopulate(userId, eventId);
```

**`getRepositoryManager()`** = مصنع يُرجع لك كل المستودعات جاهزة.

```text
getRepositoryManager()
    ├── repos.user    ← UserRepository
    ├── repos.event   ← EventRepository
    └── repos.booking ← BookingRepository
```

---

## 7. مثال عملي من الكود

```typescript
const repos = getRepositoryManager();
// في resolvers/auth.ts — الـ Resolver لا يعرف MongoDB!

// بسيط وقابل للقراءة:
const user = await repos.user.findByEmail(email);
const emailTaken = await repos.user.emailExists(userInput.email);
const newUser = await repos.user.create({ username, email, password });

// لو قررنا يوماً تغيير MongoDB إلى PostgreSQL:
// - الـ Resolver لا يتغير
// - فقط UserRepository تتغير
```

---

## 8. خلاصة

```text
الـ Interface = عقد يحدد "ماذا" بدون "كيف"
الـ Repository = تنفيذ يحدد "كيف" يتم الوصول للبيانات
الـ Resolver   = يستخدم الـ Repository بدون معرفة التفاصيل

النتيجة:
├── كود نظيف
├── قابلية للتوسع
├── سهولة الاختبار
└── تغيير قاعدة البيانات بتغيير Repository فقط
```
