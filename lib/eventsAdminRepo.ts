import type { PoolClient } from "pg";
import { query, getClient } from "@/lib/db";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type AdminEventListItem = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  startsAt: string;
  published: boolean;
  featured: boolean;
  coverImageId: string | null;
  updatedAt: string;
};

export type AdminEventDetails = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
  detailsAr: string;
  detailsEn: string | null;
  startsAt: string;
  endsAt: string | null;
  registrationLabelAr: string | null;
  registrationLabelEn: string | null;
  registrationUrl: string | null;
  published: boolean;
  featured: boolean;
  coverImageId: string | null;
  brochureMediaId: string | null;
  videoUrl: string | null;
  galleryMediaIds: string[];
};

function rowToDetails(r: Record<string, unknown>, galleryIds: string[]): AdminEventDetails {
  return {
    id: String(r.id),
    titleAr: String(r.title_ar),
    titleEn: r.title_en != null ? String(r.title_en) : null,
    excerptAr: r.excerpt_ar != null ? String(r.excerpt_ar) : null,
    excerptEn: r.excerpt_en != null ? String(r.excerpt_en) : null,
    detailsAr: String(r.details_ar ?? ""),
    detailsEn: r.details_en != null ? String(r.details_en) : null,
    startsAt: new Date(r.starts_at as string).toISOString(),
    endsAt: r.ends_at ? new Date(r.ends_at as string).toISOString() : null,
    registrationLabelAr: r.registration_label_ar != null ? String(r.registration_label_ar) : null,
    registrationLabelEn: r.registration_label_en != null ? String(r.registration_label_en) : null,
    registrationUrl: r.registration_url != null ? String(r.registration_url) : null,
    published: Boolean(r.is_published),
    featured: Boolean(r.featured),
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
    brochureMediaId: r.brochure_media_id ? String(r.brochure_media_id) : null,
    videoUrl: r.video_url != null ? String(r.video_url) : null,
    galleryMediaIds: galleryIds,
  };
}

async function loadGalleryIds(eventId: string): Promise<string[]> {
  const res = await query(
    `SELECT media_id FROM event_gallery WHERE event_id = $1 ORDER BY sort_order, id`,
    [eventId]
  );
  return res.rows.map((x) => String(x.media_id));
}

export async function getAdminEventsPage(params: { page: number; pageSize: number; q?: string | null }) {
  const page = clampInt(params.page || 1, 1, 10_000);
  const pageSize = clampInt(params.pageSize || 20, 1, 100);
  const q = (params.q ?? "").trim();

  const where: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (q) {
    where.push(`(e.title_ar ILIKE $${idx} OR e.title_en ILIKE $${idx} OR e.excerpt_ar ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const totalRes = await query(`SELECT COUNT(*)::int AS total FROM events e ${whereSql}`, values);
  const total = Number(totalRes.rows[0]?.total ?? 0);

  const listRes = await query(
    `SELECT e.id, e.title_ar, e.title_en, e.starts_at, e.is_published, e.featured, e.cover_image_id, e.updated_at
     FROM events e
     ${whereSql}
     ORDER BY e.starts_at DESC, e.updated_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, pageSize, offset]
  );

  const items = listRes.rows.map((r) => ({
    id: String(r.id),
    titleAr: String(r.title_ar),
    titleEn: r.title_en != null ? String(r.title_en) : null,
    startsAt: new Date(r.starts_at).toISOString(),
    published: Boolean(r.is_published),
    featured: Boolean(r.featured),
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
    updatedAt: new Date(r.updated_at).toISOString(),
  } satisfies AdminEventListItem));

  return { items, total, page, pageSize };
}

export async function getAdminEventById(id: string): Promise<AdminEventDetails | null> {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT id, title_ar, title_en, excerpt_ar, excerpt_en, details_ar, details_en,
            starts_at, ends_at, registration_label_ar, registration_label_en, registration_url,
            is_published, featured, cover_image_id, brochure_media_id, video_url
     FROM events WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const galleryMediaIds = await loadGalleryIds(id);
  return rowToDetails(res.rows[0] as Record<string, unknown>, galleryMediaIds);
}

export type UpsertEventInput = {
  titleAr: string;
  titleEn: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
  detailsAr: string;
  detailsEn: string | null;
  startsAt: Date;
  endsAt: Date | null;
  registrationLabelAr: string | null;
  registrationLabelEn: string | null;
  registrationUrl: string | null;
  published: boolean;
  featured: boolean;
  coverImageId: string | null;
  brochureMediaId: string | null;
  videoUrl: string | null;
  galleryMediaIds: string[];
};

async function replaceGallery(client: PoolClient, eventId: string, ids: string[]) {
  await client.query(`DELETE FROM event_gallery WHERE event_id = $1`, [eventId]);
  let order = 0;
  for (const mid of ids) {
    if (!isUuid(mid)) continue;
    await client.query(
      `INSERT INTO event_gallery (event_id, media_id, sort_order) VALUES ($1, $2, $3)`,
      [eventId, mid, order++]
    );
  }
}

export async function createEvent(input: UpsertEventInput): Promise<string> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO events (
        title_ar, title_en, excerpt_ar, excerpt_en, details_ar, details_en,
        starts_at, ends_at, registration_label_ar, registration_label_en, registration_url,
        is_published, featured, cover_image_id, brochure_media_id, video_url, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      RETURNING id`,
      [
        input.titleAr,
        input.titleEn,
        input.excerptAr,
        input.excerptEn,
        input.detailsAr,
        input.detailsEn,
        input.startsAt,
        input.endsAt,
        input.registrationLabelAr,
        input.registrationLabelEn,
        input.registrationUrl,
        input.published,
        input.featured,
        input.coverImageId,
        input.brochureMediaId,
        input.videoUrl,
      ]
    );
    const id = String(ins.rows[0].id);
    await replaceGallery(client, id, input.galleryMediaIds);
    await client.query("COMMIT");
    return id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateEvent(id: string, input: UpsertEventInput): Promise<void> {
  if (!isUuid(id)) throw new Error("Invalid id");
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const up = await client.query(
      `UPDATE events SET
        title_ar = $2, title_en = $3, excerpt_ar = $4, excerpt_en = $5,
        details_ar = $6, details_en = $7, starts_at = $8, ends_at = $9,
        registration_label_ar = $10, registration_label_en = $11, registration_url = $12,
        is_published = $13, featured = $14, cover_image_id = $15, brochure_media_id = $16,
        video_url = $17, updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        input.titleAr,
        input.titleEn,
        input.excerptAr,
        input.excerptEn,
        input.detailsAr,
        input.detailsEn,
        input.startsAt,
        input.endsAt,
        input.registrationLabelAr,
        input.registrationLabelEn,
        input.registrationUrl,
        input.published,
        input.featured,
        input.coverImageId,
        input.brochureMediaId,
        input.videoUrl,
      ]
    );
    if (up.rowCount === 0) {
      await client.query("ROLLBACK");
      throw new Error("Not found");
    }
    await replaceGallery(client, id, input.galleryMediaIds);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteEventById(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await query(`DELETE FROM events WHERE id = $1`, [id]);
}
