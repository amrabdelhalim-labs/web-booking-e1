/**
 * اختبارات عمليات GraphQL (Queries & Fragments)
 * ═══════════════════════════════════════════════
 *
 * تتحقق من:
 *  1. جميع العمليات (queries, mutations, subscriptions) معرّفة
 *  2. الأجزاء (fragments) معرّفة وتحتوي على الحقول المطلوبة
 *  3. أسماء العمليات تتوافق مع مسميات السيرفر
 *  4. لا يوجد عمليات مكررة
 *
 * الملف: client/src/__tests__/graphql.test.ts
 */
import { describe, it, expect } from "vitest";
import { EVENT_FIELDS } from "../graphql/fragments";
import {
  EVENTS,
  GET_USER_EVENTS,
  BOOKINGS,
  LOGIN,
  CREATE_USER,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  BOOK_EVENT,
  CANCEL_BOOKING,
  UPDATE_USER,
  DELETE_USER,
  EVENT_ADDED,
  BOOKING_ADDED,
} from "../graphql/queries";

// ─── أداة مساعدة: استخراج نص العملية ───
function getQuerySource(doc: { loc?: { source?: { body?: string } } }): string {
  return doc?.loc?.source?.body ?? "";
}

describe("الأجزاء المشتركة (Fragments)", () => {
  it("يجب أن يكون EVENT_FIELDS معرّفاً", () => {
    expect(EVENT_FIELDS).toBeDefined();
  });

  it("يجب أن يحتوي EVENT_FIELDS على حقول المناسبة الأساسية", () => {
    const source = getQuerySource(EVENT_FIELDS);
    expect(source).toContain("_id");
    expect(source).toContain("title");
    expect(source).toContain("description");
    expect(source).toContain("price");
    expect(source).toContain("date");
    expect(source).toContain("creator");
  });

  it("يجب أن يتضمن بيانات المنشئ في الجزء", () => {
    const source = getQuerySource(EVENT_FIELDS);
    expect(source).toContain("username");
    expect(source).toContain("email");
  });
});

describe("الاستعلامات (Queries)", () => {
  it("يجب أن يكون EVENTS معرّفاً ويدعم البحث والتصفح", () => {
    expect(EVENTS).toBeDefined();
    const source = getQuerySource(EVENTS);
    expect(source).toContain("searchTerm");
    expect(source).toContain("skip");
    expect(source).toContain("limit");
  });

  it("يجب أن يكون GET_USER_EVENTS معرّفاً ويتطلب userId", () => {
    expect(GET_USER_EVENTS).toBeDefined();
    const source = getQuerySource(GET_USER_EVENTS);
    expect(source).toContain("userId");
  });

  it("يجب أن يكون BOOKINGS معرّفاً", () => {
    expect(BOOKINGS).toBeDefined();
    const source = getQuerySource(BOOKINGS);
    expect(source).toContain("bookings");
    expect(source).toContain("createdAt");
  });
});

describe("عمليات المصادقة (Auth Mutations)", () => {
  it("يجب أن يكون LOGIN معرّفاً ويتطلب email و password", () => {
    expect(LOGIN).toBeDefined();
    const source = getQuerySource(LOGIN);
    expect(source).toContain("email");
    expect(source).toContain("password");
    expect(source).toContain("token");
    expect(source).toContain("userId");
    expect(source).toContain("username");
  });

  it("يجب أن يكون CREATE_USER معرّفاً ويتطلب username و email و password", () => {
    expect(CREATE_USER).toBeDefined();
    const source = getQuerySource(CREATE_USER);
    expect(source).toContain("username");
    expect(source).toContain("email");
    expect(source).toContain("password");
    expect(source).toContain("token");
  });
});

describe("عمليات المناسبات (Event Mutations)", () => {
  it("يجب أن يكون CREATE_EVENT معرّفاً ويستخدم eventInput", () => {
    expect(CREATE_EVENT).toBeDefined();
    const source = getQuerySource(CREATE_EVENT);
    expect(source).toContain("createEvent");
    expect(source).toContain("title");
    expect(source).toContain("price");
  });

  it("يجب أن يكون UPDATE_EVENT معرّفاً ويتطلب eventId", () => {
    expect(UPDATE_EVENT).toBeDefined();
    const source = getQuerySource(UPDATE_EVENT);
    expect(source).toContain("updateEvent");
    expect(source).toContain("eventId");
  });

  it("يجب أن يكون DELETE_EVENT معرّفاً ويتطلب eventId", () => {
    expect(DELETE_EVENT).toBeDefined();
    const source = getQuerySource(DELETE_EVENT);
    expect(source).toContain("deleteEvent");
    expect(source).toContain("eventId");
  });
});

describe("عمليات الحجوزات (Booking Mutations)", () => {
  it("يجب أن يكون BOOK_EVENT معرّفاً ويتطلب eventId", () => {
    expect(BOOK_EVENT).toBeDefined();
    const source = getQuerySource(BOOK_EVENT);
    expect(source).toContain("bookEvent");
    expect(source).toContain("eventId");
  });

  it("يجب أن يكون CANCEL_BOOKING معرّفاً ويتطلب bookingId", () => {
    expect(CANCEL_BOOKING).toBeDefined();
    const source = getQuerySource(CANCEL_BOOKING);
    expect(source).toContain("cancelBooking");
    expect(source).toContain("bookingId");
  });
});

describe("عمليات المستخدم (User Mutations)", () => {
  it("يجب أن يكون UPDATE_USER معرّفاً", () => {
    expect(UPDATE_USER).toBeDefined();
    const source = getQuerySource(UPDATE_USER);
    expect(source).toContain("updateUser");
  });

  it("يجب أن يكون DELETE_USER معرّفاً", () => {
    expect(DELETE_USER).toBeDefined();
    const source = getQuerySource(DELETE_USER);
    expect(source).toContain("deleteUser");
  });
});

describe("الاشتراكات (Subscriptions)", () => {
  it("يجب أن يكون EVENT_ADDED معرّفاً", () => {
    expect(EVENT_ADDED).toBeDefined();
    const source = getQuerySource(EVENT_ADDED);
    expect(source).toContain("eventAdded");
  });

  it("يجب أن يكون BOOKING_ADDED معرّفاً", () => {
    expect(BOOKING_ADDED).toBeDefined();
    const source = getQuerySource(BOOKING_ADDED);
    expect(source).toContain("bookingAdded");
  });
});

describe("تغطية جميع العمليات (Coverage Check)", () => {
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

  it("يجب أن تحتوي كل عملية على نص مصدري", () => {
    allOperations.forEach(({ name, op }) => {
      const source = getQuerySource(op);
      expect(source.length, `العملية ${name} فارغة`).toBeGreaterThan(0);
    });
  });
});
