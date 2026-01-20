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

