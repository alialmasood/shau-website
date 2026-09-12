import { getClient, query } from "./db";
import {
  generateUniqueParticipationCode,
  generateUniqueTrackingToken,
  hashTrackingToken,
  isValidParticipationCode,
  normalizeTrackingToken,
  verifyTrackingToken,
} from "./innovationConferenceCodes";
import type {
  IcApplicationRow,
  IcApplicationStatus,
  IcAttachmentInput,
  IcAttachmentKind,
  IcCreateApplicationInput,
  IcCreateApplicationResult,
  IcEditionRow,
  IcTeamMemberInput,
} from "./innovationConferenceTypes";
import { IC_EDITION_CODE_2026 } from "./innovationConferenceTypes";

const MAX_TEAM_MEMBERS = 3;

const APP_SELECT = `
  id,
  edition_id,
  participation_code,
  tracking_token_hash,
  full_name,
  birth_date::text,
  gender,
  governorate,
  phone,
  email,
  applicant_role,
  institution_name,
  stage_or_major,
  project_title,
  innovation_field,
  project_summary,
  problem,
  solution,
  novelty,
  beneficiaries,
  expected_impact,
  participation_type,
  project_stage,
  shown_before,
  shown_before_details,
  patent_status,
  patent_number,
  video_url,
  consent_accuracy,
  consent_ownership,
  consent_terms,
  consent_media,
  consented_at,
  status,
  admin_notes,
  submitted_at,
  created_at,
  updated_at,
  ip_address,
  user_agent
`;

function mapEdition(r: Record<string, unknown>): IcEditionRow {
  return {
    id: String(r.id),
    code: String(r.code),
    titleAr: String(r.title_ar),
    titleEn: r.title_en != null ? String(r.title_en) : null,
    eventDate: String(r.event_date).slice(0, 10),
    isRegistrationOpen: Boolean(r.is_registration_open),
    registrationOpensAt: r.registration_opens_at
      ? new Date(r.registration_opens_at as string | Date).toISOString()
      : null,
    registrationClosesAt: r.registration_closes_at
      ? new Date(r.registration_closes_at as string | Date).toISOString()
      : null,
    createdAt: r.created_at ? new Date(r.created_at as string | Date).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string | Date).toISOString() : "",
  };
}

function mapApplication(r: Record<string, unknown>): IcApplicationRow {
  return {
    id: String(r.id),
    editionId: String(r.edition_id),
    participationCode: String(r.participation_code),
    trackingTokenHash: String(r.tracking_token_hash),
    fullName: String(r.full_name),
    birthDate: String(r.birth_date).slice(0, 10),
    gender: r.gender != null ? (String(r.gender) as IcApplicationRow["gender"]) : null,
    governorate: String(r.governorate),
    phone: String(r.phone),
    email: String(r.email),
    applicantRole: String(r.applicant_role) as IcApplicationRow["applicantRole"],
    institutionName: r.institution_name != null ? String(r.institution_name) : null,
    stageOrMajor: r.stage_or_major != null ? String(r.stage_or_major) : null,
    projectTitle: String(r.project_title),
    innovationField: String(r.innovation_field) as IcApplicationRow["innovationField"],
    projectSummary: String(r.project_summary),
    problem: String(r.problem),
    solution: String(r.solution),
    novelty: String(r.novelty),
    beneficiaries: String(r.beneficiaries),
    expectedImpact: String(r.expected_impact),
    participationType: String(r.participation_type) as IcApplicationRow["participationType"],
    projectStage: String(r.project_stage) as IcApplicationRow["projectStage"],
    shownBefore: Boolean(r.shown_before),
    shownBeforeDetails: r.shown_before_details != null ? String(r.shown_before_details) : null,
    patentStatus: String(r.patent_status) as IcApplicationRow["patentStatus"],
    patentNumber: r.patent_number != null ? String(r.patent_number) : null,
    videoUrl: r.video_url != null ? String(r.video_url) : null,
    consentAccuracy: Boolean(r.consent_accuracy),
    consentOwnership: Boolean(r.consent_ownership),
    consentTerms: Boolean(r.consent_terms),
    consentMedia: Boolean(r.consent_media),
    consentedAt: r.consented_at ? new Date(r.consented_at as string | Date).toISOString() : "",
    status: String(r.status) as IcApplicationStatus,
    adminNotes: r.admin_notes != null ? String(r.admin_notes) : null,
    submittedAt: r.submitted_at ? new Date(r.submitted_at as string | Date).toISOString() : "",
    createdAt: r.created_at ? new Date(r.created_at as string | Date).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string | Date).toISOString() : "",
    ipAddress: r.ip_address != null ? String(r.ip_address) : null,
    userAgent: r.user_agent != null ? String(r.user_agent) : null,
  };
}

export async function getEditionByCode(code: string): Promise<IcEditionRow | null> {
  const res = await query(
    `SELECT id, code, title_ar, title_en, event_date::text, is_registration_open,
            registration_opens_at, registration_closes_at, created_at, updated_at
     FROM innovation_conference_editions
     WHERE code = $1
     LIMIT 1`,
    [code]
  );
  if (res.rows.length === 0) return null;
  return mapEdition(res.rows[0] as Record<string, unknown>);
}

export async function getEdition2026(): Promise<IcEditionRow | null> {
  return getEditionByCode(IC_EDITION_CODE_2026);
}

/**
 * يتحقق من فتح التسجيل وفق العلم والتواريخ الاختيارية.
 * لا يرمي إن لم توجد النسخة — يعيد false.
 */
export async function isRegistrationOpen(editionCode = IC_EDITION_CODE_2026): Promise<boolean> {
  const edition = await getEditionByCode(editionCode);
  if (!edition) return false;
  if (!edition.isRegistrationOpen) return false;
  const now = Date.now();
  if (edition.registrationOpensAt) {
    const opens = new Date(edition.registrationOpensAt).getTime();
    if (!Number.isNaN(opens) && now < opens) return false;
  }
  if (edition.registrationClosesAt) {
    const closes = new Date(edition.registrationClosesAt).getTime();
    if (!Number.isNaN(closes) && now > closes) return false;
  }
  return true;
}

export async function getApplicationById(id: string): Promise<IcApplicationRow | null> {
  const res = await query(
    `SELECT ${APP_SELECT} FROM innovation_conference_applications WHERE id = $1::uuid LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  return mapApplication(res.rows[0] as Record<string, unknown>);
}

export async function getApplicationByParticipationCode(
  participationCode: string
): Promise<IcApplicationRow | null> {
  const res = await query(
    `SELECT ${APP_SELECT}
     FROM innovation_conference_applications
     WHERE participation_code = $1
     LIMIT 1`,
    [participationCode.trim()]
  );
  if (res.rows.length === 0) return null;
  return mapApplication(res.rows[0] as Record<string, unknown>);
}

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

async function insertTeamMembers(
  client: Queryable,
  applicationId: string,
  members: IcTeamMemberInput[]
): Promise<void> {
  if (members.length > MAX_TEAM_MEMBERS) {
    throw new Error(`عدد أعضاء الفريق الإضافيين يتجاوز الحد الأقصى (${MAX_TEAM_MEMBERS})`);
  }
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    await client.query(
      `INSERT INTO innovation_conference_team_members (
         application_id, full_name, role_in_team, phone, email, birth_date, institution_name, sort_order
       ) VALUES ($1::uuid, $2, $3, $4, $5, $6::date, $7, $8)`,
      [
        applicationId,
        m.fullName.trim(),
        m.roleInTeam?.trim() || null,
        m.phone?.trim() || null,
        m.email?.trim() || null,
        m.birthDate?.trim() || null,
        m.institutionName?.trim() || null,
        m.sortOrder ?? i,
      ]
    );
  }
}

async function insertAttachments(
  client: Queryable,
  applicationId: string,
  attachments: IcAttachmentInput[]
): Promise<void> {
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    await client.query(
      `INSERT INTO innovation_conference_attachments (
         application_id, media_id, kind, sort_order
       ) VALUES ($1::uuid, $2::uuid, $3, $4)`,
      [applicationId, a.mediaId, a.kind as IcAttachmentKind, a.sortOrder ?? i]
    );
  }
}

async function insertStatusLog(
  client: Queryable,
  applicationId: string,
  toStatus: IcApplicationStatus,
  fromStatus: IcApplicationStatus | null = null,
  changedByAdminId: string | null = null,
  note: string | null = null
): Promise<void> {
  await client.query(
    `INSERT INTO innovation_conference_status_logs (
       application_id, from_status, to_status, changed_by_admin_id, note
     ) VALUES ($1::uuid, $2, $3, $4::uuid, $5)`,
    [applicationId, fromStatus, toStatus, changedByAdminId, note]
  );
}

/** إدراج أعضاء فريق لطلب موجود (للاستخدام المنفصل إن لزم) */
export async function addTeamMembers(
  applicationId: string,
  members: IcTeamMemberInput[]
): Promise<void> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS c FROM innovation_conference_team_members WHERE application_id = $1::uuid`,
      [applicationId]
    );
    const existing = Number(countRes.rows[0]?.c ?? 0);
    if (existing + members.length > MAX_TEAM_MEMBERS) {
      throw new Error(`عدد أعضاء الفريق الإضافيين يتجاوز الحد الأقصى (${MAX_TEAM_MEMBERS})`);
    }
    await insertTeamMembers(client, applicationId, members);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** إدراج مرفقات لطلب موجود */
export async function addAttachments(
  applicationId: string,
  attachments: IcAttachmentInput[]
): Promise<void> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await insertAttachments(client, applicationId, attachments);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** إدراج سجل حالة */
export async function addStatusLog(input: {
  applicationId: string;
  toStatus: IcApplicationStatus;
  fromStatus?: IcApplicationStatus | null;
  changedByAdminId?: string | null;
  note?: string | null;
}): Promise<void> {
  await insertStatusLog(
    { query },
    input.applicationId,
    input.toStatus,
    input.fromStatus ?? null,
    input.changedByAdminId ?? null,
    input.note ?? null
  );
}

/**
 * إنشاء طلب مشاركة مكتمل داخل Transaction واحدة:
 * application + team members + attachments + initial SUBMITTED log
 * يعيد trackingToken مرة واحدة فقط.
 */
export async function createSubmittedApplication(
  input: IcCreateApplicationInput
): Promise<IcCreateApplicationResult> {
  const members = input.teamMembers ?? [];
  const attachments = input.attachments ?? [];

  if (input.participationType === "individual" && members.length > 0) {
    throw new Error("المشاركة الفردية لا تقبل أعضاء فريق إضافيين");
  }
  if (members.length > MAX_TEAM_MEMBERS) {
    throw new Error(`عدد أعضاء الفريق الإضافيين يتجاوز الحد الأقصى (${MAX_TEAM_MEMBERS})`);
  }
  if (
    !input.consentAccuracy ||
    !input.consentOwnership ||
    !input.consentTerms ||
    !input.consentMedia
  ) {
    throw new Error("يجب الموافقة على جميع الإقرارات");
  }

  const participationCode = await generateUniqueParticipationCode();
  const { token: trackingToken, hash: trackingTokenHash } =
    await generateUniqueTrackingToken();

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const insertRes = await client.query(
      `INSERT INTO innovation_conference_applications (
         edition_id,
         participation_code,
         tracking_token_hash,
         full_name,
         birth_date,
         gender,
         governorate,
         phone,
         email,
         applicant_role,
         institution_name,
         stage_or_major,
         project_title,
         innovation_field,
         project_summary,
         problem,
         solution,
         novelty,
         beneficiaries,
         expected_impact,
         participation_type,
         project_stage,
         shown_before,
         shown_before_details,
         patent_status,
         patent_number,
         video_url,
         consent_accuracy,
         consent_ownership,
         consent_terms,
         consent_media,
         consented_at,
         status,
         submitted_at,
         ip_address,
         user_agent
       ) VALUES (
         $1::uuid, $2, $3,
         $4, $5::date, $6, $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16, $17, $18, $19, $20,
         $21, $22,
         $23, $24, $25, $26, $27,
         $28, $29, $30, $31, NOW(),
         'SUBMITTED', NOW(),
         $32, $33
       )
       RETURNING id, status, submitted_at`,
      [
        input.editionId,
        participationCode,
        trackingTokenHash,
        input.fullName.trim(),
        input.birthDate,
        input.gender ?? null,
        input.governorate.trim(),
        input.phone.trim(),
        input.email.trim().toLowerCase(),
        input.applicantRole,
        input.institutionName?.trim() || null,
        input.stageOrMajor?.trim() || null,
        input.projectTitle.trim(),
        input.innovationField,
        input.projectSummary.trim(),
        input.problem.trim(),
        input.solution.trim(),
        input.novelty.trim(),
        input.beneficiaries.trim(),
        input.expectedImpact.trim(),
        input.participationType,
        input.projectStage,
        Boolean(input.shownBefore),
        input.shownBeforeDetails?.trim() || null,
        input.patentStatus,
        input.patentNumber?.trim() || null,
        input.videoUrl?.trim() || null,
        true,
        true,
        true,
        true,
        input.ipAddress?.trim() || null,
        input.userAgent?.trim() || null,
      ]
    );

    const row = insertRes.rows[0] as Record<string, unknown>;
    const applicationId = String(row.id);
    const submittedAt = row.submitted_at
      ? new Date(row.submitted_at as string | Date).toISOString()
      : new Date().toISOString();

    if (members.length > 0) {
      await insertTeamMembers(client, applicationId, members);
    }
    if (attachments.length > 0) {
      await insertAttachments(client, applicationId, attachments);
    }
    await insertStatusLog(client, applicationId, "SUBMITTED", null, null, "تم استلام الطلب");

    await client.query("COMMIT");

    return {
      id: applicationId,
      participationCode,
      trackingToken,
      status: "SUBMITTED",
      submittedAt,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export type IcTrackingPublicView = {
  participationCode: string;
  projectTitle: string;
  status: IcApplicationStatus;
  submittedAt: string;
  updatedAt: string;
};

/**
 * جلب حقول المتابعة العامة فقط + hash للتحقق الداخلي.
 * لا يجلب بيانات شخصية أو مرفقات أو ملاحظات إدارية.
 */
export async function getApplicationTrackingRow(
  participationCode: string
): Promise<(IcTrackingPublicView & { trackingTokenHash: string }) | null> {
  const code = String(participationCode || "")
    .trim()
    .toUpperCase();
  if (!isValidParticipationCode(code)) return null;

  const res = await query(
    `SELECT
       participation_code,
       project_title,
       status,
       submitted_at,
       updated_at,
       tracking_token_hash
     FROM innovation_conference_applications
     WHERE participation_code = $1
     LIMIT 1`,
    [code]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0] as Record<string, unknown>;
  return {
    participationCode: String(r.participation_code),
    projectTitle: String(r.project_title),
    status: String(r.status) as IcApplicationStatus,
    submittedAt: r.submitted_at
      ? new Date(r.submitted_at as string | Date).toISOString()
      : "",
    updatedAt: r.updated_at
      ? new Date(r.updated_at as string | Date).toISOString()
      : "",
    trackingTokenHash: String(r.tracking_token_hash || ""),
  };
}

/**
 * تحقق من رمز المتابعة وإرجاع العرض العام فقط.
 * عند الفشل يعيد null دون تمييز سبب الفشل (enumeration-safe).
 */
export async function verifyAndGetTrackingView(
  participationCode: string,
  trackingToken: string
): Promise<IcTrackingPublicView | null> {
  const code = String(participationCode || "")
    .trim()
    .toUpperCase();
  const token = normalizeTrackingToken(String(trackingToken || ""));
  if (!isValidParticipationCode(code)) return null;
  if (!token) return null;

  const row = await getApplicationTrackingRow(code);
  if (!row) return null;
  if (!verifyTrackingToken(token, row.trackingTokenHash)) return null;

  return {
    participationCode: row.participationCode,
    projectTitle: row.projectTitle,
    status: row.status,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
  };
}

export {
  generateUniqueParticipationCode,
  generateUniqueTrackingToken,
  hashTrackingToken,
  normalizeTrackingToken,
};
