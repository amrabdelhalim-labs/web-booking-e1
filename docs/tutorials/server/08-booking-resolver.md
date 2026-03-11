# الدرس الثامن: محلّل الحجوزات 🎫

> **هدف الدرس:** فهم كيف تعمل عمليات الحجز وإلغائه مع حماية البيانات

---

## 1. ما الذي يفعله هذا الملف؟

`resolvers/booking.ts` يُنفّذ:
- **عرض** الحجوزات للمستخدم المسجّل
- **حجز** مناسبة (مع منع الحجز المكرر)
- **إلغاء** حجز (المالك فقط)
- **بث فوري** عند إضافة حجز جديد

---

## 2. Query: `bookings` — حجوزات المستخدم

```typescript
bookings: combineResolvers(
  isAuthenticated,
  async (_parent, _args, context) => {
    const repos = getRepositoryManager();
    const bookings = await repos.booking.findByUser(
      context.user!._id.toString()
    );
    return bookings.map((booking) => transformBooking(booking));
  }
),
```

**لاحظ:** هذا الـ Query **تلقائياً خاص** لأنه يستخدم `isAuthenticated`.  
المستخدم يرى **حجوزاته هو فقط** — يُستخرج ID من `context.user`.

---

## 3. `transformBooking` — تحويل التواريخ

```typescript
export const transformBooking = (booking: IBooking) => ({
// من resolvers/transform.ts
  ...booking._doc,
  createdAt: booking.createdAt.toDateString(),
  updatedAt: booking.updatedAt.toDateString(),
});
```

MongoDB يُرجع:
```text
createdAt: 2024-01-15T18:30:00.000Z  (ISO format)
```

بعد التحويل:
```text
createdAt: "Mon Jan 15 2024"  (نص مقروء)
```

---

## 4. Mutation: `bookEvent` — حجز مناسبة

```typescript
bookEvent: combineResolvers(
  isAuthenticated,
  async (_parent, { eventId }, context) => {
    const repos = getRepositoryManager();
    const userId = context.user!._id.toString();

    // [1] هل حجز هذه المناسبة من قبل؟
    const alreadyBooked = await repos.booking.userHasBooked(userId, eventId);
    if (alreadyBooked) {
      throw new GraphQLError("قد حجزت هذه المناسبة بالفعل مسبقًا!", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // [2] هل المناسبة موجودة؟
    const fetchedEvent = await repos.event.findById(eventId);
    if (!fetchedEvent) {
      throw new GraphQLError("المناسبة غير موجودة!", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // [3] إنشاء الحجز مع بيانات الحدث والمستخدم
    const populatedBooking = await repos.booking.createAndPopulate(
      userId,
      fetchedEvent._id.toString()
    );
    const transformedBooking = transformBooking(populatedBooking);

    // [4] بث فوري للمشتركين
    pubsub.publish("BOOKING_ADDED", { bookingAdded: transformedBooking });

    return transformedBooking;
  }
),
```

### الخطوات بالتفصيل:

```text
[4] pubsub.publish  // إبلاغ المشتركين فوراً
    ↓
[1] هل سبق وحجزت؟  ← repos.booking.userHasBooked(userId, eventId)
  // نعم → خطأ "حجزت مسبقاً"
  // لا  → تابع
    ↓
[2] هل المناسبة موجودة؟ ← repos.event.findById(eventId)
  // لا  → خطأ "غير موجودة"
  // نعم → تابع
    ↓
[3] إنشاء الحجز + احضار بيانات الحدث والمستخدم
    ↓
المستخدم يضغط "احجز":
    ↓
[5] إرجاع الحجز للعميل
```

---

## 5. Mutation: `cancelBooking` — إلغاء حجز

```typescript
cancelBooking: combineResolvers(
  isAuthenticated,
  async (_parent, { bookingId }, context) => {
    const repos = getRepositoryManager();

    // [1] هل الحجز موجود؟
    const booking = await repos.booking.findByIdWithDetails(bookingId);
    if (!booking) {
      throw new GraphQLError("الحجز غير موجود!", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // [2] هل هو مالك الحجز؟
    if (booking.user.toString() !== context.user!._id.toString()) {
      throw new GraphQLError("غير مصرح لك بإلغاء هذا الحجز!", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    // [3] احفظ بيانات المناسبة قبل الحذف
    const event = transformEvent(booking.event as any);

    // [4] احذف الحجز
    await repos.booking.delete(bookingId);

    // [5] أرجع المناسبة (مفيد لتحديث الواجهة)
    return event;
  }
),
```

**لماذا نُرجع الـ Event وليس الـ Booking المحذوف؟**  
الحجز اختفى! لكن المناسبة لا تزال موجودة.  
نُرجع المناسبة حتى تتمكن الواجهة من عرضها مجدداً أو تحديث حالتها.

---

## 6. Subscription: `bookingAdded`

```typescript
Subscription: {
  bookingAdded: {
    subscribe: () => pubsub.asyncIterator(["BOOKING_ADDED"]),
  },
},
```

يُستخدم لإعلام لوحات الإدارة أو الواجهات الفورية عند وجود حجز جديد.

---

## 7. رموز الأخطاء في هذا الملف

| الكود | السبب |
|-------|-------|
| `UNAUTHENTICATED` | غير مسجّل (من `isAuthenticated`) |
| `BAD_USER_INPUT` | حجز مكرر |
| `NOT_FOUND` | المناسبة أو الحجز غير موجود |
| `FORBIDDEN` | يحاول إلغاء حجز ليس له |

---

## 8. خلاصة تدفق الحجز

```text
isAuthenticated تتحقق من context.user
    ↓
العميل → mutation bookEvent(eventId)
    ↓
userHasBooked: هل حجزت من قبل؟
    ↓
findById: هل المناسبة موجودة؟
    ↓
createAndPopulate: إنشاء الحجز مع البيانات الكاملة
    ↓
pubsub.publish("BOOKING_ADDED", ...)
    ↓
العميل يستقبل بيانات الحجز ✓
المشتركون (subscription) يستقبلون إشعاراً ✓
```
