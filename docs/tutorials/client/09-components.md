````markdown
# الدرس التاسع (عميل): المكوّنات والأنواع والأدوات المساعدة 🧩

> **هدف الدرس:** فهم المكوّنات القابلة للإعادة، الأنواع المشتركة، ودوال التنسيق

---

## 1. خريطة الملفات

```
client/src/
├── components/
│   ├── Alert.tsx          → رسائل التنبيه القابلة للصرف
│   ├── BookingItem.tsx    → بطاقة حجز واحد
│   ├── EventItem.tsx      → بطاقة مناسبة واحدة
│   ├── Navbar.tsx         → شريط التنقل المتجاوب
│   ├── PrivateRoute.tsx   → حارس المسارات المحمية (درس 6)
│   ├── ProfileEditor.tsx  → modal تعديل البيانات الشخصية
│   ├── SimpleModal.tsx    → modal عام قابل لإعادة الاستخدام
│   ├── Spinner.tsx        → مؤشر التحميل
│   └── UserDropdown.tsx   → قائمة المستخدم المنسدلة
├── hooks/
│   └── useAuth.ts         → خطاف المصادقة
├── utils/
│   └── formatDate.ts      → دوال تنسيق التاريخ
└── types.ts               → الأنواع المشتركة للعميل
```

---

## 2. `types.ts` — الأنواع المشتركة

### لماذا ملف أنواع مستقل؟

```typescript
// بدون types.ts — نكرر التعريف في كل ملف:
// في Events.tsx:
interface EventData { _id: string; title: string; ... }
// في EventItem.tsx:
interface EventData { _id: string; title: string; ... } // تكرار!

// مع types.ts — تعريف واحد، استيراد في كل مكان:
import type { EventData } from '../types';
```

### التعريفات المتاحة

```typescript
// معلومات منشئ المناسبة
export interface Creator {
  _id: string;
  username: string;
  email: string;
}

// بيانات مناسبة من GraphQL
export interface EventData {
  _id: string;
  title: string;
  description: string;
  price: number;
  date: string;     // ← نص (بعد التحويل في الخادم)
  creator: Creator;
}

// بيانات حجز من GraphQL
export interface BookingData {
  _id: string;
  createdAt: string;
  event: EventData;
  user: { username: string; email: string };
}
```

> **ملاحظة:** `date: string` وليس `Date` لأن GraphQL يُعيد النصوص دائماً — التحويل يحدث في الخادم بـ `transformEvent`

---

## 3. `hooks/useAuth.ts` — خطاف المصادقة

### الهيكل الكامل

```typescript
import { useContext } from 'react';
import AuthContext from '../context/auth-context';
import type { AuthContextType } from '../context/auth-context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### لماذا خطاف مخصص بدلاً من `useContext` مباشرة؟

```typescript
// بدون useAuth — في كل مكوّن:
import { useContext } from 'react';
import AuthContext from '../context/auth-context';
const context = useContext(AuthContext);
// ↑ 3 سطور + احتمال نسيان التحقق من null

// مع useAuth:
import { useAuth } from '../hooks/useAuth';
const { token, userId, username, login, logout } = useAuth();
// ↑ سطر واحد + تحقق تلقائي من null + تلميح أنواع كامل
```

### الاستخدام المنتشر

```tsx
// في Navbar، UserDropdown، EventItem، ProfileEditor، الصفحات...
const { token } = useAuth();                        // للتحقق من المصادقة
const { token, userId } = useAuth();               // لمعرفة الهوية
const { username, login, logout } = useAuth();     // للعمليات
```

---

## 4. `utils/formatDate.ts` — تنسيق التواريخ

### المشكلة

الخادم يُعيد التاريخ كنص: `"2024-06-15 18:30:00.000Z"`  
لكن كل موضع استخدام يحتاج صيغة مختلفة.

### الدوال الأربع

```typescript
// 1. عرض مختصر (YYYY/MM/DD) — في EventItem, BookingItem
formatDateShort("2024-06-15T10:00:00.000Z")
→ "2024/06/15"

// 2. عرض بالعربية — في BookingItem لتاريخ الحجز
formatDateArabic("2024-06-15T10:00:00.000Z")
→ "١٥/٦/٢٠٢٤"

// 3. للـ input[datetime-local] — في modal تعديل المناسبة
formatDateForInput("2024-06-15 18:30:00.000Z")
→ "2024-06-15T18:30:00"

// 4. عرض كامل بدون ملي ثانية — في Events, UserEvents
formatDateFull("2024-06-15T10:00:00.000Z")
→ "2024/06/15T10:00:00"
```

### الخوارزمية الداخلية

```typescript
// كلها تبدأ بتقسيم '.' لإزالة الملي ثانية:
dateStr.split('.')[0]
// "2024-06-15T10:00:00.000Z" → "2024-06-15T10:00:00"

// ثم تعالج بشكل مختلف:
.split('T')[0]          // يأخذ التاريخ فقط
.replace(/-/g, '/')     // يستبدل الشرطات
.replace(' ', 'T')      // يُعيد T للـ datetime-local input
```

---

## 5. `Alert.tsx` — مكوّن التنبيه

### التصميم المدروس

```tsx
interface AlertProps {
  message: string;
  variant?: 'warning' | 'danger' | 'success' | 'info';
}

export default function Alert({ message, variant = 'warning' }: AlertProps) {
  if (!message) return null;  // ← لا يُعرض إذا كان الرسالة فارغة
  return <BootstrapAlert variant={variant}>{message}</BootstrapAlert>;
}
```

**نمط الاستخدام في الصفحات:**

```tsx
const [alert, setAlert] = useState('');

// لا حاجة لـ if (alert) في JSX — المكوّن يُخفي نفسه:
<Alert message={alert} variant="success" />
<Alert message={alert} variant="danger" />
```

---

## 6. `EventItem.tsx` — بطاقة المناسبة

### الواجهة

```tsx
interface EventItemProps extends EventData {
  onDetail: (eventId: string) => void;  // ← callback لإظهار التفاصيل
}
```

> يمتد من `EventData` مباشرة — يرث كل الحقول ويُضيف `onDetail`

### التمييز بين المالك وغيره

```tsx
const { userId } = useAuth();
const isOwner = userId === creator._id;

<button className={`btn btn-detail ${isOwner ? 'btn-owned' : ''}`}>
  {isOwner ? 'مناسبتك' : 'التفاصيل'}
</button>
```

### رابط منشئ المناسبة

```tsx
<Link to={`/events/user/${creator._id}`} className="event-creator-link">
  {creator.username}
</Link>
// ← الضغط عليه يفتح UserEventsPage للمنشئ
```

---

## 7. `BookingItem.tsx` — بطاقة الحجز

### الفصل الواضح

```tsx
interface BookingItemProps {
  _id: string;
  event: EventData;
  createdAt: string;
  onCancelBooking: (bookingId: string) => void;  // ← من الصفحة
}
```

المكوّن لا يعرف شيئاً عن Apollo — فقط يعرض البيانات ويستدعي callback:

```tsx
<button onClick={() => onCancelBooking(_id)}>إلغاء</button>
// ↑ الصفحة هي من تُجري mutation الإلغاء
```

---

## 8. `Navbar.tsx` — شريط التنقل

### التكيّف مع الحالة

```tsx
const { token } = useAuth();

// للزوار (guest):
{!token && <NavLink to="/login">تسجيل دخول</NavLink>}

// للمسجّلين:
{token && <NavLink to="/bookings">حجوزاتي</NavLink>}
{token && <NavLink to="/my-events">مناسباتي</NavLink>}
{token && <UserDropdown />}
```

**الحالتان:**

| الحالة | ما يظهر |
|--------|---------|
| غير مسجّل | المناسبات + تسجيل دخول |
| مسجّل | المناسبات + حجوزاتي + مناسباتي + قائمة المستخدم |

---

## 9. `UserDropdown.tsx` — قائمة المستخدم

### CSS-only Hover

```tsx
// يتوسع عند hover بواسطة CSS فقط — بدون state للفتح/الإغلاق
<div className="user-dropdown">
  <span className="user-dropdown-toggle">{username}</span>
  <ul className="user-dropdown-menu">     {/* ← يظهر عند hover بـ CSS */}
    <li>
      <button onClick={() => setShowProfile(true)}>تعديل البيانات</button>
    </li>
    <li>
      <button onClick={logout}>تسجيل خروج</button>
    </li>
  </ul>
</div>

{showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
```

> **اختيار التصميم:** القائمة المنسدلة بـ CSS أسرع ولا تحتاج event listeners — `ProfileEditor` فقط يحتاج `useState`

---

## 10. `SimpleModal.tsx` — Modal القابل للإعادة

### الواجهة المرنة

```tsx
interface SimpleModalProps {
  title: string;
  children: ReactNode;        // ← أي محتوى
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: ReactNode;     // ← نص أو مكوّن
  confirmVariant?: string;    // ← 'primary' | 'danger' | ...
  isDisabled?: boolean;       // ← لمنع الضغط أثناء التحميل
  footerExtra?: ReactNode;    // ← عناصر إضافية في الـ footer
}
```

### أمثلة الاستخدام في المشروع

```tsx
// 1. إنشاء مناسبة:
<SimpleModal
  title="إضافة مناسبة"
  onConfirm={handleCreate}
  confirmText={createLoading ? 'جاري الإضافة...' : 'إضافة'}
  isDisabled={createLoading}
>
  {/* form fields */}
</SimpleModal>

// 2. تعديل مناسبة:
<SimpleModal
  title="تعديل المناسبة"
  confirmVariant="warning"
  footerExtra={<Button variant="danger">حذف</Button>}
>
  {/* edit form */}
</SimpleModal>

// 3. تفاصيل المناسبة + حجز:
<SimpleModal
  title={selectedEvent.title}
  confirmText="احجز الآن"
  confirmVariant="success"
>
  <p>{selectedEvent.description}</p>
</SimpleModal>
```

---

## 11. `ProfileEditor.tsx` — تعديل الملف الشخصي

### ثلاث عمليات في مكوّن واحد

```
ProfileEditor
├── تعديل اسم المستخدم + كلمة المرور → useMutation(UPDATE_USER)
├── حذف الحساب → useMutation(DELETE_USER) + تأكيد
└── مزامنة السياق بعد التحديث
```

### إعادة مزامنة السياق بعد التحديث

```tsx
const [updateUser] = useMutation(UPDATE_USER, {
  onCompleted: (data) => {
    const { username: updatedName } = data.updateUser;
    // ← اقرأ token وuserId من localStorage مباشرة
    const token = localStorage.getItem('token') ?? '';
    const userId = localStorage.getItem('userId') ?? '';
    // ← أعد تعيين السياق بالبيانات الجديدة
    login(token, userId, updatedName);
    setAlert('تم تحديث البيانات بنجاح');
  },
});
```

> **لماذا `login()` وليس setter مباشر؟**
> لأن `login()` يُحدّث الـ state وlocalStorage معاً — مصدر حقيقة واحد

### خطوة تأكيد الحذف

```tsx
const [confirmDelete, setConfirmDelete] = useState(false);

// في JSX:
{!confirmDelete ? (
  <Button variant="danger" onClick={() => setConfirmDelete(true)}>
    حذف الحساب
  </Button>
) : (
  <>
    <span>هل أنت متأكد؟ لا يمكن التراجع</span>
    <Button onClick={() => deleteUser()}>نعم، احذف</Button>
    <Button onClick={() => setConfirmDelete(false)}>إلغاء</Button>
  </>
)}
```

---

## 12. `Spinner.tsx` — مؤشر التحميل

```tsx
import { Puff } from 'react-loader-spinner';

export default function Spinner() {
  return (
    <div className="d-flex justify-content-center">
      <Puff color="#cc6600" height={100} width={100} />
    </div>
  );
}
```

> **نمط الاستخدام:** `if (loading) return <Spinner />;` في بداية كل صفحة

---

## 13. مبادئ التصميم المطبّقة

### 1. المسؤولية الواحدة (Single Responsibility)

| المكوّن | مسؤوليته الوحيدة |
|---------|----------------|
| `Alert` | عرض رسالة تنبيه |
| `Spinner` | إظهار حالة التحميل |
| `EventItem` | عرض بيانات مناسبة واحدة |
| `BookingItem` | عرض بيانات حجز واحد |
| `SimpleModal` | إطار modal قابل للتخصيص |

### 2. التركيب (Composition) على الوراثة

```tsx
// SimpleModal + محتوى النموذج = modal إنشاء مناسبة
// SimpleModal + محتوى التفاصيل = modal عرض التفاصيل
// نفس المكوّن، محتوى مختلف!
```

### 3. رفع الحالة (Lifting State Up)

```tsx
// ✅ الصح: الحالة في الصفحة، المكوّن يستقبل props
<BookingItem onCancelBooking={() => cancelBooking({...})} />

// ❌ الخطأ: كل مكوّن يُجري mutation الخاص به
// (يُعقّد الكود ويُصعب الاختبار)
```

---

## 14. خلاصة

| الملف | الدور | يُستخدم في |
|-------|-------|------------|
| `types.ts` | عقد البيانات | كل الصفحات والمكوّنات |
| `useAuth.ts` | الوصول لسياق المصادقة | كل الصفحات والمكوّنات |
| `formatDate.ts` | تنسيق التواريخ | EventItem, BookingItem, UserEvents |
| `Alert.tsx` | عرض الرسائل | كل الصفحات |
| `Spinner.tsx` | حالة التحميل | كل الصفحات |
| `EventItem.tsx` | بطاقة مناسبة | Events, UserEvents |
| `BookingItem.tsx` | بطاقة حجز | Bookings |
| `SimpleModal.tsx` | إطار modal | Events, UserEvents, ProfileEditor |
| `ProfileEditor.tsx` | تعديل/حذف الحساب | UserDropdown |
| `Navbar.tsx` | التنقل | App (مرة واحدة) |
| `UserDropdown.tsx` | قائمة المستخدم | Navbar |
````
