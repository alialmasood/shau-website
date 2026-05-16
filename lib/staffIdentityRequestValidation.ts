/**
 * قواعد التحقق لنموذج طلب هوية الكادر (واجهة + خادم).
 */

import { BLOOD_TYPES } from "./employeeIdentityConfig";

/** نص عربي: حروف عربية ومسافات وعلامات شائعة فقط (لا حروف لاتينية ولا أرقام إنجليزية). */
const AR_TEXT_RE =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u060C\u061B\u061F\u0640.\-،؛٫\u0660-\u0669\u06F0-\u06F9()]+$/u;

function hasArabicLetter(s: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(s);
}

/** الاسم العربي مطلوب وصالح */
export function isValidArabicFullName(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 200) return false;
  if (/[A-Za-z]/.test(t) || /[0-9]/.test(t)) return false;
  return AR_TEXT_RE.test(t) && hasArabicLetter(t);
}

/** الاسم الإنجليزي: حروف لاتينية ومسافة وعلامات الاسم فقط */
export function isValidEnglishFullName(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 200) return false;
  return /^[A-Za-z\s'.-]+$/.test(t);
}

/** حقل عربي اختياري: فارغ أو نص عربي صالح */
export function isValidArabicOptional(s: string | null | undefined): boolean {
  const t = (s ?? "").trim();
  if (!t) return true;
  if (t.length > 120) return false;
  if (/[A-Za-z]/.test(t) || /[0-9]/.test(t)) return false;
  return AR_TEXT_RE.test(t) && hasArabicLetter(t);
}

const AR_ADDRESS_RE =
  /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u060C\u061B\u061F\u0640.\-،؛٫\u0660-\u0669\u06F0-\u06F90-9#\/]+$/u;

/** عنوان السكن: عربي، 5–300 حرفاً */
export function isValidArabicAddress(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 5 || t.length > 300) return false;
  if (/[A-Za-z]/.test(t)) return false;
  return AR_ADDRESS_RE.test(t);
}

export function isValidBloodType(s: string): boolean {
  return (BLOOD_TYPES as readonly string[]).includes(s.trim());
}

/** مكان العمل مطلوب، عربي فقط */
export function isValidArabicWorkplace(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 200) return false;
  if (/[A-Za-z]/.test(t) || /[0-9]/.test(t)) return false;
  return AR_TEXT_RE.test(t) && hasArabicLetter(t);
}

/** جوال عراقي: 07 ثم 9 أرقام */
export const IRAQI_MOBILE_RE = /^07\d{9}$/;

export function isValidIraqiMobile(s: string): boolean {
  return IRAQI_MOBILE_RE.test(s.trim());
}

/** بريد جامعي رسمي @shau.edu.iq */
export function isValidShauUniversityEmail(s: string): boolean {
  const t = s.trim().toLowerCase();
  if (!t || t.length > 120) return false;
  return /^[a-z0-9._%+-]+@shau\.edu\.iq$/i.test(t);
}

const AR_INPUT_FILTER =
  /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\u060C\u061B\u061F\u0640.\-،؛()\u0660-\u0669\u06F0-\u06F9]/gu;

/** إزالة أي حرف لا يُسمح به في الحقول العربية أثناء الكتابة */
export function filterArabicFieldInput(v: string): string {
  return v.replace(AR_INPUT_FILTER, "");
}

/** إزالة أي حرف لا يُسمح به في الاسم الإنجليزي */
export function filterEnglishNameInput(v: string): string {
  return v.replace(/[^A-Za-z\s'.-]/g, "");
}

/** أرقام فقط، حتى 11 خانة (07… ) */
export function filterIraqiPhoneInput(v: string): string {
  return v.replace(/\D/g, "").slice(0, 11);
}

/** حروف البريد المعتادة فقط */
export function filterUniversityEmailInput(v: string): string {
  return v.replace(/[^a-zA-Z0-9._%+\-@]/g, "").slice(0, 120);
}
