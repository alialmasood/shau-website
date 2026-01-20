import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "") // keep unicode letters/numbers/dash
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "news";
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const check = await query(
      `SELECT 1 FROM news WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    if (check.rows.length === 0) return slug;
    slug = `${base}-${i + 2}`;
  }
  // fallback
  return `${base}-${Date.now()}`;
}

type CreateNewsBody = {
  title: string;
  excerpt?: string | null;
  content: string;
  category?: "ADMINISTRATIVE" | "SCIENTIFIC" | "ACTIVITIES" | "ANNOUNCEMENTS" | null;
  published?: boolean;
  featured?: boolean;
  publishedAt?: string | null; // ISO string
  coverImageId?: string | null;
  secondaryImageId?: string | null;
  secondaryImage2Id?: string | null;
};

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateNewsBody;
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const excerpt = body?.excerpt ? String(body.excerpt).trim() : null;
  const category = body?.category ?? null;
  const published = Boolean(body?.published);
  const featured = Boolean(body?.featured);
  const coverImageId = body?.coverImageId ? String(body.coverImageId) : null;
  const secondaryImageId = body?.secondaryImageId ? String(body.secondaryImageId) : null;
  const secondaryImage2Id = body?.secondaryImage2Id ? String(body.secondaryImage2Id) : null;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Missing title or content" },
      { status: 400 }
    );
  }

  if (
    category !== null &&
    category !== "ADMINISTRATIVE" &&
    category !== "SCIENTIFIC" &&
    category !== "ACTIVITIES" &&
    category !== "ANNOUNCEMENTS"
  ) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (coverImageId && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }
  if (secondaryImageId && !isUuid(secondaryImageId)) {
    return NextResponse.json({ error: "Invalid secondaryImageId" }, { status: 400 });
  }
  if (secondaryImage2Id && !isUuid(secondaryImage2Id)) {
    return NextResponse.json(
      { error: "Invalid secondaryImage2Id" },
      { status: 400 }
    );
  }

  const base = slugify(title);
  const slug = await ensureUniqueSlug(base);

  const publishedAt =
    published
      ? body?.publishedAt
        ? new Date(body.publishedAt)
        : new Date()
      : null;

  const res = await query(
    `INSERT INTO news
      (title, slug, excerpt, content, category, is_published, publish_date, featured, cover_image_id, secondary_image_id, secondary_image2_id, updated_at)
     VALUES
      ($1, $2, $3, $4, $5::"NewsCategory", $6, $7, $8, $9, $10, $11, NOW())
     RETURNING id`,
    [
      title,
      slug,
      excerpt,
      content,
      category,
      published,
      publishedAt,
      featured,
      coverImageId,
      secondaryImageId,
      secondaryImage2Id,
    ]
  );

  const id = String(res.rows[0].id);
  return NextResponse.json({ id, slug }, { status: 201 });
}

