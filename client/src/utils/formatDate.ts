/**
 * أدوات تنسيق التاريخ
 * ──────────────────────
 * دوال مساعدة لتنسيق التواريخ الواردة من GraphQL.
 * تستخدم في EventItem, BookingItem, Events, UserEvents.
 */

/**
 * تنسيق التاريخ للعرض (YYYY/MM/DD)
 *
 * يحول سلسلة ISO من GraphQL إلى تنسيق قابل للقراءة.
 * يزيل الوقت والمنطقة الزمنية ويستبدل الشرطات بشرطات مائلة.
 *
 * @example
 * formatDateShort("2024-06-15T10:00:00.000Z") → "2024/06/15"
 * formatDateShort("2024-06-15 10:00:00.000") → "2024/06/15"
 */
export function formatDateShort(dateStr: string): string {
  return dateStr.split('.')[0].split('T')[0].split(' ')[0].replace(/-/g, '/');
}

/**
 * تنسيق التاريخ للعرض بالعربية
 *
 * يحول سلسلة ISO إلى تاريخ مقروء بالعربية المصرية.
 *
 * @example
 * formatDateArabic("2024-06-15T10:00:00.000Z") → "١٥/٦/٢٠٢٤"
 */
export function formatDateArabic(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-EG');
}

/**
 * تنسيق التاريخ والوقت للعرض بدون المنطقة الزمنية
 *
 * يزيل أجزاء الملي ثانية لاستخدامها في حقول datetime-local.
 *
 * @example
 * formatDateForInput("2024-06-15 10:00:00.000") → "2024-06-15T10:00:00"
 */
export function formatDateForInput(dateStr: string): string {
  return dateStr.split('.')[0].replace(' ', 'T');
}

/**
 * تنسيق التاريخ للعرض الكامل (بدون الملي ثانية)
 *
 * يحذف أجزاء الملي ثانية ويستبدل الشرطات بشرطات مائلة.
 *
 * @example
 * formatDateFull("2024-06-15T10:00:00.000Z") → "2024/06/15T10:00:00"
 */
export function formatDateFull(dateStr: string): string {
  return dateStr.split('.')[0].replace(/-/g, '/');
}
