/**
 * تسميات وحدود وواجهة تسجيل مؤتمر الابتكار — آمن للعميل.
 */

import type {
  IcApplicantRole,
  IcGender,
  IcInnovationField,
  IcPatentStatus,
  IcProjectStage,
} from "./innovationConferenceTypes";
import { IC_EVENT_DATE, IC_IRAQI_GOVERNORATES } from "./innovationConferenceTypes";

export { IC_IRAQI_GOVERNORATES, IC_EVENT_DATE };

export const IC_DRAFT_KEY = "ic2026-register-draft-v1";
export const IC_SUCCESS_KEY = "ic2026-register-success-v1";

export const IC_STEP_LABELS = [
  "بيانات المشارك",
  "بيانات المشروع",
  "الفريق والمرحلة",
  "الملكية الفكرية",
  "المرفقات",
  "المراجعة والإرسال",
] as const;

export const IC_ROLE_LABELS: Record<IcApplicantRole, string> = {
  school_student: "طالب مدرسة",
  university_student: "طالب جامعة / كلية / معهد",
  graduate: "خريج",
  researcher: "باحث",
  independent_innovator: "مبتكر مستقل",
  entrepreneur: "رائد أعمال",
  other: "أخرى",
};

export const IC_GENDER_LABELS: Record<IcGender, string> = {
  male: "ذكر",
  female: "أنثى",
};

export const IC_FIELD_OPTIONS: {
  value: IcInnovationField;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "medical_health",
    title: "الابتكار الطبي والصحي",
    description: "حلول وتقنيات تسهم في تطوير الرعاية الصحية والتشخيص والخدمات الطبية.",
    icon: "health",
  },
  {
    value: "ai_digital",
    title: "الذكاء الاصطناعي والتحول الرقمي",
    description: "تطبيقات وأنظمة ذكية توظف التقنية والبيانات لصناعة حلول أكثر كفاءة.",
    icon: "digital",
  },
  {
    value: "engineering_robotics",
    title: "الهندسة والروبوتات والأتمتة",
    description: "ابتكارات هندسية وروبوتية وأنظمة تحكم وأتمتة قابلة للتطوير والتطبيق.",
    icon: "engineering",
  },
  {
    value: "energy_oil_gas",
    title: "الطاقة والنفط والغاز",
    description: "حلول مبتكرة للطاقة والصناعة النفطية وكفاءة التشغيل والاستدامة.",
    icon: "energy",
  },
  {
    value: "environment_sustainability",
    title: "البيئة والاستدامة",
    description: "أفكار لمعالجة التحديات البيئية والمياه والنفايات وبناء مستقبل أكثر استدامة.",
    icon: "leaf",
  },
  {
    value: "social_services",
    title: "الابتكارات المجتمعية والخدمية",
    description: "حلول مبتكرة لتحسين التعليم والخدمات وجودة الحياة ومعالجة تحديات المجتمع.",
    icon: "people",
  },
  {
    value: "entrepreneurship",
    title: "الابتكار وريادة الأعمال",
    description: "مشاريع ومنتجات وخدمات مبتكرة تمتلك فرصاً للنمو والتحول إلى أعمال ناجحة.",
    icon: "business",
  },
  {
    value: "patents_inventions",
    title: "الاختراعات وبراءات الاختراع",
    description: "اختراعات ونماذج أولية ومشاريع تمتلك قيمة تقنية وإمكانات للتطوير.",
    icon: "patent",
  },
  {
    value: "open_innovation",
    title: "مجال مفتوح للابتكار والإبداع",
    description: "مسار مفتوح للأفكار المختلفة التي تستحق أن ترى النور.",
    icon: "spark",
  },
];

export const IC_STAGE_OPTIONS: { value: IcProjectStage; title: string; description: string }[] = [
  {
    value: "advanced_idea",
    title: "فكرة ابتكارية متقدمة",
    description: "فكرة واضحة ومدروسة جاهزة للتطوير.",
  },
  {
    value: "prototype",
    title: "نموذج أولي",
    description: "نموذج تجريبي يوضح الفكرة عملياً.",
  },
  {
    value: "applicable_solution",
    title: "منتج أو حل قابل للتطبيق",
    description: "حل جاهز أو شبه جاهز للاستخدام.",
  },
  {
    value: "patent_related",
    title: "اختراع مسجل أو قيد التسجيل",
    description: "اختراع بمسار حماية فكرية.",
  },
];

export const IC_PATENT_LABELS: Record<IcPatentStatus, string> = {
  none: "لا توجد",
  pending: "قيد التسجيل",
  registered: "مسجلة",
};

export const IC_FIELD_LIMITS = {
  projectTitle: { min: 5, max: 120 },
  projectSummary: { min: 50, max: 600 },
  problem: { min: 40, max: 800 },
  solution: { min: 40, max: 800 },
  novelty: { min: 40, max: 600 },
  beneficiaries: { min: 10, max: 200 },
  expectedImpact: { min: 40, max: 600 },
  shownBeforeDetails: { min: 20, max: 500 },
  patentNumber: { min: 3, max: 80 },
  videoUrl: { max: 500 },
} as const;

export const IC_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const IC_PDF_ACCEPT = "application/pdf";
export const IC_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IC_MAX_PDF_BYTES = 10 * 1024 * 1024;
export const IC_MAX_IMAGES = 5;

export type IcUploadedFile = {
  mediaId: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type IcTeamMemberForm = {
  fullName: string;
  roleInTeam: string;
  phone: string;
  email: string;
  birthDate: string;
  institutionName: string;
};

export type IcRegisterFormState = {
  applicant: {
    fullName: string;
    birthDate: string;
    gender: "" | IcGender;
    governorate: string;
    phone: string;
    email: string;
    applicantRole: "" | IcApplicantRole;
    institutionName: string;
    stageOrMajor: string;
  };
  project: {
    projectTitle: string;
    innovationField: "" | IcInnovationField;
    projectSummary: string;
    problem: string;
    solution: string;
    novelty: string;
    beneficiaries: string;
    expectedImpact: string;
    projectStage: "" | IcProjectStage;
    videoUrl: string;
  };
  participation: {
    participationType: "individual" | "team";
    teamMembers: IcTeamMemberForm[];
  };
  intellectualProperty: {
    shownBefore: boolean | null;
    shownBeforeDetails: string;
    patentStatus: "" | IcPatentStatus;
    patentNumber: string;
  };
  attachments: {
    images: IcUploadedFile[];
    projectPdf: IcUploadedFile | null;
    patentDocument: IcUploadedFile | null;
  };
  consents: {
    accuracy: boolean;
    ownership: boolean;
    terms: boolean;
    media: boolean;
  };
  website: string;
};

export type IcRegisterDraft = {
  version: 1;
  step: number;
  maxReached: number;
  form: IcRegisterFormState;
  savedAt: string;
};

export type IcSuccessPayload = {
  participationCode: string;
  trackingToken: string;
  projectTitle: string;
  status: string;
  submittedAt: string;
};

export function createEmptyForm(): IcRegisterFormState {
  return {
    applicant: {
      fullName: "",
      birthDate: "",
      gender: "",
      governorate: "",
      phone: "",
      email: "",
      applicantRole: "",
      institutionName: "",
      stageOrMajor: "",
    },
    project: {
      projectTitle: "",
      innovationField: "",
      projectSummary: "",
      problem: "",
      solution: "",
      novelty: "",
      beneficiaries: "",
      expectedImpact: "",
      projectStage: "",
      videoUrl: "",
    },
    participation: {
      participationType: "individual",
      teamMembers: [],
    },
    intellectualProperty: {
      shownBefore: null,
      shownBeforeDetails: "",
      patentStatus: "",
      patentNumber: "",
    },
    attachments: {
      images: [],
      projectPdf: null,
      patentDocument: null,
    },
    consents: {
      accuracy: false,
      ownership: false,
      terms: false,
      media: false,
    },
    website: "",
  };
}

export function emptyTeamMember(): IcTeamMemberForm {
  return {
    fullName: "",
    roleInTeam: "",
    phone: "",
    email: "",
    birthDate: "",
    institutionName: "",
  };
}

export function roleNeedsInstitution(role: string): boolean {
  return role === "school_student" || role === "university_student";
}

export function ageOnEventDate(birthDate: string, eventDate = IC_EVENT_DATE): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  const event = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(event.getTime())) return null;
  let age = event.getFullYear() - birth.getFullYear();
  const md = event.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && event.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function loadDraft(): IcRegisterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IC_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IcRegisterDraft;
    if (parsed?.version !== 1 || !parsed.form) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: IcRegisterDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IC_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IC_DRAFT_KEY);
}

export function saveSuccess(payload: IcSuccessPayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(IC_SUCCESS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadSuccess(): IcSuccessPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(IC_SUCCESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IcSuccessPayload;
  } catch {
    return null;
  }
}

export function clearSuccess(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(IC_SUCCESS_KEY);
}

export function formHasMeaningfulData(form: IcRegisterFormState): boolean {
  const a = form.applicant;
  const p = form.project;
  return Boolean(
    a.fullName.trim() ||
      a.phone.trim() ||
      a.email.trim() ||
      p.projectTitle.trim() ||
      p.projectSummary.trim() ||
      form.attachments.images.length ||
      form.attachments.projectPdf ||
      form.attachments.patentDocument ||
      form.participation.teamMembers.length
  );
}

export function buildRegisterPayload(form: IcRegisterFormState) {
  const attachments: { mediaId: string; kind: string; sortOrder: number }[] = [];
  form.attachments.images.forEach((img, i) => {
    attachments.push({ mediaId: img.mediaId, kind: "project_image", sortOrder: i });
  });
  if (form.attachments.projectPdf) {
    attachments.push({
      mediaId: form.attachments.projectPdf.mediaId,
      kind: "project_pdf",
      sortOrder: attachments.length,
    });
  }
  if (
    (form.intellectualProperty.patentStatus === "pending" ||
      form.intellectualProperty.patentStatus === "registered") &&
    form.attachments.patentDocument
  ) {
    attachments.push({
      mediaId: form.attachments.patentDocument.mediaId,
      kind: "patent_document",
      sortOrder: attachments.length,
    });
  }

  return {
    website: form.website || "",
    applicant: {
      fullName: form.applicant.fullName,
      birthDate: form.applicant.birthDate,
      gender: form.applicant.gender || undefined,
      governorate: form.applicant.governorate,
      phone: form.applicant.phone,
      email: form.applicant.email,
      applicantRole: form.applicant.applicantRole,
      institutionName: form.applicant.institutionName || undefined,
      stageOrMajor: form.applicant.stageOrMajor || undefined,
    },
    project: {
      projectTitle: form.project.projectTitle,
      innovationField: form.project.innovationField,
      projectSummary: form.project.projectSummary,
      problem: form.project.problem,
      solution: form.project.solution,
      novelty: form.project.novelty,
      beneficiaries: form.project.beneficiaries,
      expectedImpact: form.project.expectedImpact,
      projectStage: form.project.projectStage,
      videoUrl: form.project.videoUrl || undefined,
    },
    participation: {
      participationType: form.participation.participationType,
      teamMembers:
        form.participation.participationType === "team"
          ? form.participation.teamMembers.map((m) => ({
              fullName: m.fullName,
              roleInTeam: m.roleInTeam || undefined,
              phone: m.phone || undefined,
              email: m.email || undefined,
              birthDate: m.birthDate || undefined,
              institutionName: m.institutionName || undefined,
            }))
          : [],
    },
    intellectualProperty: {
      shownBefore: Boolean(form.intellectualProperty.shownBefore),
      shownBeforeDetails: form.intellectualProperty.shownBefore
        ? form.intellectualProperty.shownBeforeDetails
        : undefined,
      patentStatus: form.intellectualProperty.patentStatus,
      patentNumber:
        form.intellectualProperty.patentStatus === "none"
          ? undefined
          : form.intellectualProperty.patentNumber || undefined,
    },
    attachments,
    consents: { ...form.consents },
  };
}
