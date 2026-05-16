export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type JobCategory = "admin" | "technical" | "services";

export const JOB_CATEGORIES: { value: JobCategory; labelAr: string }[] = [
  { value: "admin", labelAr: "إداري" },
  { value: "technical", labelAr: "فني" },
  { value: "services", labelAr: "خدمات" },
];

export function jobCategoryLabelAr(value: string): string {
  return JOB_CATEGORIES.find((j) => j.value === value)?.labelAr ?? value;
}

export type EducationLevel =
  | "bachelor"
  | "diploma"
  | "preparatory"
  | "intermediate"
  | "primary"
  | "none";

export const EDUCATION_LEVELS: { value: EducationLevel; labelAr: string }[] = [
  { value: "bachelor", labelAr: "بكالوريوس" },
  { value: "diploma", labelAr: "دبلوم" },
  { value: "preparatory", labelAr: "إعدادية" },
  { value: "intermediate", labelAr: "متوسطة" },
  { value: "primary", labelAr: "ابتدائية" },
  { value: "none", labelAr: "بدون شهادة" },
];

export function educationLevelLabelAr(value: string): string {
  return EDUCATION_LEVELS.find((e) => e.value === value)?.labelAr ?? value;
}
