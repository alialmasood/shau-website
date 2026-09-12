/**
 * تحقق خادمي لتسجيل مؤتمر الابتكار 2026.
 * لا يعتمد على تحقق العميل.
 */

import { query } from "./db";
import { IRAQI_MOBILE_RE } from "./staffIdentityRequestValidation";
import type {
  IcApplicantRole,
  IcAttachmentInput,
  IcAttachmentKind,
  IcCreateApplicationInput,
  IcGender,
  IcInnovationField,
  IcParticipationType,
  IcPatentStatus,
  IcProjectStage,
  IcTeamMemberInput,
} from "./innovationConferenceTypes";
import {
  IC_APPLICANT_ROLES,
  IC_EVENT_DATE,
  IC_GENDERS,
  IC_INNOVATION_FIELDS,
  IC_IRAQI_GOVERNORATES,
  IC_PARTICIPATION_TYPES,
  IC_PATENT_STATUSES,
  IC_PROJECT_STAGES,
} from "./innovationConferenceTypes";

export { IC_EVENT_DATE, IC_IRAQI_GOVERNORATES };

const GOVERNORATE_SET = new Set<string>(IC_IRAQI_GOVERNORATES);

export type IcRegisterBody = {
  website?: unknown;
  applicant?: Record<string, unknown>;
  project?: Record<string, unknown>;
  participation?: Record<string, unknown>;
  intellectualProperty?: Record<string, unknown>;
  attachments?: unknown;
  consents?: Record<string, unknown>;
};

export type IcFieldErrors = Record<string, string>;

export type IcValidationOk = {
  ok: true;
  data: IcCreateApplicationInput;
};

export type IcValidationFail = {
  ok: false;
  code: "VALIDATION_ERROR" | "INVALID_ATTACHMENTS" | "HONEYPOT";
  message: string;
  fields?: IcFieldErrors;
};

export type IcValidationResult = IcValidationOk | IcValidationFail;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_MIME = "application/pdf";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function bool(v: unknown): boolean {
  return v === true;
}

function isValidFullName(s: string): boolean {
  if (s.length < 5 || s.length > 120) return false;
  if (/[0-9\u0660-\u0669\u06F0-\u06F9]/.test(s)) return false;
  const hasArabic = /[\u0600-\u06FF]/.test(s);
  const hasLatin = /[A-Za-z]/.test(s);
  if (!hasArabic && !hasLatin) return false;
  if (hasArabic && hasLatin) return false;
  if (hasArabic) {
    return /^[\u0600-\u06FF\u0750-\u077F\s'.\-،]+$/u.test(s);
  }
  return /^[A-Za-z\s'.-]+$/.test(s);
}

function parseDateOnly(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const [y, m, day] = s.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return null;
  return d;
}

function ageOnEventDate(birthDate: string, eventDate = IC_EVENT_DATE): number | null {
  const birth = parseDateOnly(birthDate);
  const event = parseDateOnly(eventDate);
  if (!birth || !event) return null;
  let age = event.getFullYear() - birth.getFullYear();
  const md = event.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && event.getDate() < birth.getDate())) age -= 1;
  return age;
}

function isValidHttpsUrl(s: string): boolean {
  if (!s || s.length > 500) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function isRole(v: string): v is IcApplicantRole {
  return (IC_APPLICANT_ROLES as readonly string[]).includes(v);
}
function isField(v: string): v is IcInnovationField {
  return (IC_INNOVATION_FIELDS as readonly string[]).includes(v);
}
function isStage(v: string): v is IcProjectStage {
  return (IC_PROJECT_STAGES as readonly string[]).includes(v);
}
function isPartType(v: string): v is IcParticipationType {
  return (IC_PARTICIPATION_TYPES as readonly string[]).includes(v);
}
function isPatent(v: string): v is IcPatentStatus {
  return (IC_PATENT_STATUSES as readonly string[]).includes(v);
}
function isGender(v: string): v is IcGender {
  return (IC_GENDERS as readonly string[]).includes(v);
}
function isAttachKind(v: string): v is IcAttachmentKind {
  return v === "project_image" || v === "project_pdf" || v === "patent_document";
}

function lenBetween(s: string, min: number, max: number): boolean {
  return s.length >= min && s.length <= max;
}

type MediaRow = { id: string; mimeType: string; size: number };

async function fetchMediaByIds(ids: string[]): Promise<Map<string, MediaRow>> {
  const unique = [...new Set(ids)];
  const map = new Map<string, MediaRow>();
  if (unique.length === 0) return map;
  const res = await query(
    `SELECT id::text, mime_type, size FROM media WHERE id = ANY($1::uuid[])`,
    [unique]
  );
  for (const r of res.rows) {
    map.set(String(r.id), {
      id: String(r.id),
      mimeType: String(r.mime_type),
      size: Number(r.size),
    });
  }
  return map;
}

export async function validateInnovationConferenceRegistration(
  body: IcRegisterBody,
  editionId: string
): Promise<IcValidationResult> {
  // Honeypot
  const website = str(body.website);
  if (website) {
    return {
      ok: false,
      code: "HONEYPOT",
      message: "تعذر إتمام الطلب.",
    };
  }

  const fields: IcFieldErrors = {};
  const applicant = body.applicant ?? {};
  const project = body.project ?? {};
  const participation = body.participation ?? {};
  const ip = body.intellectualProperty ?? {};
  const consents = body.consents ?? {};

  // --- applicant ---
  const fullName = str(applicant.fullName);
  if (!isValidFullName(fullName)) {
    fields["applicant.fullName"] = "الاسم الكامل غير صالح (5–120 حرفاً بدون أرقام).";
  }

  const birthDate = str(applicant.birthDate);
  const age = ageOnEventDate(birthDate);
  if (!parseDateOnly(birthDate) || !age || age < 10 || age > 80) {
    fields["applicant.birthDate"] =
      "تاريخ الميلاد غير صالح. يجب أن يكون العمر يوم المؤتمر بين 10 و80 سنة.";
  } else {
    const today = new Date();
    const b = parseDateOnly(birthDate)!;
    if (b >= new Date(today.toISOString().slice(0, 10) + "T12:00:00")) {
      fields["applicant.birthDate"] = "تاريخ الميلاد يجب أن يكون في الماضي.";
    }
  }

  let gender: IcGender | null = null;
  const genderRaw = str(applicant.gender);
  if (genderRaw) {
    if (!isGender(genderRaw)) fields["applicant.gender"] = "قيمة الجنس غير معتمدة.";
    else gender = genderRaw;
  }

  const governorate = str(applicant.governorate);
  if (!governorate || !GOVERNORATE_SET.has(governorate)) {
    fields["applicant.governorate"] = "المحافظة مطلوبة ويجب اختيارها من القائمة.";
  }

  const phone = str(applicant.phone).replace(/\D/g, "");
  if (!IRAQI_MOBILE_RE.test(phone)) {
    fields["applicant.phone"] = "رقم الهاتف غير صالح. استخدم صيغة 07XXXXXXXXX.";
  }

  const email = str(applicant.email).toLowerCase();
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    fields["applicant.email"] = "البريد الإلكتروني غير صالح.";
  }

  const applicantRole = str(applicant.applicantRole);
  if (!isRole(applicantRole)) {
    fields["applicant.applicantRole"] = "الصفة غير معتمدة.";
  }

  const institutionName = str(applicant.institutionName) || null;
  const stageOrMajor = str(applicant.stageOrMajor) || null;
  if (applicantRole === "school_student" || applicantRole === "university_student") {
    if (!institutionName || institutionName.length < 2 || institutionName.length > 250) {
      fields["applicant.institutionName"] = "اسم المدرسة/الجامعة/المؤسسة مطلوب.";
    }
    if (!stageOrMajor || stageOrMajor.length < 2 || stageOrMajor.length > 200) {
      fields["applicant.stageOrMajor"] = "المرحلة/التخصص مطلوب لهذه الصفة.";
    }
  } else if (institutionName && institutionName.length > 250) {
    fields["applicant.institutionName"] = "اسم المؤسسة طويل جداً.";
  } else if (stageOrMajor && stageOrMajor.length > 200) {
    fields["applicant.stageOrMajor"] = "المرحلة/التخصص طويل جداً.";
  }

  // --- project ---
  const projectTitle = str(project.projectTitle);
  if (!lenBetween(projectTitle, 5, 120)) {
    fields["project.projectTitle"] = "اسم المشروع يجب أن يكون بين 5 و120 حرفاً.";
  }

  const innovationField = str(project.innovationField);
  if (!isField(innovationField)) {
    fields["project.innovationField"] = "مجال الابتكار غير معتمد.";
  }

  const projectSummary = str(project.projectSummary);
  if (!lenBetween(projectSummary, 50, 600)) {
    fields["project.projectSummary"] = "الوصف المختصر يجب أن يكون بين 50 و600 حرف.";
  }
  const problem = str(project.problem);
  if (!lenBetween(problem, 40, 800)) {
    fields["project.problem"] = "وصف المشكلة يجب أن يكون بين 40 و800 حرف.";
  }
  const solution = str(project.solution);
  if (!lenBetween(solution, 40, 800)) {
    fields["project.solution"] = "وصف الحل يجب أن يكون بين 40 و800 حرف.";
  }
  const novelty = str(project.novelty);
  if (!lenBetween(novelty, 40, 600)) {
    fields["project.novelty"] = "الجانب المبتكر يجب أن يكون بين 40 و600 حرف.";
  }
  const beneficiaries = str(project.beneficiaries);
  if (!lenBetween(beneficiaries, 10, 200)) {
    fields["project.beneficiaries"] = "الفئة المستفيدة يجب أن تكون بين 10 و200 حرف.";
  }
  const expectedImpact = str(project.expectedImpact);
  if (!lenBetween(expectedImpact, 40, 600)) {
    fields["project.expectedImpact"] = "الأثر المتوقع يجب أن يكون بين 40 و600 حرف.";
  }

  const projectStage = str(project.projectStage);
  if (!isStage(projectStage)) {
    fields["project.projectStage"] = "مرحلة المشروع غير معتمدة.";
  }

  let videoUrl: string | null = str(project.videoUrl) || null;
  if (videoUrl && !isValidHttpsUrl(videoUrl)) {
    fields["project.videoUrl"] = "رابط الفيديو يجب أن يكون HTTPS صالحاً وبحد أقصى 500 حرف.";
  }

  // --- participation / team ---
  const participationType = str(participation.participationType);
  if (!isPartType(participationType)) {
    fields["participation.participationType"] = "نوع المشاركة غير معتمد.";
  }

  const rawMembers = Array.isArray(participation.teamMembers)
    ? (participation.teamMembers as Record<string, unknown>[])
    : [];
  const teamMembers: IcTeamMemberInput[] = [];

  if (participationType === "individual") {
    if (rawMembers.length > 0) {
      fields["participation.teamMembers"] = "المشاركة الفردية لا تقبل أعضاء فريق.";
    }
  } else if (participationType === "team") {
    if (rawMembers.length < 1) {
      fields["participation.teamMembers"] = "يجب إضافة عضو واحد على الأقل للفريق.";
    } else if (rawMembers.length > 3) {
      fields["participation.teamMembers"] = "الحد الأقصى لأعضاء الفريق الإضافيين هو 3.";
    }
  }

  const usedEmails = new Set<string>([email]);
  const usedPhones = new Set<string>([phone]);

  rawMembers.forEach((m, idx) => {
    const prefix = `participation.teamMembers.${idx}`;
    const mName = str(m.fullName);
    if (!isValidFullName(mName)) {
      fields[`${prefix}.fullName`] = "اسم العضو غير صالح.";
    }
    const roleInTeam = str(m.roleInTeam) || null;
    if (roleInTeam && roleInTeam.length > 80) {
      fields[`${prefix}.roleInTeam`] = "الدور في الفريق طويل جداً.";
    }
    let mPhone = str(m.phone).replace(/\D/g, "") || null;
    if (mPhone) {
      if (!IRAQI_MOBILE_RE.test(mPhone)) {
        fields[`${prefix}.phone`] = "هاتف العضو غير صالح.";
      } else if (usedPhones.has(mPhone)) {
        fields[`${prefix}.phone`] = "رقم الهاتف مكرر مع القائد أو عضو آخر.";
      } else {
        usedPhones.add(mPhone);
      }
    } else {
      mPhone = null;
    }
    let mEmail = str(m.email).toLowerCase() || null;
    if (mEmail) {
      if (!EMAIL_RE.test(mEmail) || mEmail.length > 200) {
        fields[`${prefix}.email`] = "بريد العضو غير صالح.";
      } else if (usedEmails.has(mEmail)) {
        fields[`${prefix}.email`] = "البريد مكرر مع القائد أو عضو آخر.";
      } else {
        usedEmails.add(mEmail);
      }
    } else {
      mEmail = null;
    }
    const mBirth = str(m.birthDate) || null;
    if (mBirth && !parseDateOnly(mBirth)) {
      fields[`${prefix}.birthDate`] = "تاريخ ميلاد العضو غير صالح.";
    }
    const mInst = str(m.institutionName) || null;
    if (mInst && mInst.length > 120) {
      fields[`${prefix}.institutionName`] = "اسم جهة العضو طويل جداً.";
    }

    teamMembers.push({
      fullName: mName,
      roleInTeam,
      phone: mPhone,
      email: mEmail,
      birthDate: mBirth,
      institutionName: mInst,
      sortOrder: idx,
    });
  });

  // --- IP ---
  const shownBefore = bool(ip.shownBefore);
  let shownBeforeDetails: string | null = str(ip.shownBeforeDetails) || null;
  if (shownBefore) {
    if (!shownBeforeDetails || !lenBetween(shownBeforeDetails, 20, 500)) {
      fields["intellectualProperty.shownBeforeDetails"] =
        "تفاصيل العرض السابق مطلوبة (20–500 حرف).";
    }
  } else {
    shownBeforeDetails = null;
  }

  const patentStatus = str(ip.patentStatus);
  if (!isPatent(patentStatus)) {
    fields["intellectualProperty.patentStatus"] = "حالة البراءة غير معتمدة.";
  }
  let patentNumber: string | null = str(ip.patentNumber) || null;
  if (patentStatus === "none") {
    patentNumber = null;
  } else if (patentStatus === "pending" || patentStatus === "registered") {
    if (!patentNumber || !lenBetween(patentNumber, 3, 80)) {
      fields["intellectualProperty.patentNumber"] = "رقم البراءة/الطلب مطلوب (3–80 حرفاً).";
    }
  }

  // --- consents ---
  const consentAccuracy = bool(consents.accuracy);
  const consentOwnership = bool(consents.ownership);
  const consentTerms = bool(consents.terms);
  const consentMedia = bool(consents.media);
  if (!consentAccuracy || !consentOwnership || !consentTerms || !consentMedia) {
    fields["consents"] = "يجب الموافقة على جميع الإقرارات.";
  }

  // --- attachments ---
  const rawAtt = Array.isArray(body.attachments) ? (body.attachments as Record<string, unknown>[]) : [];
  const attachments: IcAttachmentInput[] = [];
  const mediaIds: string[] = [];

  rawAtt.forEach((a, idx) => {
    const prefix = `attachments.${idx}`;
    const mediaId = str(a.mediaId);
    const kind = str(a.kind);
    if (!UUID_RE.test(mediaId)) {
      fields[`${prefix}.mediaId`] = "معرف الملف غير صالح.";
      return;
    }
    if (!isAttachKind(kind)) {
      fields[`${prefix}.kind`] = "نوع المرفق غير مسموح.";
      return;
    }
    mediaIds.push(mediaId);
    attachments.push({
      mediaId,
      kind,
      sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : idx,
    });
  });

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "يرجى مراجعة البيانات المدخلة.",
      fields,
    };
  }

  const mediaMap = await fetchMediaByIds(mediaIds);
  const attachFields: IcFieldErrors = {};

  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const m = mediaMap.get(a.mediaId);
    if (!m) {
      attachFields[`attachments.${i}.mediaId`] = "الملف غير موجود.";
      continue;
    }
    if (a.kind === "project_image") {
      if (!IMAGE_MIME.has(m.mimeType) || m.size > MAX_IMAGE_BYTES) {
        attachFields[`attachments.${i}`] = "صورة المشروع غير صالحة أو تتجاوز 5MB.";
      }
    } else if (a.kind === "project_pdf" || a.kind === "patent_document") {
      if (m.mimeType !== PDF_MIME || m.size > MAX_PDF_BYTES) {
        attachFields[`attachments.${i}`] = "ملف PDF غير صالح أو يتجاوز 10MB.";
      }
    }
  }

  const images = attachments.filter((a) => a.kind === "project_image");
  const pdfs = attachments.filter((a) => a.kind === "project_pdf");
  const patents = attachments.filter((a) => a.kind === "patent_document");

  if (images.length < 1 || images.length > 5) {
    attachFields["attachments.project_image"] = "يلزم بين صورة واحدة و5 صور للمشروع.";
  }
  if (pdfs.length !== 1) {
    attachFields["attachments.project_pdf"] = "يلزم ملف PDF واحد للمشروع.";
  }
  if (patentStatus === "none") {
    if (patents.length > 0) {
      attachFields["attachments.patent_document"] =
        "لا يُقبل مستند براءة عندما تكون حالة البراءة: لا توجد.";
    }
  } else if (patents.length !== 1) {
    attachFields["attachments.patent_document"] = "يلزم مستند براءة واحد (PDF).";
  }

  // منع تكرار mediaId
  if (new Set(mediaIds).size !== mediaIds.length) {
    attachFields["attachments"] = "لا يجوز تكرار نفس الملف أكثر من مرة.";
  }

  if (Object.keys(attachFields).length > 0) {
    return {
      ok: false,
      code: "INVALID_ATTACHMENTS",
      message: "المرفقات غير صالحة.",
      fields: attachFields,
    };
  }

  return {
    ok: true,
    data: {
      editionId,
      fullName,
      birthDate,
      gender,
      governorate,
      phone,
      email,
      applicantRole: applicantRole as IcApplicantRole,
      institutionName,
      stageOrMajor,
      projectTitle,
      innovationField: innovationField as IcInnovationField,
      projectSummary,
      problem,
      solution,
      novelty,
      beneficiaries,
      expectedImpact,
      participationType: participationType as IcParticipationType,
      projectStage: projectStage as IcProjectStage,
      shownBefore,
      shownBeforeDetails,
      patentStatus: patentStatus as IcPatentStatus,
      patentNumber,
      videoUrl,
      consentAccuracy,
      consentOwnership,
      consentTerms,
      consentMedia,
      teamMembers: participationType === "team" ? teamMembers : [],
      attachments,
    },
  };
}
