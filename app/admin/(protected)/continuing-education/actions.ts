"use server";

import { query } from "@/lib/db";
import { revalidateContinuingEducation } from "@/lib/ceRevalidate";

function toText(v: unknown) {
  return String(v ?? "").trim();
}

export async function deleteCeActivity(formData: FormData) {
  const id = toText(formData.get("id"));
  if (!id) return;
  await query(`DELETE FROM ce_activities WHERE id=$1`, [id]);
  revalidateContinuingEducation();
}

export async function togglePublishCe(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;
  await query(`UPDATE ce_activities SET is_published = $2, updated_at = NOW() WHERE id = $1`, [id, next]);
  revalidateContinuingEducation();
}

export async function toggleFeaturedCe(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;
  await query(`UPDATE ce_activities SET featured = $2, updated_at = NOW() WHERE id = $1`, [id, next]);
  revalidateContinuingEducation();
}
