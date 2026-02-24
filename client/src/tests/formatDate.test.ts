/**
 * اختبارات أدوات تنسيق التاريخ (Date Formatting Utils)
 * ══════════════════════════════════════════════════════
 *
 * تتحقق من:
 *  1. formatDateShort تحول التاريخ إلى صيغة YYYY/MM/DD
 *  2. formatDateArabic تحول التاريخ إلى صيغة عربية
 *  3. formatDateForInput تحول التاريخ لصيغة datetime-local
 *  4. formatDateFull تزيل الملي ثانية مع إبقاء الوقت
 *  5. جميع الدوال تتعامل مع صيغ التاريخ المختلفة من GraphQL
 *
 * الملف: client/src/tests/formatDate.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  formatDateShort,
  formatDateArabic,
  formatDateForInput,
  formatDateFull,
} from "../utils/formatDate";

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

describe("formatDateArabic — تنسيق عربي", () => {
  it("يجب أن يحول التاريخ إلى صيغة عربية", () => {
    const result = formatDateArabic("2024-06-15T10:00:00.000Z");
    // النتيجة تعتمد على إعدادات المنطقة — نتحقق أنها ليست فارغة
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("يجب أن يعيد تاريخاً صالحاً وليس Invalid Date", () => {
    const result = formatDateArabic("2024-01-01T00:00:00.000Z");
    expect(result).not.toContain("Invalid");
  });
});

describe("formatDateForInput — صيغة datetime-local", () => {
  it("يجب أن يحول التاريخ مع ملي ثانية إلى صيغة datetime-local", () => {
    expect(formatDateForInput("2024-06-15 10:00:00.000")).toBe(
      "2024-06-15T10:00:00"
    );
  });

  it("يجب أن يتعامل مع التاريخ بـ T بدون تغيير", () => {
    expect(formatDateForInput("2024-06-15T10:00:00.000Z")).toBe(
      "2024-06-15T10:00:00"
    );
  });

  it("يجب أن يزيل أجزاء الملي ثانية", () => {
    const result = formatDateForInput("2024-06-15T14:30:00.123Z");
    expect(result).not.toContain(".");
    expect(result).toBe("2024-06-15T14:30:00");
  });
});

describe("formatDateFull — تنسيق كامل بدون ملي ثانية", () => {
  it("يجب أن يزيل الملي ثانية ويستبدل الشرطات", () => {
    expect(formatDateFull("2024-06-15T10:00:00.000Z")).toBe(
      "2024/06/15T10:00:00"
    );
  });

  it("يجب أن يحافظ على الوقت", () => {
    const result = formatDateFull("2024-12-25T18:30:00.000Z");
    expect(result).toContain("18:30:00");
  });

  it("يجب أن يستبدل جميع الشرطات", () => {
    const result = formatDateFull("2024-06-15T10:00:00.000Z");
    expect(result).not.toContain("-");
  });
});
