/** أنواع وقيم ثابتة لتسجيل مؤتمر الابتكار 2026 */

export const IC_EDITION_CODE_2026 = "IC-2026" as const;

/** تاريخ انعقاد المؤتمر — لحساب العمر والتحقق */
export const IC_EVENT_DATE = "2026-10-25" as const;

export const IC_IRAQI_GOVERNORATES = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "السليمانية",
  "دهوك",
  "كركوك",
  "الأنبار",
  "ديالى",
  "صلاح الدين",
  "واسط",
  "بابل",
  "كربلاء",
  "النجف",
  "الديوانية",
  "المثنى",
  "ذي قار",
  "ميسان",
  "حلبجة",
] as const;

export const IC_APPLICANT_ROLES = [
  "school_student",
  "university_student",
  "graduate",
  "researcher",
  "independent_innovator",
  "entrepreneur",
  "other",
] as const;
export type IcApplicantRole = (typeof IC_APPLICANT_ROLES)[number];

export const IC_INNOVATION_FIELDS = [
  "medical_health",
  "ai_digital",
  "engineering_robotics",
  "energy_oil_gas",
  "environment_sustainability",
  "social_services",
  "entrepreneurship",
  "patents_inventions",
  "open_innovation",
] as const;
export type IcInnovationField = (typeof IC_INNOVATION_FIELDS)[number];

export const IC_PROJECT_STAGES = [
  "advanced_idea",
  "prototype",
  "applicable_solution",
  "patent_related",
] as const;
export type IcProjectStage = (typeof IC_PROJECT_STAGES)[number];

export const IC_PARTICIPATION_TYPES = ["individual", "team"] as const;
export type IcParticipationType = (typeof IC_PARTICIPATION_TYPES)[number];

export const IC_PATENT_STATUSES = ["none", "pending", "registered"] as const;
export type IcPatentStatus = (typeof IC_PATENT_STATUSES)[number];

export const IC_APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_INFO",
  "SCIENTIFIC_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "FINALIST",
  "WINNER",
  "WITHDRAWN",
] as const;
export type IcApplicationStatus = (typeof IC_APPLICATION_STATUSES)[number];

export const IC_ATTACHMENT_KINDS = [
  "project_image",
  "project_pdf",
  "patent_document",
  "other",
] as const;
export type IcAttachmentKind = (typeof IC_ATTACHMENT_KINDS)[number];

export const IC_GENDERS = ["male", "female"] as const;
export type IcGender = (typeof IC_GENDERS)[number];

export type IcEditionRow = {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string | null;
  eventDate: string;
  isRegistrationOpen: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IcApplicationRow = {
  id: string;
  editionId: string;
  participationCode: string;
  trackingTokenHash: string;
  fullName: string;
  birthDate: string;
  gender: IcGender | null;
  governorate: string;
  phone: string;
  email: string;
  applicantRole: IcApplicantRole;
  institutionName: string | null;
  stageOrMajor: string | null;
  projectTitle: string;
  innovationField: IcInnovationField;
  projectSummary: string;
  problem: string;
  solution: string;
  novelty: string;
  beneficiaries: string;
  expectedImpact: string;
  participationType: IcParticipationType;
  projectStage: IcProjectStage;
  shownBefore: boolean;
  shownBeforeDetails: string | null;
  patentStatus: IcPatentStatus;
  patentNumber: string | null;
  videoUrl: string | null;
  consentAccuracy: boolean;
  consentOwnership: boolean;
  consentTerms: boolean;
  consentMedia: boolean;
  consentedAt: string;
  status: IcApplicationStatus;
  adminNotes: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export type IcTeamMemberInput = {
  fullName: string;
  roleInTeam?: string | null;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  institutionName?: string | null;
  sortOrder?: number;
};

export type IcAttachmentInput = {
  mediaId: string;
  kind: IcAttachmentKind;
  sortOrder?: number;
};

export type IcCreateApplicationInput = {
  editionId: string;
  fullName: string;
  birthDate: string;
  gender?: IcGender | null;
  governorate: string;
  phone: string;
  email: string;
  applicantRole: IcApplicantRole;
  institutionName?: string | null;
  stageOrMajor?: string | null;
  projectTitle: string;
  innovationField: IcInnovationField;
  projectSummary: string;
  problem: string;
  solution: string;
  novelty: string;
  beneficiaries: string;
  expectedImpact: string;
  participationType: IcParticipationType;
  projectStage: IcProjectStage;
  shownBefore: boolean;
  shownBeforeDetails?: string | null;
  patentStatus: IcPatentStatus;
  patentNumber?: string | null;
  videoUrl?: string | null;
  consentAccuracy: boolean;
  consentOwnership: boolean;
  consentTerms: boolean;
  consentMedia: boolean;
  teamMembers?: IcTeamMemberInput[];
  attachments?: IcAttachmentInput[];
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type IcCreateApplicationResult = {
  id: string;
  participationCode: string;
  /** يُعاد مرة واحدة عند الإنشاء — لا يُخزَّن في DB */
  trackingToken: string;
  status: IcApplicationStatus;
  submittedAt: string;
};
