/**
 * تحقق خطوات Wizard تسجيل المؤتمر — آمن للمتصفح (بدون DB).
 */

import { IRAQI_MOBILE_RE } from "./staffIdentityRequestValidation";
import {
  IC_APPLICANT_ROLES,
  IC_GENDERS,
  IC_INNOVATION_FIELDS,
  IC_IRAQI_GOVERNORATES,
  IC_PARTICIPATION_TYPES,
  IC_PATENT_STATUSES,
  IC_PROJECT_STAGES,
  IC_EVENT_DATE,
} from "./innovationConferenceTypes";
import {
  ageOnEventDate,
  IC_FIELD_LIMITS,
  roleNeedsInstitution,
  type IcRegisterFormState,
} from "./innovationConferenceUi";

export type IcClientFieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GOV_SET = new Set<string>(IC_IRAQI_GOVERNORATES);

function isValidFullName(s: string): boolean {
  const t = s.trim();
  if (t.length < 5 || t.length > 120) return false;
  if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false;
  const hasArabic = /[\u0600-\u06FF]/.test(t);
  const hasLatin = /[A-Za-z]/.test(t);
  if (!hasArabic && !hasLatin) return false;
  if (hasArabic && hasLatin) return false;
  if (hasArabic) return /^[\u0600-\u06FF\u0750-\u077F\s'.\-،]+$/u.test(t);
  return /^[A-Za-z\s'.-]+$/.test(t);
}

function parseDateOnly(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const [y, m, day] = s.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null;
  return d;
}

function lenBetween(s: string, min: number, max: number): boolean {
  return s.length >= min && s.length <= max;
}

function isValidHttpsUrl(s: string): boolean {
  if (!s || s.length > 500) return false;
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateStep1(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const a = form.applicant;

  if (!isValidFullName(a.fullName)) {
    fields["applicant.fullName"] = "الاسم الكامل غير صالح (5–120 حرفاً بدون أرقام).";
  }

  const age = ageOnEventDate(a.birthDate);
  if (!parseDateOnly(a.birthDate) || age == null || age < 10 || age > 80) {
    fields["applicant.birthDate"] =
      "تاريخ الميلاد غير صالح. يجب أن يكون العمر يوم المؤتمر بين 10 و80 سنة.";
  } else {
    const b = parseDateOnly(a.birthDate)!;
    const today = new Date();
    if (b >= new Date(today.toISOString().slice(0, 10) + "T12:00:00")) {
      fields["applicant.birthDate"] = "تاريخ الميلاد يجب أن يكون في الماضي.";
    }
  }

  if (a.gender && !(IC_GENDERS as readonly string[]).includes(a.gender)) {
    fields["applicant.gender"] = "قيمة الجنس غير معتمدة.";
  }

  if (!a.governorate || !GOV_SET.has(a.governorate)) {
    fields["applicant.governorate"] = "المحافظة مطلوبة ويجب اختيارها من القائمة.";
  }

  const phone = a.phone.replace(/\D/g, "");
  if (!IRAQI_MOBILE_RE.test(phone)) {
    fields["applicant.phone"] = "رقم الهاتف غير صالح. استخدم صيغة 07XXXXXXXXX.";
  }

  const email = a.email.trim().toLowerCase();
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    fields["applicant.email"] = "البريد الإلكتروني غير صالح.";
  }

  if (!(IC_APPLICANT_ROLES as readonly string[]).includes(a.applicantRole)) {
    fields["applicant.applicantRole"] = "الصفة غير معتمدة.";
  }

  const inst = a.institutionName.trim();
  const stage = a.stageOrMajor.trim();
  if (roleNeedsInstitution(a.applicantRole)) {
    if (!inst || inst.length < 2 || inst.length > 250) {
      fields["applicant.institutionName"] = "اسم المدرسة/الجامعة/المؤسسة مطلوب.";
    }
    if (!stage || stage.length < 2 || stage.length > 200) {
      fields["applicant.stageOrMajor"] = "المرحلة/التخصص مطلوب لهذه الصفة.";
    }
  } else {
    if (inst.length > 250) fields["applicant.institutionName"] = "اسم المؤسسة طويل جداً.";
    if (stage.length > 200) fields["applicant.stageOrMajor"] = "المرحلة/التخصص طويل جداً.";
  }

  return fields;
}

export function validateStep2(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const p = form.project;
  const L = IC_FIELD_LIMITS;

  if (!lenBetween(p.projectTitle.trim(), L.projectTitle.min, L.projectTitle.max)) {
    fields["project.projectTitle"] = `اسم المشروع يجب أن يكون بين ${L.projectTitle.min} و${L.projectTitle.max} حرفاً.`;
  }
  if (!(IC_INNOVATION_FIELDS as readonly string[]).includes(p.innovationField)) {
    fields["project.innovationField"] = "اختر مجال الابتكار.";
  }
  if (!lenBetween(p.projectSummary.trim(), L.projectSummary.min, L.projectSummary.max)) {
    fields["project.projectSummary"] = `الوصف المختصر يجب أن يكون بين ${L.projectSummary.min} و${L.projectSummary.max} حرف.`;
  }
  if (!lenBetween(p.problem.trim(), L.problem.min, L.problem.max)) {
    fields["project.problem"] = `وصف المشكلة يجب أن يكون بين ${L.problem.min} و${L.problem.max} حرف.`;
  }
  if (!lenBetween(p.solution.trim(), L.solution.min, L.solution.max)) {
    fields["project.solution"] = `وصف الحل يجب أن يكون بين ${L.solution.min} و${L.solution.max} حرف.`;
  }
  if (!lenBetween(p.novelty.trim(), L.novelty.min, L.novelty.max)) {
    fields["project.novelty"] = `الجانب المبتكر يجب أن يكون بين ${L.novelty.min} و${L.novelty.max} حرف.`;
  }
  if (!lenBetween(p.beneficiaries.trim(), L.beneficiaries.min, L.beneficiaries.max)) {
    fields["project.beneficiaries"] = `الفئة المستفيدة يجب أن تكون بين ${L.beneficiaries.min} و${L.beneficiaries.max} حرف.`;
  }
  if (!lenBetween(p.expectedImpact.trim(), L.expectedImpact.min, L.expectedImpact.max)) {
    fields["project.expectedImpact"] = `الأثر المتوقع يجب أن يكون بين ${L.expectedImpact.min} و${L.expectedImpact.max} حرف.`;
  }

  return fields;
}

export function validateStep3(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const part = form.participation;

  if (!(IC_PARTICIPATION_TYPES as readonly string[]).includes(part.participationType)) {
    fields["participation.participationType"] = "اختر نوع المشاركة.";
  }
  if (!(IC_PROJECT_STAGES as readonly string[]).includes(form.project.projectStage)) {
    fields["project.projectStage"] = "اختر مرحلة المشروع.";
  }

  if (part.participationType === "individual" && part.teamMembers.length > 0) {
    fields["participation.teamMembers"] = "المشاركة الفردية لا تقبل أعضاء فريق.";
  }

  if (part.participationType === "team") {
    if (part.teamMembers.length < 1) {
      fields["participation.teamMembers"] = "يجب إضافة عضو واحد على الأقل للفريق.";
    } else if (part.teamMembers.length > 3) {
      fields["participation.teamMembers"] = "الحد الأقصى لأعضاء الفريق الإضافيين هو 3.";
    }

    const usedEmails = new Set([form.applicant.email.trim().toLowerCase()].filter(Boolean));
    const usedPhones = new Set([form.applicant.phone.replace(/\D/g, "")].filter(Boolean));

    part.teamMembers.forEach((m, idx) => {
      const prefix = `participation.teamMembers.${idx}`;
      if (!isValidFullName(m.fullName)) {
        fields[`${prefix}.fullName`] = "اسم العضو غير صالح.";
      }
      if (m.roleInTeam.trim().length > 80) {
        fields[`${prefix}.roleInTeam`] = "الدور في الفريق طويل جداً.";
      }
      const mPhone = m.phone.replace(/\D/g, "");
      if (mPhone) {
        if (!IRAQI_MOBILE_RE.test(mPhone)) {
          fields[`${prefix}.phone`] = "هاتف العضو غير صالح.";
        } else if (usedPhones.has(mPhone)) {
          fields[`${prefix}.phone`] = "رقم الهاتف مكرر مع القائد أو عضو آخر.";
        } else usedPhones.add(mPhone);
      }
      const mEmail = m.email.trim().toLowerCase();
      if (mEmail) {
        if (!EMAIL_RE.test(mEmail) || mEmail.length > 200) {
          fields[`${prefix}.email`] = "بريد العضو غير صالح.";
        } else if (usedEmails.has(mEmail)) {
          fields[`${prefix}.email`] = "البريد مكرر مع القائد أو عضو آخر.";
        } else usedEmails.add(mEmail);
      }
      if (m.birthDate && !parseDateOnly(m.birthDate)) {
        fields[`${prefix}.birthDate`] = "تاريخ ميلاد العضو غير صالح.";
      }
      if (m.institutionName.trim().length > 120) {
        fields[`${prefix}.institutionName`] = "اسم جهة العضو طويل جداً.";
      }
    });
  }

  return fields;
}

export function validateStep4(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const ip = form.intellectualProperty;
  const L = IC_FIELD_LIMITS;

  if (ip.shownBefore === null) {
    fields["intellectualProperty.shownBefore"] = "حدد ما إذا سبق عرض المشروع.";
  } else if (ip.shownBefore) {
    const d = ip.shownBeforeDetails.trim();
    if (!lenBetween(d, L.shownBeforeDetails.min, L.shownBeforeDetails.max)) {
      fields["intellectualProperty.shownBeforeDetails"] =
        `تفاصيل العرض السابق مطلوبة (${L.shownBeforeDetails.min}–${L.shownBeforeDetails.max} حرف).`;
    }
  }

  if (!(IC_PATENT_STATUSES as readonly string[]).includes(ip.patentStatus)) {
    fields["intellectualProperty.patentStatus"] = "اختر حالة البراءة.";
  } else if (ip.patentStatus === "pending" || ip.patentStatus === "registered") {
    const n = ip.patentNumber.trim();
    if (!lenBetween(n, L.patentNumber.min, L.patentNumber.max)) {
      fields["intellectualProperty.patentNumber"] = "رقم البراءة/الطلب مطلوب (3–80 حرفاً).";
    }
  }

  return fields;
}

export function validateStep5(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const att = form.attachments;
  const patentStatus = form.intellectualProperty.patentStatus;
  const video = form.project.videoUrl.trim();

  if (att.images.length < 1 || att.images.length > 5) {
    fields["attachments.project_image"] = "يلزم بين صورة واحدة و5 صور للمشروع.";
  }
  if (!att.projectPdf) {
    fields["attachments.project_pdf"] = "يلزم ملف PDF واحد للمشروع.";
  }
  if (patentStatus === "pending" || patentStatus === "registered") {
    if (!att.patentDocument) {
      fields["attachments.patent_document"] = "يلزم مستند براءة واحد (PDF).";
    }
  }

  if (video && !isValidHttpsUrl(video)) {
    fields["project.videoUrl"] = "رابط الفيديو يجب أن يكون HTTPS صالحاً وبحد أقصى 500 حرف.";
  }

  return fields;
}

export function validateStep6(form: IcRegisterFormState): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const c = form.consents;
  if (!c.accuracy || !c.ownership || !c.terms || !c.media) {
    fields["consents"] = "يجب الموافقة على جميع الإقرارات.";
  }
  return fields;
}

export function validateStep(
  step: number,
  form: IcRegisterFormState
): IcClientFieldErrors {
  switch (step) {
    case 1:
      return validateStep1(form);
    case 2:
      return validateStep2(form);
    case 3:
      return validateStep3(form);
    case 4:
      return validateStep4(form);
    case 5:
      return validateStep5(form);
    case 6:
      return validateStep6(form);
    default:
      return {};
  }
}

export function validateAllSteps(form: IcRegisterFormState): IcClientFieldErrors {
  return {
    ...validateStep1(form),
    ...validateStep2(form),
    ...validateStep3(form),
    ...validateStep4(form),
    ...validateStep5(form),
    ...validateStep6(form),
  };
}

export function firstErrorKey(errors: IcClientFieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? keys[0]! : null;
}

export { IC_EVENT_DATE };
