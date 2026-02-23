# Repository Pattern - دليل سريع مرجعي

## الاستخدام السريع

### استيراد Repositories
```typescript
import { getRepositoryManager } from '../repositories';

const repos = getRepositoryManager();
```

---

## عمليات المستخدم (User)

```typescript
// البحث
await repos.user.findById("userId")
await repos.user.findByEmail("test@example.com")
await repos.user.findAll()

// الإنشاء
await repos.user.create({
  username: "أحمد",
  email: "ahmed@example.com",
  password: "hashed_password"
})

// التحديث
await repos.user.update("userId", { username: "محمد" })
await repos.user.updateProfile("userId", { username: "محمد", password: "newHash" })

// الحذف
await repos.user.delete("userId")

// التحقق
await repos.user.emailExists("test@example.com")
await repos.user.exists({ _id: "userId" })
await repos.user.count()
```

---

## عمليات المناسبات (Event)

```typescript
// البحث
await repos.event.findAll()
await repos.event.findById("eventId")
await repos.event.findAllWithCreator(skip, limit)        // مع بيانات المنشئ + pagination
await repos.event.findByCreator("userId")                 // مناسبات مستخدم محدد
await repos.event.search("مؤتمر", skip, limit)           // بحث في العنوان والوصف

// الإنشاء
await repos.event.create({
  title: "مؤتمر التقنية",
  description: "مؤتمر تقني سنوي",
  price: 150,
  date: new Date("2024-06-15"),
  creator: "userId"
})

// التحديث
await repos.event.update("eventId", { price: 200 })
await repos.event.updateWithCreator("eventId", "userId", { price: 200 })  // تحقق من الملكية

// الحذف
await repos.event.delete("eventId")

// التحقق
await repos.event.titleExists("مؤتمر التقنية")                    // هل العنوان مستخدم؟
await repos.event.titleExists("مؤتمر التقنية", "excludeId")       // مع استثناء مناسبة
await repos.event.getEventIdsByCreator("userId")                    // معرّفات مناسبات المستخدم
await repos.event.count()
```

---

## عمليات الحجوزات (Booking)

```typescript
// البحث
await repos.booking.findAll()
await repos.booking.findById("bookingId")
await repos.booking.findByUser("userId")                              // حجوزات المستخدم
await repos.booking.findByIdWithDetails("bookingId")                  // مع تفاصيل المناسبة
await repos.booking.findByIdFullyPopulated("bookingId")               // مع جميع العلاقات

// الإنشاء
await repos.booking.createAndPopulate({
  user: "userId",
  event: "eventId"
})

// الحذف
await repos.booking.delete("bookingId")                               // حذف حجز واحد
await repos.booking.deleteByEvent("eventId")                          // حذف كل حجوزات مناسبة
await repos.booking.deleteByUserCascade("userId")                     // حذف كل حجوزات مستخدم

// التحقق
await repos.booking.userHasBooked("userId", "eventId")                // هل حجز المستخدم؟
await repos.booking.countByEvent("eventId")                           // عدد حجوزات مناسبة
await repos.booking.count()
```

---

## التحقق من صحة السيرفر (Health Check)

```typescript
const health = await repos.healthCheck();
// { status: "healthy", repositories: ["user", "event", "booking"] }
```

---

## الأنماط الشائعة

### نمط: التحقق ثم الإنشاء
```typescript
// 1. تحقق من عدم التكرار
if (await repos.user.emailExists(email)) {
  throw new GraphQLError("البريد مسجل مسبقاً");
}

// 2. أنشئ
const user = await repos.user.create({ username, email, password });
```

### نمط: الحذف المتسلسل (Cascade Delete)
```typescript
// حذف مستخدم مع جميع بياناته
const eventIds = await repos.event.getEventIdsByCreator(userId);

for (const eventId of eventIds) {
  await repos.booking.deleteByEvent(eventId);  // حذف حجوزات المناسبة
}

await repos.booking.deleteByUserCascade(userId);  // حذف حجوزات المستخدم نفسه
await repos.event.deleteWhere({ creator: userId });  // حذف مناسبات المستخدم
await repos.user.delete(userId);  // حذف المستخدم
```

### نمط: تحديث مع تحقق من الملكية
```typescript
const updated = await repos.event.updateWithCreator(eventId, userId, {
  title: newTitle,
  price: newPrice,
});

if (!updated) {
  throw new GraphQLError("المناسبة غير موجودة أو لا تملك صلاحية التعديل");
}
```
