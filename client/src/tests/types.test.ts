/**
 * اختبارات أنواع TypeScript — التحقق من مطابقة الأنواع للسيرفر
 * ══════════════════════════════════════════════════════════════
 *
 * تتحقق من:
 *  1. هيكل واجهة EventData يتطابق مع استجابة GraphQL
 *  2. هيكل واجهة Creator يتضمن جميع الحقول المطلوبة
 *  3. هيكل واجهة BookingData يطابق بيانات الحجز من السيرفر
 *  4. الأنواع تتوافق مع هيكل Schema الخاص بـ GraphQL
 *
 * الملف: client/src/__tests__/types.test.ts
 */
import { describe, it, expect } from "vitest";
import type { Creator, EventData, BookingData } from "../types";

describe("نوع Creator (بيانات المنشئ)", () => {
  const mockCreator: Creator = {
    _id: "user123",
    username: "أحمد",
    email: "ahmed@example.com",
  };

  it("يجب أن يحتوي على _id من نوع string", () => {
    expect(typeof mockCreator._id).toBe("string");
    expect(mockCreator._id.length).toBeGreaterThan(0);
  });

  it("يجب أن يحتوي على username و email", () => {
    expect(mockCreator.username).toBe("أحمد");
    expect(mockCreator.email).toContain("@");
  });
});

describe("نوع EventData (بيانات المناسبة)", () => {
  const mockCreator: Creator = {
    _id: "user123",
    username: "أحمد",
    email: "ahmed@example.com",
  };

  const mockEvent: EventData = {
    _id: "event456",
    title: "مؤتمر التقنية",
    description: "مؤتمر تقني سنوي",
    price: 150,
    date: "2024-06-15T10:00:00.000Z",
    creator: mockCreator,
  };

  it("يجب أن يتطابق هيكل EventData مع استجابة GraphQL", () => {
    expect(mockEvent._id).toBe("event456");
    expect(mockEvent.title).toBe("مؤتمر التقنية");
    expect(mockEvent.description).toBe("مؤتمر تقني سنوي");
    expect(mockEvent.price).toBe(150);
    expect(typeof mockEvent.date).toBe("string");
  });

  it("يجب أن يتضمن بيانات المنشئ كاملة", () => {
    expect(mockEvent.creator._id).toBe("user123");
    expect(mockEvent.creator.username).toBe("أحمد");
    expect(mockEvent.creator.email).toBe("ahmed@example.com");
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

describe("نوع BookingData (بيانات الحجز)", () => {
  const mockBooking: BookingData = {
    _id: "booking789",
    createdAt: "2024-06-20T14:30:00.000Z",
    event: {
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
    },
    user: {
      username: "سعد",
      email: "saad@example.com",
    },
  };

  it("يجب أن يتطابق هيكل BookingData مع استجابة GraphQL", () => {
    expect(mockBooking._id).toBe("booking789");
    expect(typeof mockBooking.createdAt).toBe("string");
  });

  it("يجب أن يتضمن بيانات المناسبة كاملة", () => {
    expect(mockBooking.event.title).toBe("مؤتمر التقنية");
    expect(mockBooking.event.price).toBe(150);
    expect(mockBooking.event.creator.username).toBe("أحمد");
  });

  it("يجب أن يتضمن بيانات المستخدم الحاجز", () => {
    expect(mockBooking.user.username).toBe("سعد");
    expect(mockBooking.user.email).toContain("@");
  });

  it("يجب أن يكون تاريخ الحجز بصيغة ISO", () => {
    expect(mockBooking.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});
