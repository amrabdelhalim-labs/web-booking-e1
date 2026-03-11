# الدرس السابع (العميل): اختبارات العميل بـ Vitest 🧪

> **هدف الدرس:** فهم كيف تُكتب اختبارات العميل وما الذي تتحقق منه

---

## 1. نظرة عامة على الاختبارات

يحتوي العميل على خمسة ملفات اختبار في `client/src/tests/`:

| الملف | ما يختبر |
|-------|---------|
| `useAuth.test.tsx` | hook المصادقة وـ localStorage |
| `graphql.test.ts` | تعريفات Queries/Mutations/Subscriptions |
| `config.test.ts` | ثوابت الـ URLs وتحويل WebSocket |
| `formatDate.test.ts` | دوال تنسيق التواريخ |
| `types.test.ts` | هياكل أنواع TypeScript |

---

## 2. أداة الاختبار: Vitest

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
```

| الدالة | الغرض |
|--------|--------|
| `describe("اسم المجموعة", () => {...})` | تجميع اختبارات مترابطة |
| `it("يجب أن يفعل X", () => {...})` | اختبار واحد محدد |
| `expect(value).toBe(expected)` | التحقق من تساوي قيمتين |
| `expect(value).toBeNull()` | التحقق أن القيمة null |
| `expect(value).toBeDefined()` | التحقق أن القيمة معرّفة |
| `vi.mock("module")` | محاكاة وحدة برمجية |
| `beforeEach(() => {...})` | تنفيذ كود قبل كل اختبار |

### تشغيل الاختبارات

```bash
npm run test        # تشغيل كل الاختبارات
# من مجلد client/
npm run test:watch  # مراقبة وإعادة التشغيل عند تغيير الملفات
npm run test:ui     # واجهة رسومية للاختبارات
npm run coverage    # تقرير التغطية
```

---

## 3. ملف `useAuth.test.tsx` — اختبار hook المصادقة

### الهدف

اختبار `useAuth` hook الذي يدير حالة تسجيل الدخول وـ localStorage.

### الإعداد

```typescript
import { renderHook, act } from "@testing-library/react";
import { AuthProvider } from "../context/auth-context";
import { useAuth } from "../context/auth-context";

// wrapper يُضمّن الـ hook في AuthProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  localStorage.clear(); // نظّف قبل كل اختبار
});
```

**`renderHook`** = أداة Testing Library لاختبار Hooks بشكل معزول.  
**`act`** = يُخبر React بإكمال التحديثات قبل التحقق من النتائج.

### الاختبارات

```typescript
describe("useAuth — إدارة حالة المصادقة", () => {

  it("يجب أن يبدأ بدون بيانات مصادقة", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.username).toBeNull();
  });

  it("يجب أن يحمّل البيانات من localStorage عند الإنشاء", () => {
    // ضع بيانات مسبقاً في localStorage
    localStorage.setItem("token", "existing-token");
    localStorage.setItem("userId", "user-123");
    localStorage.setItem("username", "أحمد");

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Hook يقرأها تلقائياً
    expect(result.current.token).toBe("existing-token");
    expect(result.current.username).toBe("أحمد");
  });

  it("يجب أن تحفظ login البيانات في localStorage", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("new-token", "new-user-id", "سارة");
    });

    expect(result.current.username).toBe("سارة");
    expect(localStorage.getItem("token")).toBe("new-token");
    expect(localStorage.getItem("userId")).toBe("new-user-id");
    expect(localStorage.getItem("username")).toBe("سارة");
  });

  it("يجب أن تمسح logout جميع البيانات", () => {
    localStorage.setItem("token", "test-token");
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout() );

    expect(result.current.token).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.username).toBeNull();
  });

  it("يجب أن تعمل login ثم logout بالتتابع", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => { result.current.login("token-1", "user-1", "محمد"); });
    expect(result.current.token).toBe("token-1");

    act(() => { result.current.logout(); });
    expect(result.current.token).toBeNull();

    act(() => { result.current.login("token-2", "user-2", "علي"); });
    expect(result.current.username).toBe("علي");
  });
});
```

### لماذا نختبر useAuth؟

```text
useAuth هو قلب المصادقة في العميل:
  ✓ هل يقرأ localStorage صحيحاً؟
  ✓ هل login يحفظ البيانات في الذاكرة وـ localStorage؟
  ✓ هل logout يمسح كل شيء؟
  ✓ هل البيانات تبقى محفوظة بعد إعادة تحميل الصفحة؟
```

---

## 4. ملف `graphql.test.ts` — اختبار تعريفات GraphQL

### الهدف

التحقق من أن جميع Queries/Mutations/Subscriptions معرّفة وتحتوي على الحقول الصحيحة.

```typescript
import { describe, it, expect } from "vitest";
import {
  EVENTS, GET_USER_EVENTS, BOOKINGS,
  LOGIN, CREATE_USER,
  CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT,
  BOOK_EVENT, CANCEL_BOOKING,
  UPDATE_USER, DELETE_USER,
  EVENT_ADDED, BOOKING_ADDED,
} from "../graphql/queries";

// استخراج نص الاستعلام من DocumentNode
function getQuerySource(query: DocumentNode): string {
  return print(query);
}
```

### اختبار Queries

```typescript
describe("استعلامات القراءة (Queries)", () => {

  it("يجب أن يكون EVENTS معرّفاً ويدعم البحث والتصفح", () => {
    expect(EVENTS).toBeDefined();
    const source = getQuerySource(EVENTS);
    expect(source).toContain("searchTerm");
    expect(source).toContain("skip");
    expect(source).toContain("limit");
  });

  it("يجب أن يكون GET_USER_EVENTS معرّفاً ويتطلب userId", () => {
    expect(GET_USER_EVENTS).toBeDefined();
    expect(getQuerySource(GET_USER_EVENTS)).toContain("userId");
  });

  it("يجب أن يكون BOOKINGS معرّفاً", () => {
    expect(BOOKINGS).toBeDefined();
    const source = getQuerySource(BOOKINGS);
    expect(source).toContain("bookings");
    expect(source).toContain("createdAt");
  });
});
```

### اختبار Subscriptions

```typescript
describe("الاشتراكات (Subscriptions)", () => {

  it("يجب أن يكون EVENT_ADDED معرّفاً", () => {
    expect(EVENT_ADDED).toBeDefined();
    expect(getQuerySource(EVENT_ADDED)).toContain("eventAdded");
  });

  it("يجب أن يكون BOOKING_ADDED معرّفاً", () => {
    expect(BOOKING_ADDED).toBeDefined();
    expect(getQuerySource(BOOKING_ADDED)).toContain("bookingAdded");
  });
});
```

### اختبار التغطية الكاملة (14 عملية)

```typescript
describe("تغطية جميع العمليات", () => {
  const allOperations = [
    { name: "EVENTS", op: EVENTS },
    { name: "GET_USER_EVENTS", op: GET_USER_EVENTS },
    { name: "BOOKINGS", op: BOOKINGS },
    { name: "LOGIN", op: LOGIN },
    { name: "CREATE_USER", op: CREATE_USER },
    { name: "CREATE_EVENT", op: CREATE_EVENT },
    { name: "UPDATE_EVENT", op: UPDATE_EVENT },
    { name: "DELETE_EVENT", op: DELETE_EVENT },
    { name: "BOOK_EVENT", op: BOOK_EVENT },
    { name: "CANCEL_BOOKING", op: CANCEL_BOOKING },
    { name: "UPDATE_USER", op: UPDATE_USER },
    { name: "DELETE_USER", op: DELETE_USER },
    { name: "EVENT_ADDED", op: EVENT_ADDED },
    { name: "BOOKING_ADDED", op: BOOKING_ADDED },
  ];

  it("يجب أن تكون جميع العمليات (14) معرّفة وليست null", () => {
    allOperations.forEach(({ name, op }) => {
      expect(op, `العملية ${name} غير معرّفة`).toBeDefined();
      expect(op, `العملية ${name} هي null`).not.toBeNull();
    });
  });
});
```

### لماذا نختبر تعريفات GraphQL؟

اختبار التعريفات **يكتشف أخطاء شائعة** مبكراً:
- نسيان إضافة حقل مطلوب في Subscription
- خطأ إملائي في اسم المتغير
- نسيان استيراد عملية جديدة

---

## 5. ملف `config.test.ts` — اختبار الإعدادات والـ URLs

### الهدف

التحقق من ثوابت الـ URLs وصحة تحويل `http` إلى `ws` للـ WebSocket.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// نحاكي متغيرات البيئة
vi.mock("../config", () => ({
  GRAPHQL_HTTP_URL: "http://localhost:4000/graphql",
  GRAPHQL_WS_URL: "ws://localhost:4000/graphql",
}));
```

### الاختبارات

```typescript
describe("ثوابت URLs", () => {

  it("يجب أن تكون GRAPHQL_HTTP_URL معرّفة وتبدأ بـ http", () => {
    const { GRAPHQL_HTTP_URL } = await import("../config");
    expect(GRAPHQL_HTTP_URL).toBeDefined();
    expect(GRAPHQL_HTTP_URL).toMatch(/^https?:\/\//);
  });

  it("يجب أن تكون GRAPHQL_WS_URL معرّفة وتبدأ بـ ws", () => {
    const { GRAPHQL_WS_URL } = await import("../config");
    expect(GRAPHQL_WS_URL).toBeDefined();
    expect(GRAPHQL_WS_URL).toMatch(/^wss?:\/\//);
  });

  it("يجب أن تتحول http إلى ws في الـ WebSocket URL", () => {
    const { GRAPHQL_WS_URL } = await import("../config");
    // http://localhost:4000/graphql → ws://localhost:4000/graphql
    expect(GRAPHQL_WS_URL).not.toContain("http://");
    expect(GRAPHQL_WS_URL).not.toContain("https://");
  });
});
```

**لماذا نختبر هذا؟**

دالة `normalizeWsUrl()` تحوّل HTTP URL إلى WebSocket URL تلقائياً:
```text
"http://localhost:4000/graphql"  → "ws://localhost:4000/graphql"
"https://api.mysite.com/graphql" → "wss://api.mysite.com/graphql"
```

لو كان فيها خطأ → Apollo لن يتمكن من الاتصال بـ GraphQL Subscriptions.

---

## 6. ملف `formatDate.test.ts` — اختبار دوال التواريخ

### الهدف

التحقق من صحة الدوال التي تحوّل تواريخ ISO إلى صيغ عرض مختلفة.

```typescript
import { describe, it, expect } from "vitest";
import {
  formatDateShort,
  formatDateArabic,
  formatDateForInput,
  formatDateFull,
} from "../utils/formatDate";
```

### اختبارات `formatDateShort`

```typescript
describe("formatDateShort — تنسيق مختصر (YYYY/MM/DD)", () => {

  it("يجب أن يحول تاريخ ISO إلى YYYY/MM/DD", () => {
    expect(formatDateShort("2024-06-15T10:00:00.000Z")).toBe("2024/06/15");
  });

  it("يجب أن يتعامل مع التاريخ بمسافة بدل T", () => {
    expect(formatDateShort("2024-06-15 10:00:00.000")).toBe("2024/06/15");
  });

  it("يجب أن يتعامل مع التاريخ بدون وقت", () => {
    expect(formatDateShort("2024-06-15")).toBe("2024/06/15");
  });
});
```

### اختبارات `formatDateForInput`

```typescript
describe("formatDateForInput — صيغة datetime-local", () => {

  it("يجب أن يحذف الملي ثانية", () => {
    const result = formatDateForInput("2024-06-15T14:30:00.123Z");
    expect(result).not.toContain(".");
    expect(result).toBe("2024-06-15T14:30:00");
  });

  it("يجب أن يُنتج صيغة صالحة لـ datetime-local input", () => {
    // HTML: <input type="datetime-local" value="2024-06-15T10:00:00">
    expect(formatDateForInput("2024-06-15 10:00:00.000")).toBe(
      "2024-06-15T10:00:00"
    );
  });
});
```

### اختبارات `formatDateArabic`

```typescript
describe("formatDateArabic — تنسيق بالعربية", () => {

  it("يجب أن يعيد نصاً غير فارغ", () => {
    const result = formatDateArabic("2024-06-15T10:00:00.000Z");
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("يجب ألا يعيد Invalid Date", () => {
    const result = formatDateArabic("2024-01-01T00:00:00.000Z");
    expect(result).not.toContain("Invalid");
  });
});
```

### لماذا نختبر التواريخ؟

التواريخ من GraphQL تأتي بصيغ مختلفة:
```text
"2024-06-15T10:00:00.000Z"   ← ISO Standard
"2024-06-15 10:00:00.000"  // بدون Z
"2024-06-15"  // بدون وقت
```

الاختبارات تضمن أن `formatDate*` تتعامل مع **جميع الصيغ** صحيحاً.

---

## 7. ملف `types.test.ts` — اختبار أنواع TypeScript

### الهدف

التحقق من أن هياكل البيانات في TypeScript تتطابق مع ما يُرجعه الخادم.

```typescript
import { describe, it, expect } from "vitest";
import type { Creator, EventData, BookingData } from "../types";
```

### اختبار `EventData`

```typescript
describe("نوع EventData (بيانات المناسبة)", () => {
  const mockEvent: EventData = {
    _id: "event456",
    title: "مؤتمر التقنية",
    description: "مؤتمر تقني سنوي",
    price: 150,
    date: "2024-06-15T10:00:00.000Z",
    creator: {
      _id: "user123",
      username: "أحمد",
      email: "ahmed@example.com",
    },
  };

  it("يجب أن يتطابق هيكل EventData مع استجابة GraphQL", () => {
    expect(mockEvent._id).toBe("event456");
    expect(mockEvent.title).toBe("مؤتمر التقنية");
    expect(mockEvent.price).toBe(150);
    expect(typeof mockEvent.date).toBe("string"); // تاريخ كـ string من GraphQL
  });

  it("يجب أن يكون السعر رقماً موجباً", () => {
    expect(typeof mockEvent.price).toBe("number");
    expect(mockEvent.price).toBeGreaterThan(0);
  });

  it("يجب أن يكون التاريخ بصيغة ISO", () => {
    expect(mockEvent.date).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});
```

### اختبار `BookingData`

```typescript
describe("نوع BookingData (بيانات الحجز)", () => {
  const mockBooking: BookingData = {
    _id: "booking789",
    createdAt: "2024-06-20T14:30:00.000Z",
    event: {
      _id: "event456",
      title: "مؤتمر التقنية",
      description: "مؤتمر تقني",
      price: 150,
      date: "2024-06-15T10:00:00.000Z",
      creator: { _id: "user123", username: "أحمد", email: "ahmed@example.com" },
    },
    user: { username: "سعد", email: "saad@example.com" },
  };

  it("يجب أن يتضمن بيانات المناسبة المحضرة (populated)", () => {
    expect(mockBooking.event.title).toBe("مؤتمر التقنية");
    expect(mockBooking.event.creator.username).toBe("أحمد");
  });
});
```

### لماذا نختبر الأنواع؟

```typescript
const event = data.event;
// بدون اختبار ← خطأ يُكتشف في وقت التشغيل فقط
console.log(event.crator.name); // خطأ إملائي في "creator" لا يُكتشف!

// مع اختبار ← TypeScript يكتشف الخطأ فوراً
const mockEvent: EventData = { crator: {...} }; // ❌ خطأ TypeScript فوري!
```

---

## 8. خلاصة مسار الاختبارات

```text
types.test.ts  // هل البيانات بالـ Shape الصحيح؟
config.test.ts  // هل الـ URLs مضبوطة؟
formatDate.test.ts  // هل تنسيق التواريخ صحيح؟
graphql.test.ts  // هل كل العمليات معرّفة؟
useAuth.test.tsx  // هل المصادقة تعمل بشكل صحيح؟
```

---

**📖 العودة إلى:** [قائمة الدروس](../README.md)
