"use server";

import { query } from "@/lib/db";
import { revalidatePublicEvents } from "@/lib/eventsRevalidate";

function toText(v: unknown) {
  return String(v ?? "").trim();
}

export async function deleteEvent(formData: FormData) {
  const id = toText(formData.get("id"));
  if (!id) return;
  await query(`DELETE FROM events WHERE id=$1`, [id]);
  revalidatePublicEvents();
}

export async function togglePublishEvent(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;
  await query(
    `UPDATE events SET is_published = $2, updated_at = NOW() WHERE id = $1`,
    [id, next]
  );
  revalidatePublicEvents();
}

export async function toggleFeaturedEvent(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;
  await query(`UPDATE events SET featured = $2, updated_at = NOW() WHERE id = $1`, [id, next]);
  revalidatePublicEvents();
}
