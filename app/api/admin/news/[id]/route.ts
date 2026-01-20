import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "news";
}

async function ensureUniqueSlugExcept(base: string, excludeId: string) {
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const check = await query(
      `SELECT 1 FROM news WHERE slug = $1 AND id <> $2 LIMIT 1`,
      [slug, excludeId]
    );
    if (check.rows.length === 0) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

type UpdateNewsBody = {
  title?: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string;
  category?: "ADMINISTRATIVE" | "SCIENTIFIC" | "ACTIVITIES" | "ANNOUNCEMENTS" | null;
  published?: boolean;
  featured?: boolean;
  publishedAt?: string | null;
  coverImageId?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const body = (await request.json()) as UpdateNewsBody;

  // Fetch current row (for defaults + slug)
  const currentRes = await query(
    `SELECT title, slug, is_published, publish_date
     FROM news
     WHERE id=$1
     LIMIT 1`,
    [id]
  );
  if (currentRes.rows.length === 0) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const current = currentRes.rows[0];

  const title = body.title !== undefined ? String(body.title).trim() : String(current.title);
  const content = body.content !== undefined ? String(body.content).trim() : undefined;
  const excerpt = body.excerpt !== undefined ? (body.excerpt ? String(body.excerpt).trim() : null) : undefined;
  const category = body.category !== undefined ? body.category : undefined;
  const featured = body.featured !== undefined ? Boolean(body.featured) : undefined;
  const coverImageId = body.coverImageId !== undefined ? (body.coverImageId ? String(body.coverImageId) : null) : undefined;

  const published =
    body.published !== undefined ? Boolean(body.published) : Boolean(current.is_published);

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }
  if (content !== undefined && !content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  if (
    category !== undefined &&
    category !== null &&
    category !== "ADMINISTRATIVE" &&
    category !== "SCIENTIFIC" &&
    category !== "ACTIVITIES" &&
    category !== "ANNOUNCEMENTS"
  ) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (coverImageId !== undefined && coverImageId !== null && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }

  // slug: if provided empty/null => auto from title; else keep current if not provided
  let slug: string | null;
  if (body.slug !== undefined) {
    const raw = body.slug === null ? "" : String(body.slug ?? "");
    const base = slugify(raw.trim() || title);
    slug = await ensureUniqueSlugExcept(base, id);
  } else {
    // ensure existing slug if null
    if (!current.slug) {
      const base = slugify(title);
      slug = await ensureUniqueSlugExcept(base, id);
    } else {
      slug = String(current.slug);
    }
  }

  const publishedAt =
    published
      ? body.publishedAt
        ? new Date(body.publishedAt)
        : current.publish_date
          ? new Date(current.publish_date)
          : new Date()
      : null;

  const sets: string[] = [];
  const values: any[] = [];
  let i = 1;

  sets.push(`title=$${i++}`); values.push(title);
  sets.push(`slug=$${i++}`); values.push(slug);
  sets.push(`is_published=$${i++}`); values.push(published);
  sets.push(`publish_date=$${i++}`); values.push(publishedAt);
  sets.push(`updated_at=NOW()`);

  if (excerpt !== undefined) { sets.push(`excerpt=$${i++}`); values.push(excerpt); }
  if (content !== undefined) { sets.push(`content=$${i++}`); values.push(content); }
  if (category !== undefined) { sets.push(`category=$${i++}::"NewsCategory"`); values.push(category); }
  if (featured !== undefined) { sets.push(`featured=$${i++}`); values.push(featured); }
  if (coverImageId !== undefined) { sets.push(`cover_image_id=$${i++}`); values.push(coverImageId); }

  values.push(id);

  await query(
    `UPDATE news SET ${sets.join(", ")} WHERE id=$${i}`,
    values
  );

  return NextResponse.json({ ok: true, id, slug });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  await query(`DELETE FROM news WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}

