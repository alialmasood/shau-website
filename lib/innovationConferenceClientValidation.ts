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

export type IcValidationLocale = "ar" | "en";

type IcValidationMessages = {
  fullNameInvalid: string;
  birthDateInvalid: string;
  birthDateNotPast: string;
  genderInvalid: string;
  governorateRequired: string;
  phoneInvalid: string;
  emailInvalid: string;
  roleInvalid: string;
  institutionRequired: string;
  stageOrMajorRequired: string;
  institutionTooLong: string;
  stageOrMajorTooLong: string;
  projectTitleRange: (min: number, max: number) => string;
  innovationFieldRequired: string;
  projectSummaryRange: (min: number, max: number) => string;
  problemRange: (min: number, max: number) => string;
  solutionRange: (min: number, max: number) => string;
  noveltyRange: (min: number, max: number) => string;
  beneficiariesRange: (min: number, max: number) => string;
  expectedImpactRange: (min: number, max: number) => string;
  participationTypeRequired: string;
  projectStageRequired: string;
  individualNoMembers: string;
  teamMinOne: string;
  teamMaxThree: string;
  memberNameInvalid: string;
  memberRoleTooLong: string;
  memberPhoneInvalid: string;
  memberPhoneDuplicate: string;
  memberEmailInvalid: string;
  memberEmailDuplicate: string;
  memberBirthDateInvalid: string;
  memberInstitutionTooLong: string;
  shownBeforeRequired: string;
  shownBeforeDetailsRange: (min: number, max: number) => string;
  patentStatusRequired: string;
  patentNumberRequired: (min: number, max: number) => string;
  imagesRange: string;
  projectPdfRequired: string;
  patentDocumentRequired: string;
  videoUrlInvalid: string;
  consentsRequired: string;
  genericFieldInvalid: string;
};

const IC_VALIDATION_MESSAGES: Record<IcValidationLocale, IcValidationMessages> = {
  ar: {
    fullNameInvalid: "الاسم الكامل غير صالح (5–120 حرفاً بدون أرقام).",
    birthDateInvalid: "تاريخ الميلاد غير صالح. يجب أن يكون العمر يوم المؤتمر بين 10 و80 سنة.",
    birthDateNotPast: "تاريخ الميلاد يجب أن يكون في الماضي.",
    genderInvalid: "قيمة الجنس غير معتمدة.",
    governorateRequired: "المحافظة مطلوبة ويجب اختيارها من القائمة.",
    phoneInvalid: "رقم الهاتف غير صالح. استخدم صيغة 07XXXXXXXXX.",
    emailInvalid: "البريد الإلكتروني غير صالح.",
    roleInvalid: "الصفة غير معتمدة.",
    institutionRequired: "اسم المدرسة/الجامعة/المؤسسة مطلوب.",
    stageOrMajorRequired: "المرحلة/التخصص مطلوب لهذه الصفة.",
    institutionTooLong: "اسم المؤسسة طويل جداً.",
    stageOrMajorTooLong: "المرحلة/التخصص طويل جداً.",
    projectTitleRange: (min, max) => `اسم المشروع يجب أن يكون بين ${min} و${max} حرفاً.`,
    innovationFieldRequired: "اختر مجال الابتكار.",
    projectSummaryRange: (min, max) => `الوصف المختصر يجب أن يكون بين ${min} و${max} حرف.`,
    problemRange: (min, max) => `وصف المشكلة يجب أن يكون بين ${min} و${max} حرف.`,
    solutionRange: (min, max) => `وصف الحل يجب أن يكون بين ${min} و${max} حرف.`,
    noveltyRange: (min, max) => `الجانب المبتكر يجب أن يكون بين ${min} و${max} حرف.`,
    beneficiariesRange: (min, max) => `الفئة المستفيدة يجب أن تكون بين ${min} و${max} حرف.`,
    expectedImpactRange: (min, max) => `الأثر المتوقع يجب أن يكون بين ${min} و${max} حرف.`,
    participationTypeRequired: "اختر نوع المشاركة.",
    projectStageRequired: "اختر مرحلة المشروع.",
    individualNoMembers: "المشاركة الفردية لا تقبل أعضاء فريق.",
    teamMinOne: "يجب إضافة عضو واحد على الأقل للفريق.",
    teamMaxThree: "الحد الأقصى لأعضاء الفريق الإضافيين هو 3.",
    memberNameInvalid: "اسم العضو غير صالح.",
    memberRoleTooLong: "الدور في الفريق طويل جداً.",
    memberPhoneInvalid: "هاتف العضو غير صالح.",
    memberPhoneDuplicate: "رقم الهاتف مكرر مع القائد أو عضو آخر.",
    memberEmailInvalid: "بريد العضو غير صالح.",
    memberEmailDuplicate: "البريد مكرر مع القائد أو عضو آخر.",
    memberBirthDateInvalid: "تاريخ ميلاد العضو غير صالح.",
    memberInstitutionTooLong: "اسم جهة العضو طويل جداً.",
    shownBeforeRequired: "حدد ما إذا سبق عرض المشروع.",
    shownBeforeDetailsRange: (min, max) =>
      `تفاصيل العرض السابق مطلوبة (${min}–${max} حرف).`,
    patentStatusRequired: "اختر حالة البراءة.",
    patentNumberRequired: (min, max) => `رقم البراءة/الطلب مطلوب (${min}–${max} حرفاً).`,
    imagesRange: "يلزم بين صورة واحدة و5 صور للمشروع.",
    projectPdfRequired: "يلزم ملف PDF واحد للمشروع.",
    patentDocumentRequired: "يلزم مستند براءة واحد (PDF).",
    videoUrlInvalid: "رابط الفيديو يجب أن يكون HTTPS صالحاً وبحد أقصى 500 حرف.",
    consentsRequired: "يجب الموافقة على جميع الإقرارات.",
    genericFieldInvalid: "يرجى مراجعة هذا الحقل.",
  },
  en: {
    fullNameInvalid: "Full name is invalid (5–120 letters, no digits).",
    birthDateInvalid:
      "Date of birth is invalid. Your age on the conference date must be between 10 and 80 years.",
    birthDateNotPast: "Date of birth must be in the past.",
    genderInvalid: "Gender value is not supported.",
    governorateRequired: "Governorate is required and must be chosen from the list.",
    phoneInvalid: "Phone number is invalid. Use the format 07XXXXXXXXX.",
    emailInvalid: "Email address is invalid.",
    roleInvalid: "Role is not supported.",
    institutionRequired: "School / university / institution name is required.",
    stageOrMajorRequired: "Grade / major is required for this role.",
    institutionTooLong: "Institution name is too long.",
    stageOrMajorTooLong: "Grade / major is too long.",
    projectTitleRange: (min, max) =>
      `Project name must be between ${min} and ${max} characters.`,
    innovationFieldRequired: "Choose an innovation field.",
    projectSummaryRange: (min, max) =>
      `Brief description must be between ${min} and ${max} characters.`,
    problemRange: (min, max) =>
      `Problem description must be between ${min} and ${max} characters.`,
    solutionRange: (min, max) =>
      `Solution description must be between ${min} and ${max} characters.`,
    noveltyRange: (min, max) =>
      `Innovative aspect must be between ${min} and ${max} characters.`,
    beneficiariesRange: (min, max) =>
      `Target beneficiaries must be between ${min} and ${max} characters.`,
    expectedImpactRange: (min, max) =>
      `Expected impact must be between ${min} and ${max} characters.`,
    participationTypeRequired: "Choose a participation type.",
    projectStageRequired: "Choose the project stage.",
    individualNoMembers: "Individual participation cannot include team members.",
    teamMinOne: "Add at least one team member.",
    teamMaxThree: "You can add a maximum of 3 additional team members.",
    memberNameInvalid: "Member name is invalid.",
    memberRoleTooLong: "Role in team is too long.",
    memberPhoneInvalid: "Member phone number is invalid.",
    memberPhoneDuplicate: "This phone number is already used by the leader or another member.",
    memberEmailInvalid: "Member email is invalid.",
    memberEmailDuplicate: "This email is already used by the leader or another member.",
    memberBirthDateInvalid: "Member date of birth is invalid.",
    memberInstitutionTooLong: "Member institution name is too long.",
    shownBeforeRequired: "Specify whether the project has been presented before.",
    shownBeforeDetailsRange: (min, max) =>
      `Details of the previous presentation are required (${min}–${max} characters).`,
    patentStatusRequired: "Choose the patent status.",
    patentNumberRequired: (min, max) =>
      `Patent / application number is required (${min}–${max} characters).`,
    imagesRange: "Between 1 and 5 project images are required.",
    projectPdfRequired: "One project PDF file is required.",
    patentDocumentRequired: "One patent document (PDF) is required.",
    videoUrlInvalid: "The video link must be a valid HTTPS URL of at most 500 characters.",
    consentsRequired: "You must agree to all declarations.",
    genericFieldInvalid: "Please review this field.",
  },
};

export function icValidationMessages(locale: IcValidationLocale): IcValidationMessages {
  return IC_VALIDATION_MESSAGES[locale];
}

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

export function validateStep1(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const a = form.applicant;
  const m = IC_VALIDATION_MESSAGES[locale];

  if (!isValidFullName(a.fullName)) {
    fields["applicant.fullName"] = m.fullNameInvalid;
  }

  const age = ageOnEventDate(a.birthDate);
  if (!parseDateOnly(a.birthDate) || age == null || age < 10 || age > 80) {
    fields["applicant.birthDate"] = m.birthDateInvalid;
  } else {
    const b = parseDateOnly(a.birthDate)!;
    const today = new Date();
    if (b >= new Date(today.toISOString().slice(0, 10) + "T12:00:00")) {
      fields["applicant.birthDate"] = m.birthDateNotPast;
    }
  }

  if (a.gender && !(IC_GENDERS as readonly string[]).includes(a.gender)) {
    fields["applicant.gender"] = m.genderInvalid;
  }

  if (!a.governorate || !GOV_SET.has(a.governorate)) {
    fields["applicant.governorate"] = m.governorateRequired;
  }

  const phone = a.phone.replace(/\D/g, "");
  if (!IRAQI_MOBILE_RE.test(phone)) {
    fields["applicant.phone"] = m.phoneInvalid;
  }

  const email = a.email.trim().toLowerCase();
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    fields["applicant.email"] = m.emailInvalid;
  }

  if (!(IC_APPLICANT_ROLES as readonly string[]).includes(a.applicantRole)) {
    fields["applicant.applicantRole"] = m.roleInvalid;
  }

  const inst = a.institutionName.trim();
  const stage = a.stageOrMajor.trim();
  if (roleNeedsInstitution(a.applicantRole)) {
    if (!inst || inst.length < 2 || inst.length > 250) {
      fields["applicant.institutionName"] = m.institutionRequired;
    }
    if (!stage || stage.length < 2 || stage.length > 200) {
      fields["applicant.stageOrMajor"] = m.stageOrMajorRequired;
    }
  } else {
    if (inst.length > 250) fields["applicant.institutionName"] = m.institutionTooLong;
    if (stage.length > 200) fields["applicant.stageOrMajor"] = m.stageOrMajorTooLong;
  }

  return fields;
}

export function validateStep2(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const p = form.project;
  const L = IC_FIELD_LIMITS;
  const m = IC_VALIDATION_MESSAGES[locale];

  if (!lenBetween(p.projectTitle.trim(), L.projectTitle.min, L.projectTitle.max)) {
    fields["project.projectTitle"] = m.projectTitleRange(L.projectTitle.min, L.projectTitle.max);
  }
  if (!(IC_INNOVATION_FIELDS as readonly string[]).includes(p.innovationField)) {
    fields["project.innovationField"] = m.innovationFieldRequired;
  }
  if (!lenBetween(p.projectSummary.trim(), L.projectSummary.min, L.projectSummary.max)) {
    fields["project.projectSummary"] = m.projectSummaryRange(
      L.projectSummary.min,
      L.projectSummary.max
    );
  }
  if (!lenBetween(p.problem.trim(), L.problem.min, L.problem.max)) {
    fields["project.problem"] = m.problemRange(L.problem.min, L.problem.max);
  }
  if (!lenBetween(p.solution.trim(), L.solution.min, L.solution.max)) {
    fields["project.solution"] = m.solutionRange(L.solution.min, L.solution.max);
  }
  if (!lenBetween(p.novelty.trim(), L.novelty.min, L.novelty.max)) {
    fields["project.novelty"] = m.noveltyRange(L.novelty.min, L.novelty.max);
  }
  if (!lenBetween(p.beneficiaries.trim(), L.beneficiaries.min, L.beneficiaries.max)) {
    fields["project.beneficiaries"] = m.beneficiariesRange(
      L.beneficiaries.min,
      L.beneficiaries.max
    );
  }
  if (!lenBetween(p.expectedImpact.trim(), L.expectedImpact.min, L.expectedImpact.max)) {
    fields["project.expectedImpact"] = m.expectedImpactRange(
      L.expectedImpact.min,
      L.expectedImpact.max
    );
  }

  return fields;
}

export function validateStep3(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const part = form.participation;
  const m = IC_VALIDATION_MESSAGES[locale];

  if (!(IC_PARTICIPATION_TYPES as readonly string[]).includes(part.participationType)) {
    fields["participation.participationType"] = m.participationTypeRequired;
  }
  if (!(IC_PROJECT_STAGES as readonly string[]).includes(form.project.projectStage)) {
    fields["project.projectStage"] = m.projectStageRequired;
  }

  if (part.participationType === "individual" && part.teamMembers.length > 0) {
    fields["participation.teamMembers"] = m.individualNoMembers;
  }

  if (part.participationType === "team") {
    if (part.teamMembers.length < 1) {
      fields["participation.teamMembers"] = m.teamMinOne;
    } else if (part.teamMembers.length > 3) {
      fields["participation.teamMembers"] = m.teamMaxThree;
    }

    const usedEmails = new Set([form.applicant.email.trim().toLowerCase()].filter(Boolean));
    const usedPhones = new Set([form.applicant.phone.replace(/\D/g, "")].filter(Boolean));

    part.teamMembers.forEach((member, idx) => {
      const prefix = `participation.teamMembers.${idx}`;
      if (!isValidFullName(member.fullName)) {
        fields[`${prefix}.fullName`] = m.memberNameInvalid;
      }
      if (member.roleInTeam.trim().length > 80) {
        fields[`${prefix}.roleInTeam`] = m.memberRoleTooLong;
      }
      const mPhone = member.phone.replace(/\D/g, "");
      if (mPhone) {
        if (!IRAQI_MOBILE_RE.test(mPhone)) {
          fields[`${prefix}.phone`] = m.memberPhoneInvalid;
        } else if (usedPhones.has(mPhone)) {
          fields[`${prefix}.phone`] = m.memberPhoneDuplicate;
        } else usedPhones.add(mPhone);
      }
      const mEmail = member.email.trim().toLowerCase();
      if (mEmail) {
        if (!EMAIL_RE.test(mEmail) || mEmail.length > 200) {
          fields[`${prefix}.email`] = m.memberEmailInvalid;
        } else if (usedEmails.has(mEmail)) {
          fields[`${prefix}.email`] = m.memberEmailDuplicate;
        } else usedEmails.add(mEmail);
      }
      if (member.birthDate && !parseDateOnly(member.birthDate)) {
        fields[`${prefix}.birthDate`] = m.memberBirthDateInvalid;
      }
      if (member.institutionName.trim().length > 120) {
        fields[`${prefix}.institutionName`] = m.memberInstitutionTooLong;
      }
    });
  }

  return fields;
}

export function validateStep4(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const ip = form.intellectualProperty;
  const L = IC_FIELD_LIMITS;
  const m = IC_VALIDATION_MESSAGES[locale];

  if (ip.shownBefore === null) {
    fields["intellectualProperty.shownBefore"] = m.shownBeforeRequired;
  } else if (ip.shownBefore) {
    const d = ip.shownBeforeDetails.trim();
    if (!lenBetween(d, L.shownBeforeDetails.min, L.shownBeforeDetails.max)) {
      fields["intellectualProperty.shownBeforeDetails"] = m.shownBeforeDetailsRange(
        L.shownBeforeDetails.min,
        L.shownBeforeDetails.max
      );
    }
  }

  if (!(IC_PATENT_STATUSES as readonly string[]).includes(ip.patentStatus)) {
    fields["intellectualProperty.patentStatus"] = m.patentStatusRequired;
  } else if (ip.patentStatus === "pending" || ip.patentStatus === "registered") {
    const n = ip.patentNumber.trim();
    if (!lenBetween(n, L.patentNumber.min, L.patentNumber.max)) {
      fields["intellectualProperty.patentNumber"] = m.patentNumberRequired(
        L.patentNumber.min,
        L.patentNumber.max
      );
    }
  }

  return fields;
}

export function validateStep5(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const att = form.attachments;
  const patentStatus = form.intellectualProperty.patentStatus;
  const video = form.project.videoUrl.trim();
  const m = IC_VALIDATION_MESSAGES[locale];

  if (att.images.length < 1 || att.images.length > 5) {
    fields["attachments.project_image"] = m.imagesRange;
  }
  if (!att.projectPdf) {
    fields["attachments.project_pdf"] = m.projectPdfRequired;
  }
  if (patentStatus === "pending" || patentStatus === "registered") {
    if (!att.patentDocument) {
      fields["attachments.patent_document"] = m.patentDocumentRequired;
    }
  }

  if (video && !isValidHttpsUrl(video)) {
    fields["project.videoUrl"] = m.videoUrlInvalid;
  }

  return fields;
}

export function validateStep6(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  const fields: IcClientFieldErrors = {};
  const c = form.consents;
  if (!c.accuracy || !c.ownership || !c.terms || !c.media) {
    fields["consents"] = IC_VALIDATION_MESSAGES[locale].consentsRequired;
  }
  return fields;
}

export function validateStep(
  step: number,
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  switch (step) {
    case 1:
      return validateStep1(form, locale);
    case 2:
      return validateStep2(form, locale);
    case 3:
      return validateStep3(form, locale);
    case 4:
      return validateStep4(form, locale);
    case 5:
      return validateStep5(form, locale);
    case 6:
      return validateStep6(form, locale);
    default:
      return {};
  }
}

export function validateAllSteps(
  form: IcRegisterFormState,
  locale: IcValidationLocale = "ar"
): IcClientFieldErrors {
  return {
    ...validateStep1(form, locale),
    ...validateStep2(form, locale),
    ...validateStep3(form, locale),
    ...validateStep4(form, locale),
    ...validateStep5(form, locale),
    ...validateStep6(form, locale),
  };
}

/**
 * رسائل حقول الخادم تعود بالعربية دائماً. عند لغة واجهة إنجليزية نستبدلها
 * برسالة التحقق الإنجليزية لنفس الحقل، أو برسالة عامة إن لم يغطها تحقق العميل.
 */
export function localizeServerFieldErrors(
  serverFields: Record<string, string>,
  form: IcRegisterFormState,
  locale: IcValidationLocale
): IcClientFieldErrors {
  if (locale === "ar") return { ...serverFields };
  const localErrors = validateAllSteps(form, locale);
  const out: IcClientFieldErrors = {};
  for (const key of Object.keys(serverFields)) {
    out[key] = localErrors[key] ?? IC_VALIDATION_MESSAGES[locale].genericFieldInvalid;
  }
  return out;
}

export function firstErrorKey(errors: IcClientFieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? keys[0]! : null;
}

export { IC_EVENT_DATE };
