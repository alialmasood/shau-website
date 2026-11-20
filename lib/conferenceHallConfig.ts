/** مفتاح اختيار كل الأقسام في استمارة إقامة النشاط */
export const CONFERENCE_HALL_ALL_DEPARTMENTS_KEY = "__all__";

export const CONFERENCE_HALL_STAGES = [
  { value: "first", ar: "الأولى", en: "First" },
  { value: "second", ar: "الثانية", en: "Second" },
  { value: "third", ar: "الثالثة", en: "Third" },
  { value: "fourth", ar: "الرابعة", en: "Fourth" },
  { value: "all", ar: "كل المراحل", en: "All stages" },
] as const;

export const CONFERENCE_HALL_STUDY_TYPES = [
  { value: "morning", ar: "صباحي", en: "Morning" },
  { value: "evening", ar: "مسائي", en: "Evening" },
  { value: "both", ar: "صباحي ومسائي", en: "Morning & Evening" },
] as const;

export const CONFERENCE_HALL_ACTIVITY_TYPES = [
  { value: "conference", ar: "مؤتمر", en: "Conference" },
  { value: "seminar", ar: "ندوة", en: "Seminar" },
  { value: "workshop", ar: "ورشة", en: "Workshop" },
  { value: "scientific_visit", ar: "زيارة علمية", en: "Scientific visit" },
  {
    value: "student_scientific",
    ar: "نشاط طلابي علمي",
    en: "Student scientific activity",
  },
  {
    value: "scientific_festival",
    ar: "مهرجان علمي",
    en: "Scientific festival",
  },
] as const;

export type ConferenceHallStage = (typeof CONFERENCE_HALL_STAGES)[number]["value"];
export type ConferenceHallStudyType = (typeof CONFERENCE_HALL_STUDY_TYPES)[number]["value"];
export type ConferenceHallActivityType =
  (typeof CONFERENCE_HALL_ACTIVITY_TYPES)[number]["value"];
export type ConferenceHallStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export const CONFERENCE_HALL_STATUSES: ConferenceHallStatus[] = [
  "pending",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

export function labelStage(value: string, locale: "ar" | "en"): string {
  const row = CONFERENCE_HALL_STAGES.find((x) => x.value === value);
  return row ? row[locale] : value;
}

export function labelStudyType(value: string, locale: "ar" | "en"): string {
  const row = CONFERENCE_HALL_STUDY_TYPES.find((x) => x.value === value);
  return row ? row[locale] : value;
}

export function labelActivityType(value: string, locale: "ar" | "en"): string {
  const row = CONFERENCE_HALL_ACTIVITY_TYPES.find((x) => x.value === value);
  return row ? row[locale] : value;
}

export function labelStatus(value: string, locale: "ar" | "en"): string {
  const map: Record<string, { ar: string; en: string }> = {
    pending: { ar: "قيد المراجعة", en: "Pending" },
    approved: { ar: "موافق عليه", en: "Approved" },
    rejected: { ar: "مرفوض", en: "Rejected" },
    cancelled: { ar: "ملغى", en: "Cancelled" },
    completed: { ar: "منجز", en: "Completed" },
  };
  return map[value]?.[locale] ?? value;
}

export function isConferenceHallStatus(value: string): value is ConferenceHallStatus {
  return (CONFERENCE_HALL_STATUSES as string[]).includes(value);
}

export function todayLocalYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidYmd(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}
