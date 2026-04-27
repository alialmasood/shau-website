import { randomBytes } from "crypto";
import type { PoolClient } from "pg";
import { query, getClient } from "@/lib/db";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type AdminCeListItem = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  eventStartsAt: string;
  published: boolean;
  featured: boolean;
  showAnnouncement: boolean;
  showRecap: boolean;
  coverImageId: string | null;
  updatedAt: string;
};

export type CeCertificateRow = {
  id: string;
  code: string;
  participantNameAr: string;
  participantNameEn: string | null;
  pdfMediaId: string;
};

export type AdminCeDetails = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
  announcementDetailsAr: string;
  announcementDetailsEn: string | null;
  recapDetailsAr: string | null;
  recapDetailsEn: string | null;
  eventStartsAt: string;
  eventEndsAt: string | null;
  showAnnouncement: boolean;
  showRecap: boolean;
  published: boolean;
  featured: boolean;
  coverImageId: string | null;
  certificatesZipMediaId: string | null;
  gallery: Array<{ mediaId: string; kind: "announcement" | "recap" }>;
  certificates: CeCertificateRow[];
};

function newCertificateCode(): string {
  return `CE-${randomBytes(5).toString("hex").toUpperCase()}`;
}

async function replaceGallery(client: PoolClient, activityId: string, items: Array<{ mediaId: string; kind: "announcement" | "recap" }>) {
  await client.query(`DELETE FROM ce_activity_gallery WHERE activity_id = $1`, [activityId]);
  let order = 0;
  for (const it of items) {
    if (!isUuid(it.mediaId)) continue;
    const kind = it.kind === "recap" ? "recap" : "announcement";
    await client.query(
      `INSERT INTO ce_activity_gallery (activity_id, media_id, sort_order, kind) VALUES ($1, $2, $3, $4)`,
      [activityId, it.mediaId, order++, kind]
    );
  }
}

async function loadGallery(activityId: string): Promise<Array<{ mediaId: string; kind: "announcement" | "recap" }>> {
  const res = await query(
    `SELECT media_id, kind FROM ce_activity_gallery WHERE activity_id = $1 ORDER BY sort_order, id`,
    [activityId]
  );
  return res.rows.map((r) => ({
    mediaId: String(r.media_id),
    kind: String(r.kind) === "recap" ? "recap" : "announcement",
  }));
}

async function loadCertificates(activityId: string): Promise<CeCertificateRow[]> {
  const res = await query(
    `SELECT id, code, participant_name_ar, participant_name_en, pdf_media_id
     FROM ce_certificates WHERE activity_id = $1 ORDER BY created_at DESC`,
    [activityId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    participantNameAr: String(r.participant_name_ar),
    participantNameEn: r.participant_name_en != null ? String(r.participant_name_en) : null,
    pdfMediaId: String(r.pdf_media_id),
  }));
}

function rowToDetails(r: Record<string, unknown>, gallery: AdminCeDetails["gallery"], certs: CeCertificateRow[]): AdminCeDetails {
  return {
    id: String(r.id),
    titleAr: String(r.title_ar),
    titleEn: r.title_en != null ? String(r.title_en) : null,
    excerptAr: r.excerpt_ar != null ? String(r.excerpt_ar) : null,
    excerptEn: r.excerpt_en != null ? String(r.excerpt_en) : null,
    announcementDetailsAr: String(r.announcement_details_ar ?? ""),
    announcementDetailsEn: r.announcement_details_en != null ? String(r.announcement_details_en) : null,
    recapDetailsAr: r.recap_details_ar != null ? String(r.recap_details_ar) : null,
    recapDetailsEn: r.recap_details_en != null ? String(r.recap_details_en) : null,
    eventStartsAt: new Date(r.event_starts_at as string).toISOString(),
    eventEndsAt: r.event_ends_at ? new Date(r.event_ends_at as string).toISOString() : null,
    showAnnouncement: Boolean(r.show_announcement),
    showRecap: Boolean(r.show_recap),
    published: Boolean(r.is_published),
    featured: Boolean(r.featured),
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
    certificatesZipMediaId: r.certificates_zip_media_id ? String(r.certificates_zip_media_id) : null,
    gallery,
    certificates: certs,
  };
}

export async function getAdminCePage(params: { page: number; pageSize: number; q?: string | null }) {
  const page = clampInt(params.page || 1, 1, 10_000);
  const pageSize = clampInt(params.pageSize || 20, 1, 100);
  const q = (params.q ?? "").trim();
  const where: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (q) {
    where.push(`(a.title_ar ILIKE $${idx} OR a.title_en ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const totalRes = await query(`SELECT COUNT(*)::int AS total FROM ce_activities a ${whereSql}`, values);
  const total = Number(totalRes.rows[0]?.total ?? 0);

  const listRes = await query(
    `SELECT a.id, a.title_ar, a.title_en, a.event_starts_at, a.is_published, a.featured,
            a.show_announcement, a.show_recap, a.cover_image_id, a.updated_at
     FROM ce_activities a
     ${whereSql}
     ORDER BY a.event_starts_at DESC, a.updated_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, pageSize, offset]
  );

  const items = listRes.rows.map((r) => ({
    id: String(r.id),
    titleAr: String(r.title_ar),
    titleEn: r.title_en != null ? String(r.title_en) : null,
    eventStartsAt: new Date(r.event_starts_at).toISOString(),
    published: Boolean(r.is_published),
    featured: Boolean(r.featured),
    showAnnouncement: Boolean(r.show_announcement),
    showRecap: Boolean(r.show_recap),
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
    updatedAt: new Date(r.updated_at).toISOString(),
  } satisfies AdminCeListItem));

  return { items, total, page, pageSize };
}

export async function getAdminCeById(id: string): Promise<AdminCeDetails | null> {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT id, title_ar, title_en, excerpt_ar, excerpt_en,
            announcement_details_ar, announcement_details_en,
            recap_details_ar, recap_details_en,
            event_starts_at, event_ends_at, show_announcement, show_recap,
            is_published, featured, cover_image_id, certificates_zip_media_id
     FROM ce_activities WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const gallery = await loadGallery(id);
  const certificates = await loadCertificates(id);
  return rowToDetails(res.rows[0] as Record<string, unknown>, gallery, certificates);
}

export type UpsertCeInput = {
  titleAr: string;
  titleEn: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
  announcementDetailsAr: string;
  announcementDetailsEn: string | null;
  recapDetailsAr: string | null;
  recapDetailsEn: string | null;
  eventStartsAt: Date;
  eventEndsAt: Date | null;
  showAnnouncement: boolean;
  showRecap: boolean;
  published: boolean;
  featured: boolean;
  coverImageId: string | null;
  certificatesZipMediaId: string | null;
  gallery: Array<{ mediaId: string; kind: "announcement" | "recap" }>;
};

export async function createCeActivity(input: UpsertCeInput): Promise<string> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO ce_activities (
        title_ar, title_en, excerpt_ar, excerpt_en,
        announcement_details_ar, announcement_details_en,
        recap_details_ar, recap_details_en,
        event_starts_at, event_ends_at, show_announcement, show_recap,
        is_published, featured, cover_image_id, certificates_zip_media_id, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      RETURNING id`,
      [
        input.titleAr,
        input.titleEn,
        input.excerptAr,
        input.excerptEn,
        input.announcementDetailsAr,
        input.announcementDetailsEn,
        input.recapDetailsAr,
        input.recapDetailsEn,
        input.eventStartsAt,
        input.eventEndsAt,
        input.showAnnouncement,
        input.showRecap,
        input.published,
        input.featured,
        input.coverImageId,
        input.certificatesZipMediaId,
      ]
    );
    const id = String(ins.rows[0].id);
    await replaceGallery(client, id, input.gallery);
    await client.query("COMMIT");
    return id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateCeActivity(id: string, input: UpsertCeInput): Promise<void> {
  if (!isUuid(id)) throw new Error("Invalid id");
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const up = await client.query(
      `UPDATE ce_activities SET
        title_ar=$2, title_en=$3, excerpt_ar=$4, excerpt_en=$5,
        announcement_details_ar=$6, announcement_details_en=$7,
        recap_details_ar=$8, recap_details_en=$9,
        event_starts_at=$10, event_ends_at=$11, show_announcement=$12, show_recap=$13,
        is_published=$14, featured=$15, cover_image_id=$16, certificates_zip_media_id=$17,
        updated_at=NOW()
       WHERE id=$1`,
      [
        id,
        input.titleAr,
        input.titleEn,
        input.excerptAr,
        input.excerptEn,
        input.announcementDetailsAr,
        input.announcementDetailsEn,
        input.recapDetailsAr,
        input.recapDetailsEn,
        input.eventStartsAt,
        input.eventEndsAt,
        input.showAnnouncement,
        input.showRecap,
        input.published,
        input.featured,
        input.coverImageId,
        input.certificatesZipMediaId,
      ]
    );
    if (up.rowCount === 0) {
      await client.query("ROLLBACK");
      throw new Error("Not found");
    }
    await replaceGallery(client, id, input.gallery);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteCeActivity(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await query(`DELETE FROM ce_activities WHERE id = $1`, [id]);
}

export async function insertCertificate(params: {
  activityId: string;
  pdfMediaId: string;
  participantNameAr: string;
  participantNameEn: string | null;
  code?: string | null;
}): Promise<{ id: string; code: string }> {
  if (!isUuid(params.activityId) || !isUuid(params.pdfMediaId)) throw new Error("Invalid ids");
  let code = (params.code ?? "").trim().toUpperCase() || newCertificateCode();
  for (let i = 0; i < 15; i++) {
    try {
      const res = await query(
        `INSERT INTO ce_certificates (activity_id, code, participant_name_ar, participant_name_en, pdf_media_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, code`,
        [params.activityId, code, params.participantNameAr, params.participantNameEn, params.pdfMediaId]
      );
      return { id: String(res.rows[0].id), code: String(res.rows[0].code) };
    } catch {
      code = newCertificateCode();
    }
  }
  throw new Error("Could not allocate certificate code");
}

export async function deleteCertificateById(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await query(`DELETE FROM ce_certificates WHERE id = $1`, [id]);
}
