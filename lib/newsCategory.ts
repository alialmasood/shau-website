export type NewsCategoryCode =
  | "ADMINISTRATIVE"
  | "SCIENTIFIC"
  | "ACTIVITIES"
  | "ANNOUNCEMENTS";

export function categoryToArabic(cat: string | null) {
  switch (cat) {
    case "ADMINISTRATIVE":
      return "أخبار إدارية";
    case "SCIENTIFIC":
      return "أخبار علمية";
    case "ACTIVITIES":
      return "نشاطات وفعاليات";
    case "ANNOUNCEMENTS":
      return "إعلانات";
    default:
      return "الكل";
  }
}

export function categoryToEnglish(cat: string | null) {
  switch (cat) {
    case "ADMINISTRATIVE":
      return "Administrative News";
    case "SCIENTIFIC":
      return "Scientific News";
    case "ACTIVITIES":
      return "Activities & Events";
    case "ANNOUNCEMENTS":
      return "Announcements";
    default:
      return "All";
  }
}

/** ترجمة كود الفئة إلى النص حسب اللغة (للعرض في واجهة الأخبار فقط) */
export function categoryCodeToLabel(code: string | null, locale: "ar" | "en") {
  return locale === "en" ? categoryToEnglish(code) : categoryToArabic(code);
}

/** ترجمة التسمية العربية للفئة لعرضها في الفلاتر (قيمة الفلتر تبقى عربية للـ API) */
export function categoryArabicToLabel(ar: string, locale: "ar" | "en") {
  if (locale === "ar") return ar;
  const code = arabicToCategoryCode(ar);
  return code ? categoryToEnglish(code) : ar;
}

export function arabicToCategoryCode(label: string | null) {
  switch (label) {
    case "أخبار إدارية":
      return "ADMINISTRATIVE";
    case "أخبار علمية":
      return "SCIENTIFIC";
    case "نشاطات وفعاليات":
      return "ACTIVITIES";
    case "إعلانات":
      return "ANNOUNCEMENTS";
    default:
      return null;
  }
}

