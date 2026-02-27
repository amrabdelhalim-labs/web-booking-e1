````markdown
# الدرس الثامن (عميل): صفحات التطبيق 📄

> **هدف الدرس:** فهم بناء الصفحات الرئيسية، استخدام Apollo Client في الصفحات، وأنماط الحالة (State) الشائعة

---

## 1. خريطة الصفحات

```
pages/
├── Events.tsx      → الصفحة الرئيسية — عرض + بحث + إنشاء مناسبة
├── Bookings.tsx    → حجوزاتي — عرض + إلغاء
├── SignUp.tsx       → إنشاء حساب جديد
├── UserEvents.tsx  → مناسبات مستخدم معين (أنا أو غيري)
└── NotFound.tsx    → صفحة 404
```

**ملاحظة:** `Login.tsx` مشروح في [درس 5](./05-login-page.md).

---

## 2. `Events.tsx` — الصفحة الرئيسية

### الميزات الكاملة

```
Events.tsx
├── بحث مؤجّل (debounced 300ms) → searchTerm → Apollo query variable
├── تحميل تدريجي (Load More) → fetchMore (pagination)
├── إنشاء مناسبة (للمسجّلين) → Modal + useMutation(CREATE_EVENT)
├── تفاصيل مناسبة + حجز → Modal + useMutation(BOOK_EVENT)
└── اشتراك فوري → useSubscription(EVENT_ADDED)
```

### البحث المؤجّل (Debounced Search)

```tsx
const [searchInput, setSearchInput] = useState('');
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setSearchTerm(searchInput), 300);
  return () => clearTimeout(timer);  // ← يلغي المؤقت عند كل حرف جديد
}, [searchInput]);
```

**لماذا مؤقتان؟**
- `searchInput` → يُحدَّث عند كل نقرة مفتاح (لـ UI فوري)
- `searchTerm` → يُحدَّث بعد 300ms فقط (لـ API call مخفَّف)

هكذا لا يُرسل Apollo استعلاماً عند كل حرف — فقط عندما يتوقف المستخدم عن الكتابة.

### التحميل التدريجي (Load More / Pagination)

```tsx
const PAGE_SIZE = 8;

// الاستعلام الأساسي: أول صفحة
const { loading, data, fetchMore } = useQuery(EVENTS, {
  variables: { searchTerm, skip: 0, limit: PAGE_SIZE },
});

// عند الضغط على "تحميل المزيد"
const handleLoadMore = useCallback(() => {
  const currentCount = data.events.length;
  fetchMore({
    variables: {
      skip: currentCount,    // ← تخطى ما تحمّلناه
      limit: PAGE_SIZE,      // ← اجلب 8 أكثر
    },
    updateQuery: (prev, { fetchMoreResult }) => {
      if (!fetchMoreResult) return prev;
      return {
        events: [...prev.events, ...fetchMoreResult.events],  // ← ادمج
      };
    },
  });
}, [data, loading]);
```

> `fetchMore` هو دالة من Apollo تُجري استعلاماً إضافياً وتُحدّث الـ cache

### اشتراك الوقت الفعلي

```tsx
useSubscription(EVENT_ADDED, {
  onData: ({ client, data: subData }) => {
    const addedEvent = subData.data?.eventAdded as EventData;
    if (addedEvent.creator._id !== userId) {
      // لا تُحدِّث إذا كنت صاحب المناسبة (أنت من أضفتها)
      client.refetchQueries({ include: ['Events'] });
      setAlert(`مناسبة جديدة: ${addedEvent.title}`);
    }
  },
});
```

**التدفق الكامل:**
```
مستخدم آخر أنشأ مناسبة
      │
      ▼
Server يُرسل eventAdded عبر WebSocket
      │
      ▼
useSubscription يستقبل الحدث
      │
      ▼
refetchQueries(['Events']) → Apollo يُعيد تحميل القائمة
      │
      ▼
setAlert("مناسبة جديدة...") → يظهر للمستخدم
```

### إدارة حالة الإنشاء والتفاصيل

```tsx
// حالتان للـ modals:
const [creating, setCreating] = useState(false);           // modal الإنشاء
const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null); // modal التفاصيل

// حالة النموذج:
const [title, setTitle] = useState('');
const [price, setPrice] = useState('');
const [date, setDate] = useState('');
const [description, setDescription] = useState('');
```

---

## 3. `Bookings.tsx` — حجوزاتي

### هيكل بسيط

```tsx
export default function BookingsPage() {
  const [alert, setAlert] = useState('');

  const { loading, error, data, refetch } = useQuery(BOOKINGS);

  const [cancelBooking] = useMutation(CANCEL_BOOKING, {
    onError: (err) => setAlert(err.message),
    onCompleted: () => setAlert('تم إلغاء حجزك بنجاح'),
    refetchQueries: ['Bookings'],  // ← تحديث القائمة بعد الإلغاء
  });

  // Refetch عند دخول الصفحة (لضمان تحديث البيانات دائماً)
  useEffect(() => {
    refetch();
  }, [refetch]);
  //...
}
```

### اشتراك الحجوزات الجديدة

```tsx
useSubscription(BOOKING_ADDED, {
  onData: ({ client }) => {
    client.refetchQueries({ include: ['Bookings'] });
  },
});
```

> هذا يتيح رؤية حجوزات جديدة من أجهزة أخرى مسجَّل بها نفس الحساب

### تفويض إلغاء الحجز للـ `BookingItem`

```tsx
// الصفحة تمرر callback، المكوّن لا يحتاج Apollo مباشرة
{data.bookings.map((booking: BookingData) => (
  <BookingItem
    key={booking._id}
    {...booking}
    onCancelBooking={() => cancelBooking({
      variables: { bookingId: booking._id }
    })}
  />
))}
```

> **نمط التصميم:** الصفحة تدير المنطق، المكوّن يعرض فقط — فصل المسؤوليات

---

## 4. `SignUp.tsx` — إنشاء حساب جديد

### التشابه مع صفحة Login

كلتا الصفحتين تتبعان نفس النمط:

```
useMutation → onError → setAlert
           → useEffect على data → login() → navigate('/events')
```

### الفرق الجوهري

```tsx
// Login يستخدم: LOGIN mutation
// SignUp يستخدم: CREATE_USER mutation

const [signup, { loading, data }] = useMutation(CREATE_USER, {
  onError: (error) => setAlert(error.message),
});

// بعد النجاح — نفس خطوات Login
useEffect(() => {
  if (!loading && data) {
    const { token, userId, username } = data.createUser;
    login(token, userId, username);
    navigate('/events', { replace: true });
  }
}, [data, loading, login, navigate]);
```

### التحقق من جهة العميل

```tsx
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  setAlert('');

  if (username.trim().length < 3) {
    setAlert('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    return;
  }
  if (password.trim().length < 6) {
    setAlert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return;
  }

  signup({ variables: { username, email, password } });
};
```

> **طبقتا تحقق:** العميل يتحقق أولاً (تجربة مستخدم أفضل)، ثم الخادم يتحقق ثانياً (أمان) — كلاهما ضروري

---

## 5. `UserEvents.tsx` — مناسبات مستخدم

### الصفحة المزدوجة

`UserEvents.tsx` تخدم مسارين:

```tsx
// في App.tsx:
<Route path="/my-events" element={<UserEventsPage />} />          // ← مناسباتي
<Route path="/events/user/:userId" element={<UserEventsPage />} /> // ← مناسبات مستخدم آخر
```

### منطق التمييز

```tsx
const { token, userId: currentUserId } = useAuth();
const { userId: paramUserId } = useParams<{ userId: string }>();

const targetUserId = paramUserId || currentUserId;   // من URL أو من السياق
const isOwnEvents = !!token && targetUserId === currentUserId; // هل هي مناسباتي؟
```

**نتيجة `isOwnEvents`:**

| المسار | `paramUserId` | `isOwnEvents` | ما يظهر |
|--------|--------------|--------------|---------|
| `/my-events` | `undefined` | `true` (إذا مسجّل) | أزرار تعديل وحذف |
| `/events/user/abc` (أنا) | `abc` == `currentUserId` | `true` | أزرار تعديل وحذف |
| `/events/user/abc` (غيري) | `abc` != `currentUserId` | `false` | زر حجز فقط |

### حالة تأكيد الحذف الداخلي

```tsx
const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

// عند الضغط على "حذف":
setDeletingEventId(event._id);   // ← يُظهر رسالة تأكيد لهذه المناسبة فقط

// في JSX:
{deletingEventId === event._id ? (
  <>
    <span>هل أنت متأكد؟</span>
    <button onClick={() => handleDelete(event._id)}>نعم</button>
    <button onClick={() => setDeletingEventId(null)}>لا</button>
  </>
) : (
  <button onClick={() => setDeletingEventId(event._id)}>حذف</button>
)}
```

### تحضير نموذج التعديل

```tsx
const startEditing = useCallback((event: EventData) => {
  setEditingEvent(event);
  setEditTitle(event.title);
  setEditPrice(String(event.price));
  // تحويل التاريخ لصيغة datetime-local
  setEditDate(formatDateForInput(event.date));  // "2024-06-15T18:30"
  setEditDescription(event.description);
  setModalAlert('');
}, []);
```

> `formatDateForInput` يُحوّل `"2024-06-15 18:30:00.000Z"` إلى `"2024-06-15T18:30:00"` — الصيغة التي يقبلها `<input type="datetime-local">`

---

## 6. `NotFound.tsx` — صفحة 404

### بسيط وفعّال

```tsx
export default function NotFoundPage() {
  return (
    <div className="page-container">
      {/* رقم الخطأ الكبير */}
      <div style={{ fontSize: '5rem', color: '#e74c3c' }}>
        404
      </div>
      <h1>الصفحة غير موجودة</h1>
      <p>عذراً، الصفحة التي تبحث عنها غير موجودة أو قد تم حذفها.</p>

      {/* خيارات التنقل */}
      <Link to="/events">الصفحة الرئيسية</Link>
      <Link to="/login">تسجيل الدخول</Link>
    </div>
  );
}
```

### ربطها بـ Router

```tsx
// في App.tsx:
<Route path="*" element={<NotFoundPage />} />
// ← `path="*"` يمسك أي مسار غير معروف
```

---

## 7. أنماط مشتركة في جميع الصفحات

### نمط الخطأ/التحميل/البيانات

```tsx
if (loading) return <Spinner />;
// ↑ لا تُظهر شيئاً حتى تنتهي الجلسة — UX أنظف

if (error) return <Alert message={error.message} variant="danger" />;
// ↑ خطأ شبكة أو GraphQL

// بعدها: data مضمونة موجودة
return <div>{data.events.map(...)}</div>;
```

### نمط رسائل النجاح والخطأ

```tsx
const [alert, setAlert] = useState('');

// عند الخطأ:
onError: (err) => setAlert(err.message)

// عند النجاح:
onCompleted: () => setAlert('تم... بنجاح')

// في JSX:
<Alert message={alert} variant="success" />
// ← مكوّن Alert يُخفي نفسه إذا كان message فارغاً
```

### نمط `refetchQueries`

```tsx
const [doMutation] = useMutation(SOME_MUTATION, {
  refetchQueries: ['QueryName'],  // ← أعد جلب هذا الاستعلام بعد نجاح الـ mutation
});
```

> بديل: `onCompleted: () => refetch()` — استخدم `refetchQueries` عندما تريد تحديث query في صفحة أخرى

---

## 8. خلاصة

| الصفحة | الميزة الرئيسية | الأدوات المستخدمة |
|--------|----------------|------------------|
| `Events` | بحث + تصفح + إنشاء + اشتراك | useQuery + fetchMore + useSubscription + useMutation |
| `Bookings` | عرض + إلغاء + تحديث فوري | useQuery + useMutation + useSubscription |
| `SignUp` | تسجيل + دخول تلقائي | useMutation + useContext + useNavigate |
| `UserEvents` | عرض + تعديل + حذف (لصاحبها) | useQuery + useMutation × 3 + useParams |
| `NotFound` | راحة بال 404 | React Router `path="*"` |
````
