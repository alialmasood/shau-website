import {
  BLOOD_TYPES,
  EDUCATION_LEVELS,
  JOB_CATEGORIES,
  type EducationLevel,
  type JobCategory,
} from "./employeeIdentityConfig";
import {
  filterArabicFieldInput,
  filterEnglishNameInput,
  filterIraqiPhoneInput,
  isValidArabicFullName,
  isValidArabicOptional,
  isValidArabicWorkplace,
  isValidEnglishFullName,
  isValidIraqiMobile,
} from "./staffIdentityRequestValidation";

export {
  filterArabicFieldInput,
  filterEnglishNameInput,
  filterIraqiPhoneInput,
};

const AR_ADDRESS_RE =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u060C\u061B\u061F\u0640.\-،؛٫\u0660-\u0669\u06F0-\u06F90-9#\/]+$/u;

export function isValidArabicAddress(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 5 || t.length > 300) return false;
  if (/[A-Za-z]/.test(t)) return false;
  return AR_ADDRESS_RE.test(t);
}

export function isValidBloodType(s: string): boolean {
  return (BLOOD_TYPES as readonly string[]).includes(s.trim());
}

export function isValidJobCategory(s: string): s is JobCategory {
  return JOB_CATEGORIES.some((j) => j.value === s);
}

export function isValidEducationLevel(s: string): s is EducationLevel {
  return EDUCATION_LEVELS.some((e) => e.value === s);
}

export function isValidOptionalEmail(s: string | null | undefined): boolean {
  const t = (s ?? "").trim();
  if (!t) return true;
  if (t.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function filterOptionalEmailInput(v: string): string {
  return v.replace(/[^a-zA-Z0-9._%+\-@]/g, "").slice(0, 120);
}

export { isValidArabicFullName, isValidEnglishFullName, isValidArabicWorkplace, isValidArabicOptional, isValidIraqiMobile };
