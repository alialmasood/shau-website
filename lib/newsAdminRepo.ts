import { query } from "@/lib/db";
import { categoryToArabic, type NewsCategoryCode } from "@/lib/newsCategory";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type AdminNewsListItem = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  categoryLabel: string;
  categoryCode: NewsCategoryCode | null;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminNewsDetails = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  categoryCode: NewsCategoryCode | null;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  coverImageId: string | null;
  secondaryImageId: string | null;
  secondaryImage2Id: string | null;
};

export async function getAdminNewsPage(params: {
  page: number;
  pageSize: number;
  q?: string | null;
  category?: NewsCategoryCode | null;
  published?: "all" | "published" | "unpublished";
}) {
  const page = clampInt(params.page || 1, 1, 10_000);
  const pageSize = clampInt(params.pageSize || 20, 1, 100);
  const q = (params.q ?? "").trim();
  const category = params.category ?? null;
  const published = params.published ?? "all";

  const where: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (q) {
    where.push(`(title ILIKE $${idx} OR excerpt ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }

  if (category) {
    where.push(`category = $${idx}::"NewsCategory"`);
    values.push(category);
    idx++;
  }

  if (published === "published") {
    where.push(`is_published = true`);
  } else if (published === "unpublished") {
    where.push(`is_published = false`);
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
    `SELECT id, title, slug, excerpt, category, is_published, publish_date, featured, cover_image_id, created_at, updated_at
     FROM news
     ${whereSql}
     ORDER BY updated_at DESC, created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, pageSize, offset]
  );

  const items = listRes.rows.map((r) => {
    const code = r.category ? (String(r.category) as NewsCategoryCode) : null;
    const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
    return {
      id: String(r.id),
      title: String(r.title),
      slug: r.slug ? String(r.slug) : null,
      excerpt: r.excerpt ? String(r.excerpt) : null,
      categoryLabel: categoryToArabic(code),
      categoryCode: code,
      published: Boolean(r.is_published),
      publishedAt,
      featured: Boolean(r.featured),
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    } satisfies AdminNewsListItem;
  });

  return { items, total, page, pageSize };
}

export async function getAdminNewsById(id: string): Promise<AdminNewsDetails | null> {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT id, title, slug, excerpt, content, category, is_published, publish_date, featured, cover_image_id, secondary_image_id, secondary_image2_id
     FROM news
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  const code = r.category ? (String(r.category) as NewsCategoryCode) : null;
  const publishedAt = r.publish_date ? new Date(r.publish_date).toISOString() : null;
  return {
    id: String(r.id),
    title: String(r.title),
    slug: r.slug ? String(r.slug) : null,
    excerpt: r.excerpt ? String(r.excerpt) : null,
    content: String(r.content ?? ""),
    categoryCode: code,
    published: Boolean(r.is_published),
    publishedAt,
    featured: Boolean(r.featured),
    coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
    secondaryImageId: r.secondary_image_id ? String(r.secondary_image_id) : null,
    secondaryImage2Id: r.secondary_image2_id ? String(r.secondary_image2_id) : null,
  };
}

