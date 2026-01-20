"use server";

import { updateTag } from "next/cache";
import { query } from "@/lib/db";

function toText(v: unknown) {
  return String(v ?? "").trim();
}

export async function deleteNews(formData: FormData) {
  const id = toText(formData.get("id"));
  if (!id) return;
  await query(`DELETE FROM news WHERE id=$1`, [id]);
  updateTag("news");
}

export async function togglePublishNews(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;

  if (next) {
    // publish: set is_published=true and ensure publish_date exists
    await query(
      `UPDATE news
       SET is_published=true,
           publish_date=COALESCE(publish_date, NOW()),
           updated_at=NOW()
       WHERE id=$1`,
      [id]
    );
  } else {
    await query(
      `UPDATE news
       SET is_published=false,
           updated_at=NOW()
       WHERE id=$1`,
      [id]
    );
  }

  updateTag("news");
}

export async function toggleFeaturedNews(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;

  await query(
    `UPDATE news
     SET featured=$2, updated_at=NOW()
     WHERE id=$1`,
    [id, next]
  );

  updateTag("news");
}

