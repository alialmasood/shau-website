import { query } from "@/lib/db";
import { arabicToCategoryCode, categoryToArabic } from "@/lib/newsCategory";

export type PublicNewsListItem = {
  id: string;
  title: string;
  excerpt: string | null;
  categoryLabel: string;
  publishedAt: string | null; // ISO
  coverImageId: string | null;
  featured: boolean;
};

export type PublicNewsDetails = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  categoryLabel: string;
  publishedAt: string | null; // ISO
  coverImageId: string | null;
};

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function getPublishedNewsPage(params: {
  page: number;
  pageSize: number;
  q?: string | null;
  categoryLabel?: string | null;
}) {
  const page = clampInt(params.page || 1, 1, 10_000);
  const pageSize = clampInt(params.pageSize || 9, 1, 50);
  const q = (params.q ?? "").trim();
  const categoryCode = arabicToCategoryCode(params.categoryLabel ?? null);

  const where: string[] = [`is_published = true`];
  const values: any[] = [];
  let idx = 1;

  if (q) {
    where.push(`(title ILIKE $${idx} OR excerpt ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }

  if (categoryCode) {
    where.push(`category = $${idx}::"NewsCategory"`);
    values.push(categoryCode);
    idx++;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const totalRes = await query(
    `SELECT COUNT(*)::int AS total
     FROM news
     ${whereSql}`,
    values
  );
  const total = Number(totalRes.rows[0]?.total ?? 0);

  const listRes = await query(
    `SELECT id, title, excerpt, category, publish_date, cover_image_id, featured
     FROM news
     ${whereSql}
     ORDER BY featured DESC, publish_date DESC NULLS LAST, created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, pageSize, offset]
  );

  const items = listRes.rows.map((r) => {
    const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
    return {
      id: String(r.id),
      title: String(r.title),
      excerpt: r.excerpt ? String(r.excerpt) : null,
      categoryLabel: categoryToArabic(r.category ? String(r.category) : null),
      publishedAt,
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      featured: Boolean(r.featured),
    } satisfies PublicNewsListItem;
  });

  return { items, total, page, pageSize };
}

export async function getPublishedNewsList() {
  const res = await query(
    `SELECT id, title, excerpt, category, publish_date, cover_image_id, featured
     FROM news
     WHERE is_published = true
     ORDER BY featured DESC, publish_date DESC NULLS LAST, created_at DESC
     LIMIT 200`
  );

  return res.rows.map((r) => {
    const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
    return {
      id: String(r.id),
      title: String(r.title),
      excerpt: r.excerpt ? String(r.excerpt) : null,
      categoryLabel: categoryToArabic(r.category ? String(r.category) : null),
      publishedAt,
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      featured: Boolean(r.featured),
    } satisfies PublicNewsListItem;
  });
}

export async function getLatestPublishedNews(limit: number) {
  const res = await query(
    `SELECT id, title, excerpt, category, publish_date, cover_image_id, featured
     FROM news
     WHERE is_published = true
     ORDER BY featured DESC, publish_date DESC NULLS LAST, created_at DESC
     LIMIT $1`,
    [limit]
  );

  return res.rows.map((r) => {
    const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
    return {
      id: String(r.id),
      title: String(r.title),
      excerpt: r.excerpt ? String(r.excerpt) : null,
      categoryLabel: categoryToArabic(r.category ? String(r.category) : null),
      publishedAt,
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      featured: Boolean(r.featured),
    } satisfies PublicNewsListItem;
  });
}

export async function getPublishedNewsById(id: string) {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT id, title, excerpt, content, category, publish_date, cover_image_id
     FROM news
     WHERE id = $1 AND is_published = true
     LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
  return {
    id: String(r.id),
    title: String(r.title),
    excerpt: r.excerpt ? String(r.excerpt) : null,
    content: String(r.content ?? ""),
    categoryLabel: categoryToArabic(r.category ? String(r.category) : null),
    publishedAt,
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
  } satisfies PublicNewsDetails;
}

export async function getRelatedPublishedNews(params: {
  id: string;
  categoryLabel: string;
  limit: number;
}) {
  // Reverse-map Arabic label to enum code for filtering in DB
  const categoryCode =
    params.categoryLabel === "أخبار إدارية"
      ? "ADMINISTRATIVE"
      : params.categoryLabel === "أخبار علمية"
        ? "SCIENTIFIC"
        : params.categoryLabel === "نشاطات وفعاليات"
          ? "ACTIVITIES"
          : params.categoryLabel === "إعلانات"
            ? "ANNOUNCEMENTS"
            : null;

  const res = await query(
    `SELECT id, title, excerpt, category, publish_date, cover_image_id, featured
     FROM news
     WHERE is_published = true
       AND id <> $1
       AND ($2::"NewsCategory" IS NULL OR category = $2::"NewsCategory")
     ORDER BY publish_date DESC NULLS LAST, created_at DESC
     LIMIT $3`,
    [params.id, categoryCode, params.limit]
  );

  return res.rows.map((r) => {
    const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
    return {
      id: String(r.id),
      title: String(r.title),
      excerpt: r.excerpt ? String(r.excerpt) : null,
      categoryLabel: categoryToArabic(r.category ? String(r.category) : null),
      publishedAt,
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      featured: Boolean(r.featured),
    } satisfies PublicNewsListItem;
  });
}

