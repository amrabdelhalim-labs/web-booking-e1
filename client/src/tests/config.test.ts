/**
 * اختبارات ثوابت الإعدادات (Config Tests)
 * ═══════════════════════════════════════════
 *
 * تتحقق من:
 *  1. جميع ثوابت التطبيق معرّفة وصحيحة
 *  2. روابط GraphQL (HTTP + WebSocket) تتبع الصيغة الصحيحة
 *  3. دالة اشتقاق WebSocket URL تعمل بشكل صحيح
 *  4. القيم الافتراضية لا تشير إلى خوادم الإنتاج
 *
 * الملف: client/src/__tests__/config.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  APP_DOMAIN,
  APP_BASE_PATH,
  APP_NAME,
  GRAPHQL_HTTP_URL,
  GRAPHQL_WS_URL,
} from "../config";

describe("ثوابت التطبيق (App Constants)", () => {
  it("يجب أن يكون اسم التطبيق معرّفاً", () => {
    expect(APP_NAME).toBe("Event Booking");
  });

  it("يجب أن يكون المسار الأساسي معرّفاً", () => {
    expect(APP_BASE_PATH).toBe("/web-booking-e1");
  });

  it("يجب أن يكون نطاق التطبيق معرّفاً", () => {
    expect(APP_DOMAIN).toBeDefined();
    expect(typeof APP_DOMAIN).toBe("string");
    expect(APP_DOMAIN.length).toBeGreaterThan(0);
  });
});

describe("روابط GraphQL (GraphQL URLs)", () => {
  it("يجب أن يكون رابط HTTP معرّفاً ويبدأ بـ http", () => {
    expect(GRAPHQL_HTTP_URL).toBeDefined();
    expect(GRAPHQL_HTTP_URL).toMatch(/^https?:\/\//);
  });

  it("يجب أن ينتهي رابط HTTP بـ /graphql", () => {
    expect(GRAPHQL_HTTP_URL).toMatch(/\/graphql$/);
  });

  it("يجب أن يكون رابط WebSocket معرّفاً ويبدأ بـ ws", () => {
    expect(GRAPHQL_WS_URL).toBeDefined();
    expect(GRAPHQL_WS_URL).toMatch(/^wss?:\/\//);
  });

  it("يجب أن ينتهي رابط WebSocket بـ /graphql", () => {
    expect(GRAPHQL_WS_URL).toMatch(/\/graphql$/);
  });

  it("يجب أن يتطابق بروتوكول WebSocket مع بروتوكول HTTP", () => {
    const isHttps = GRAPHQL_HTTP_URL.startsWith("https://");
    if (isHttps) {
      expect(GRAPHQL_WS_URL).toMatch(/^wss:\/\//);
    } else {
      expect(GRAPHQL_WS_URL).toMatch(/^ws:\/\//);
    }
  });

  it("يجب أن يشير الرابط الافتراضي إلى localhost للتطوير", () => {
    // القيمة الافتراضية يجب أن تكون localhost وليس خادم إنتاج
    expect(GRAPHQL_HTTP_URL).toContain("localhost");
  });
});
