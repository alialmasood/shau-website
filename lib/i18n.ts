import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

export type Locale = "ar" | "en";

const messages = { ar: arMessages, en: enMessages };

/**
 * إرجاع نسخة الترجمات للغة المطلوبة.
 * استخدم في المكوّنات الخادمة: getTranslations(locale).news.title
 * أو في المكوّنات العميلة بعد معرفة اللغة من usePathname.
 */
export function getTranslations(locale: Locale): typeof arMessages {
  return (messages[locale] ?? messages.ar) as typeof arMessages;
}

/**
 * مساعد لتفادي القيم الفارغة: إن لم يوجد المفتاح يُرجَع النص الاحتياطي.
 */
export function tKey(
  obj: Record<string, unknown> | undefined,
  key: string,
  fallback: string
): string {
  if (!obj) return fallback;
  const v = obj[key];
  return typeof v === "string" ? v : fallback;
}
