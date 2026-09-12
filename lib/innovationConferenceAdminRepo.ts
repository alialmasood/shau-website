/**
 * استعلامات إدارة طلبات مؤتمر الابتكار.
 * لا تستخدم دوال المتابعة العامة ولا تُرجع tracking_token_hash.
 */

import { getClient, query } from "./db";
import type {
  IcApplicantRole,
  IcApplicationStatus,
  IcAttachmentKind,
  IcGender,
  IcInnovationField,
  IcParticipationType,
  IcPatentStatus,
  IcProjectStage,
} from "./innovationConferenceTypes";
import { IC_APPLICATION_STATUSES } from "./innovationConferenceTypes";
import {
  isAllowedStatusTransition,
  isIcApplicationStatus,
} from "./innovationConferenceTransitions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export type IcAdminListItem = {
  id: string;
  participationCode: string;
  projectTitle: string;
  fullName: string;
  innovationField: IcInnovationField;
  participationType: IcParticipationType;
  status: IcApplicationStatus;
  submittedAt: string;
  applicantRole: IcApplicantRole;
};

export type IcAdminListFilters = {
  q?: string | null;
  status?: string | null;
  innovationField?: string | null;
  applicantRole?: string | null;
  participationType?: string | null;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type IcAdminStats = {
  total: number;
  submitted: number;
  underReview: number;
  scientificReview: number;
  accepted: number;
  finalistsAndWinners: number;
};

export type IcAdminTeamMember = {
  id: string;
  fullName: string;
  roleInTeam: string | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  institutionName: string | null;
  sortOrder: number;
};

export type IcAdminAttachment = {
  id: string;
  mediaId: string;
  kind: IcAttachmentKind;
  sortOrder: number;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
};

export type IcAdminStatusLog = {
  id: string;
  fromStatus: IcApplicationStatus | null;
  toStatus: IcApplicationStatus;
  note: string | null;
  createdAt: string;
  adminName: string | null;
  adminEmail: string | null;
};

export type IcAdminApplicationDetail = {
  id: string;
  participationCode: string;
  status: IcApplicationStatus;
  submittedAt: string;
  updatedAt: string;
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
  adminNotes: string | null;
  teamMembers: IcAdminTeamMember[];
  attachments: IcAdminAttachment[];
  statusLogs: IcAdminStatusLog[];
};

export async function getInnovationConferenceAdminStats(): Promise<IcAdminStats> {
  const res = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'SUBMITTED')::int AS submitted,
       COUNT(*) FILTER (WHERE status IN ('UNDER_REVIEW', 'NEEDS_INFO'))::int AS under_review,
       COUNT(*) FILTER (WHERE status = 'SCIENTIFIC_REVIEW')::int AS scientific_review,
       COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int AS accepted,
       COUNT(*) FILTER (WHERE status IN ('FINALIST', 'WINNER'))::int AS finalists_winners
     FROM innovation_conference_applications`
  );
  const r = res.rows[0] || {};
  return {
    total: Number(r.total ?? 0),
    submitted: Number(r.submitted ?? 0),
    underReview: Number(r.under_review ?? 0),
    scientificReview: Number(r.scientific_review ?? 0),
    accepted: Number(r.accepted ?? 0),
    finalistsAndWinners: Number(r.finalists_winners ?? 0),
  };
}

export async function listInnovationConferenceApplications(
  filters: IcAdminListFilters
): Promise<{ items: IcAdminListItem[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const sortAsc = filters.sort === "oldest";

  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  const q = (filters.q ?? "").trim();
  if (q) {
    where.push(
      `(participation_code ILIKE $${i} OR project_title ILIKE $${i} OR full_name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`
    );
    params.push(`%${q}%`);
    i++;
  }

  if (filters.status && isIcApplicationStatus(filters.status)) {
    where.push(`status = $${i}`);
    params.push(filters.status);
    i++;
  }

  if (filters.innovationField) {
    where.push(`innovation_field = $${i}`);
    params.push(filters.innovationField);
    i++;
  }

  if (filters.applicantRole) {
    where.push(`applicant_role = $${i}`);
    params.push(filters.applicantRole);
    i++;
  }

  if (filters.participationType === "individual" || filters.participationType === "team") {
    where.push(`participation_type = $${i}`);
    params.push(filters.participationType);
    i++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql = sortAsc
    ? "ORDER BY submitted_at ASC, id ASC"
    : "ORDER BY submitted_at DESC, id DESC";

  const countRes = await query(
    `SELECT COUNT(*)::int AS c FROM innovation_conference_applications ${whereSql}`,
    params
  );
  const total = Number(countRes.rows[0]?.c ?? 0);

  const listParams = [...params, pageSize, offset];
  const listRes = await query(
    `SELECT
       id::text,
       participation_code,
       project_title,
       full_name,
       innovation_field,
       participation_type,
       status,
       submitted_at,
       applicant_role
     FROM innovation_conference_applications
     ${whereSql}
     ${orderSql}
     LIMIT $${i} OFFSET $${i + 1}`,
    listParams
  );

  const items: IcAdminListItem[] = listRes.rows.map((r) => ({
    id: String(r.id),
    participationCode: String(r.participation_code),
    projectTitle: String(r.project_title),
    fullName: String(r.full_name),
    innovationField: String(r.innovation_field) as IcInnovationField,
    participationType: String(r.participation_type) as IcParticipationType,
    status: String(r.status) as IcApplicationStatus,
    submittedAt: r.submitted_at
      ? new Date(r.submitted_at as string | Date).toISOString()
      : "",
    applicantRole: String(r.applicant_role) as IcApplicantRole,
  }));

  return { items, total };
}

export async function getInnovationConferenceStatusLogs(
  applicationId: string
): Promise<IcAdminStatusLog[]> {
  if (!isUuid(applicationId)) return [];
  const res = await query(
    `SELECT
       l.id::text,
       l.from_status,
       l.to_status,
       l.note,
       l.created_at,
       au.full_name AS admin_name,
       au.email AS admin_email
     FROM innovation_conference_status_logs l
     LEFT JOIN admin_users au ON au.id = l.changed_by_admin_id
     WHERE l.application_id = $1::uuid
     ORDER BY l.created_at ASC, l.id ASC`,
    [applicationId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    fromStatus: r.from_status ? (String(r.from_status) as IcApplicationStatus) : null,
    toStatus: String(r.to_status) as IcApplicationStatus,
    note: r.note != null ? String(r.note) : null,
    createdAt: r.created_at
      ? new Date(r.created_at as string | Date).toISOString()
      : "",
    adminName: r.admin_name != null ? String(r.admin_name) : null,
    adminEmail: r.admin_email != null ? String(r.admin_email) : null,
  }));
}

export async function getInnovationConferenceApplicationAdminDetail(
  id: string
): Promise<IcAdminApplicationDetail | null> {
  if (!isUuid(id)) return null;

  const res = await query(
    `SELECT
       id::text,
       participation_code,
       status,
       submitted_at,
       updated_at,
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
       admin_notes
     FROM innovation_conference_applications
     WHERE id = $1::uuid
     LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0] as Record<string, unknown>;

  const teamRes = await query(
    `SELECT id::text, full_name, role_in_team, phone, email, birth_date::text,
            institution_name, sort_order
     FROM innovation_conference_team_members
     WHERE application_id = $1::uuid
     ORDER BY sort_order ASC, created_at ASC`,
    [id]
  );

  const attRes = await query(
    `SELECT a.id::text, a.media_id::text, a.kind, a.sort_order,
            m.filename, m.mime_type, m.size
     FROM innovation_conference_attachments a
     LEFT JOIN media m ON m.id = a.media_id
     WHERE a.application_id = $1::uuid
     ORDER BY a.sort_order ASC, a.created_at ASC`,
    [id]
  );

  const statusLogs = await getInnovationConferenceStatusLogs(id);

  return {
    id: String(r.id),
    participationCode: String(r.participation_code),
    status: String(r.status) as IcApplicationStatus,
    submittedAt: r.submitted_at
      ? new Date(r.submitted_at as string | Date).toISOString()
      : "",
    updatedAt: r.updated_at
      ? new Date(r.updated_at as string | Date).toISOString()
      : "",
    fullName: String(r.full_name),
    birthDate: String(r.birth_date || ""),
    gender: r.gender ? (String(r.gender) as IcGender) : null,
    governorate: String(r.governorate),
    phone: String(r.phone),
    email: String(r.email),
    applicantRole: String(r.applicant_role) as IcApplicantRole,
    institutionName: r.institution_name != null ? String(r.institution_name) : null,
    stageOrMajor: r.stage_or_major != null ? String(r.stage_or_major) : null,
    projectTitle: String(r.project_title),
    innovationField: String(r.innovation_field) as IcInnovationField,
    projectSummary: String(r.project_summary),
    problem: String(r.problem),
    solution: String(r.solution),
    novelty: String(r.novelty),
    beneficiaries: String(r.beneficiaries),
    expectedImpact: String(r.expected_impact),
    participationType: String(r.participation_type) as IcParticipationType,
    projectStage: String(r.project_stage) as IcProjectStage,
    shownBefore: Boolean(r.shown_before),
    shownBeforeDetails:
      r.shown_before_details != null ? String(r.shown_before_details) : null,
    patentStatus: String(r.patent_status) as IcPatentStatus,
    patentNumber: r.patent_number != null ? String(r.patent_number) : null,
    videoUrl: r.video_url != null ? String(r.video_url) : null,
    consentAccuracy: Boolean(r.consent_accuracy),
    consentOwnership: Boolean(r.consent_ownership),
    consentTerms: Boolean(r.consent_terms),
    consentMedia: Boolean(r.consent_media),
    consentedAt: r.consented_at
      ? new Date(r.consented_at as string | Date).toISOString()
      : "",
    adminNotes: r.admin_notes != null ? String(r.admin_notes) : null,
    teamMembers: teamRes.rows.map((m) => ({
      id: String(m.id),
      fullName: String(m.full_name),
      roleInTeam: m.role_in_team != null ? String(m.role_in_team) : null,
      phone: m.phone != null ? String(m.phone) : null,
      email: m.email != null ? String(m.email) : null,
      birthDate: m.birth_date != null ? String(m.birth_date) : null,
      institutionName: m.institution_name != null ? String(m.institution_name) : null,
      sortOrder: Number(m.sort_order ?? 0),
    })),
    attachments: attRes.rows.map((a) => ({
      id: String(a.id),
      mediaId: String(a.media_id),
      kind: String(a.kind) as IcAttachmentKind,
      sortOrder: Number(a.sort_order ?? 0),
      filename: a.filename != null ? String(a.filename) : null,
      mimeType: a.mime_type != null ? String(a.mime_type) : null,
      size: a.size != null ? Number(a.size) : null,
    })),
    statusLogs,
  };
}

export async function updateInnovationConferenceApplicationStatus(input: {
  applicationId: string;
  toStatus: string;
  note?: string | null;
  adminUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isUuid(input.applicationId) || !isUuid(input.adminUserId)) {
    return { ok: false, error: "معرّف غير صالح." };
  }
  if (!isIcApplicationStatus(input.toStatus)) {
    return { ok: false, error: "حالة غير معتمدة." };
  }
  const note = (input.note ?? "").trim() || null;
  if (note && note.length > 2000) {
    return { ok: false, error: "الملاحظة طويلة جداً." };
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const cur = await client.query(
      `SELECT status FROM innovation_conference_applications WHERE id = $1::uuid FOR UPDATE`,
      [input.applicationId]
    );
    if (cur.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "الطلب غير موجود." };
    }
    const fromStatus = String(cur.rows[0].status) as IcApplicationStatus;
    if (!isAllowedStatusTransition(fromStatus, input.toStatus)) {
      await client.query("ROLLBACK");
      return { ok: false, error: "الانتقال إلى هذه الحالة غير مسموح من الحالة الحالية." };
    }

    await client.query(
      `UPDATE innovation_conference_applications
       SET status = $2, updated_at = NOW()
       WHERE id = $1::uuid`,
      [input.applicationId, input.toStatus]
    );

    await client.query(
      `INSERT INTO innovation_conference_status_logs (
         application_id, from_status, to_status, changed_by_admin_id, note
       ) VALUES ($1::uuid, $2, $3, $4::uuid, $5)`,
      [input.applicationId, fromStatus, input.toStatus, input.adminUserId, note]
    );

    await client.query("COMMIT");
    return { ok: true };
  } catch {
    await client.query("ROLLBACK");
    return { ok: false, error: "تعذر تحديث الحالة." };
  } finally {
    client.release();
  }
}

export async function updateInnovationConferenceAdminNotes(input: {
  applicationId: string;
  adminNotes: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isUuid(input.applicationId)) {
    return { ok: false, error: "معرّف غير صالح." };
  }
  const notes = input.adminNotes.trim();
  if (notes.length > 10000) {
    return { ok: false, error: "الملاحظات طويلة جداً." };
  }

  const res = await query(
    `UPDATE innovation_conference_applications
     SET admin_notes = $2, updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING id`,
    [input.applicationId, notes || null]
  );
  if (res.rows.length === 0) return { ok: false, error: "الطلب غير موجود." };
  return { ok: true };
}

/** يتحقق أن media مرتبط بطلب مؤتمر الابتكار */
export async function isInnovationConferenceAttachmentMedia(
  mediaId: string
): Promise<boolean> {
  if (!isUuid(mediaId)) return false;
  const res = await query(
    `SELECT 1 FROM innovation_conference_attachments WHERE media_id = $1::uuid LIMIT 1`,
    [mediaId]
  );
  return res.rows.length > 0;
}

export { IC_APPLICATION_STATUSES };
