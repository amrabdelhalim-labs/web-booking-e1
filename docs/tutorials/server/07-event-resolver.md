# الدرس السابع: محلّل المناسبات — CRUD + Real-time 🎪

> **هدف الدرس:** فهم عمليات المناسبات الكاملة بما فيها البث الفوري

---

## 1. ما الذي يفعله هذا الملف؟

`resolvers/event.ts` ينفّذ كل عمليات المناسبات:
- **قراءة:** عرض المناسبات بالبحث والصفحات
- **إنشاء:** إضافة مناسبة جديدة + إرسال تحديث فوري
- **تعديل:** تغيير بيانات مناسبة
- **حذف:** حذف المناسبة وكل حجوزاتها تلقائياً

---

## 2. `transformEvent` — تحويل البيانات قبل الإرسال

```typescript
// من resolvers/transform.ts
export const transformEvent = (event: IEvent) => ({
  ...event._doc,
  date: new Date(event.date).toISOString().replace(/T/, " "),
});
```

### لماذا نحتاج هذا التحويل؟

MongoDB تحفظ التاريخ كـ:
```
Date object: Mon Jan 15 2024 18:30:00 GMT+0300
```

لكن واجهة المستخدم تريده كـ:
```
String: "2024-01-15 18:30:00"
```

**`...event._doc`** → انتشر كل حقول المناسبة من MongoDB  
**`date: new Date(...).toISOString().replace(/T/, " ")`** → حوّل التاريخ لنص مقروء

---

## 3. Query: `events` — عرض المناسبات

```typescript
events: async (_parent, { searchTerm, skip = 0, limit = 8 }) => {
  const repos = getRepositoryManager();

  // بناء شرط البحث (اختياري)
  const filter = searchTerm
    ? {
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      }
    : {};

  const result = await repos.event.findPaginated({
    filter,
    skip,
    limit,
    populate: "creator",
  });

  return result.rows.map((event) => transformEvent(event));
},
```

### فهم شرط البحث MongoDB:

```typescript
{
  $or: [                                    // ← "أو": بحث في أي منهما
    { title: { $regex: "حفل", $options: "i" } },     // ← في العنوان
    { description: { $regex: "حفل", $options: "i" } }, // ← في الوصف
  ]
}
```

- `$regex` = بحث بنمط نصي (Regex)
- `$options: "i"` = غير حساس لحالة الأحرف (capital/small)
- `$or` = يكفي تطابق **أحدهما**

### مثال عملي للـ Pagination:

```
المستخدم في الصفحة 1: skip=0, limit=8 → المناسبات 1-8
المستخدم في الصفحة 2: skip=8, limit=8 → المناسبات 9-16
المستخدم في الصفحة 3: skip=16, limit=8 → المناسبات 17-24
```

---

## 4. Query: `getUserEvents` — مناسبات مستخدم محدد

```typescript
getUserEvents: async (_parent, { userId }) => {
  const repos = getRepositoryManager();
  const events = await repos.event.findByCreator(userId);
  return events.map((event) => transformEvent(event));
},
```

يُستخدم لعرض مناسبات شخص معين على صفحته العامة.

---

## 5. Mutation: `createEvent` — إضافة مناسبة + Real-time

```typescript
createEvent: combineResolvers(
  isAuthenticated,
  async (_parent, { eventInput }, context) => {
    validateCreateEventInput(eventInput);
    const repos = getRepositoryManager();

    // هل العنوان مكرر؟
    const titleTaken = await repos.event.exists({ title: eventInput.title });
    if (titleTaken) {
      throw new GraphQLError("يوجد لدينا مناسبة بنفس هذا العنوان!");
    }

    // إنشاء المناسبة
    const event = await repos.event.create({
      title: eventInput.title,
      description: eventInput.description,
      price: eventInput.price,
      date: new Date(eventInput.date),
      creator: context.user!._id,   // ← من المستخدم المسجّل
    });

    // احضر بيانات المنشئ
    const populatedResult = await event.populate("creator");
    const createdEvent = transformEvent(populatedResult);

    // 🔔 أرسل تحديث فوري لكل المشتركين!
    pubsub.publish("EVENT_ADDED", { eventAdded: createdEvent });

    return createdEvent;
  }
),
```

### `pubsub.publish` — البث الفوري:

```typescript
pubsub.publish("EVENT_ADDED", { eventAdded: createdEvent });
```

تخيّل `pubsub` كـ **محطة إذاعة**:
- `publish` = البث على موجة معينة
- كل عميل "يستمع" لهذه الموجة يستقبل التحديث فوراً!

```
[مستخدم ينشئ مناسبة]
       ↓
pubsub.publish("EVENT_ADDED", data)
       ↓
[كل المتصلين بـ subscription { eventAdded }]
يستقبلون البيانات فوراً دون إعادة تحميل!
```

---

## 6. Mutation: `updateEvent` — تعديل مناسبة

```typescript
updateEvent: combineResolvers(
  isAuthenticated,
  async (_parent, { eventId, eventInput }, context) => {
    validateUpdateEventInput(eventInput);
    const repos = getRepositoryManager();

    const event = await repos.event.findById(eventId);
    if (!event) throw new GraphQLError("المناسبة غير موجودة!");

    // هل هو المنشئ؟
    if (event.creator.toString() !== context.user!._id.toString()) {
      throw new GraphQLError("غير مصرح لك بتعديل هذه المناسبة!");
    }

    // بناء كائن التحديث (فقط الحقول المُرسلة)
    const updates: Record<string, unknown> = {};
    if (eventInput.title !== undefined) updates.title = eventInput.title;
    if (eventInput.description !== undefined) updates.description = eventInput.description;
    if (eventInput.price !== undefined) updates.price = eventInput.price;
    if (eventInput.date !== undefined) updates.date = new Date(eventInput.date);

    const updated = await repos.event.updateWithCreator(eventId, updates);
    return transformEvent(updated!);
  }
),
```

**لماذا نتحقق من `event.creator !== context.user._id`؟**  
لأن أي مستخدم مسجّل يمكنه **محاولة** إرسال طلب تعديل، لكن فقط المنشئ يجب أن ينجح.

---

## 7. Mutation: `deleteEvent` — حذف تتالي (Cascade Delete)

```typescript
deleteEvent: combineResolvers(
  isAuthenticated,
  async (_parent, { eventId }, context) => {
    const repos = getRepositoryManager();
    const event = await repos.event.findById(eventId);

    if (!event) throw new GraphQLError("المناسبة غير موجودة!");

    if (event.creator.toString() !== context.user!._id.toString()) {
      throw new GraphQLError("غير مصرح لك بحذف هذه المناسبة!");
    }

    // [1] احذف أولاً كل الحجوزات المرتبطة بهذه المناسبة
    await repos.booking.deleteByEvent(eventId);

    // [2] احذف المناسبة
    await repos.event.delete(eventId);

    // [3] أرجع القائمة المحدّثة
    const events = await repos.event.findAllWithCreator();
    return events.map((e) => transformEvent(e));
  }
),
```

**لماذا Cascade Delete؟**  
بدون حذف الحجوزات أولاً → ستبقى حجوزات "يتيمة" في قاعدة البيانات تشير لمناسبة غير موجودة! 💥

---

## 8. Subscription: `eventAdded` — الاشتراك للتحديثات الفورية

```typescript
Subscription: {
  eventAdded: {
    subscribe: () => pubsub.asyncIterator(["EVENT_ADDED"]),
  },
},
```

**كيف يستخدمه العميل؟**
```graphql
subscription {
  eventAdded {
    _id
    title
    price
  }
}
```

العميل يفتح اتصال WebSocket دائم، وعندما يُنشئ أي مستخدم مناسبة → يصل للعميل فوراً!

---

## 9. ملخص عمليات المناسبات

```
Query.events          → قراءة عامة (مع بحث وصفحات)
Query.getUserEvents   → مناسبات مستخدم محدد
                     
Mutation.createEvent  → إنشاء + pubsub.publish (real-time)
Mutation.updateEvent  → تعديل (المنشئ فقط)
Mutation.deleteEvent  → حذف + حجوزاتها تلقائياً

Subscription.eventAdded → استقبال فوري عند الإضافة
```
