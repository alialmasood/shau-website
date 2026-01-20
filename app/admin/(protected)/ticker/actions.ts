"use server";

import { updateTag } from "next/cache";
import { getClient, query } from "@/lib/db";

function toInt(v: unknown, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toText(v: unknown) {
  return String(v ?? "").trim();
}

function toNullableText(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export async function createTickerItem(formData: FormData) {
  const text = toText(formData.get("text"));
  const link = toNullableText(formData.get("link"));
  const isActive = formData.get("isActive") === "on";
  const sortOrderRaw = formData.get("sortOrder");
  const sortOrderProvided = String(sortOrderRaw ?? "").trim() !== "";
  const sortOrder = toInt(sortOrderRaw, 0);

  if (!text) return;

  let finalSort = sortOrder;
  if (!sortOrderProvided) {
    const r = await query(`SELECT COALESCE(MAX(sort_order), 0) AS max FROM ticker_items`);
    finalSort = Number(r.rows[0]?.max ?? 0) + 10;
  }

  await query(
    `INSERT INTO ticker_items (text, link, is_active, sort_order, updated_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [text, link, isActive, finalSort]
  );

  updateTag("ticker");
}

export async function updateTickerItem(formData: FormData) {
  const id = toText(formData.get("id"));
  const text = toText(formData.get("text"));
  const link = toNullableText(formData.get("link"));
  const isActive = formData.get("isActive") === "on";
  const sortOrder = toInt(formData.get("sortOrder"), 0);

  if (!id || !text) return;

  await query(
    `UPDATE ticker_items
     SET text=$2, link=$3, is_active=$4, sort_order=$5, updated_at=NOW()
     WHERE id=$1`,
    [id, text, link, isActive, sortOrder]
  );

  updateTag("ticker");
}

export async function deleteTickerItem(formData: FormData) {
  const id = toText(formData.get("id"));
  if (!id) return;

  await query(`DELETE FROM ticker_items WHERE id=$1`, [id]);
  updateTag("ticker");
}

export async function toggleTickerItem(formData: FormData) {
  const id = toText(formData.get("id"));
  const next = formData.get("next") === "1";
  if (!id) return;

  await query(
    `UPDATE ticker_items SET is_active=$2, updated_at=NOW() WHERE id=$1`,
    [id, next]
  );
  updateTag("ticker");
}

export async function moveTickerItem(formData: FormData) {
  const id = toText(formData.get("id"));
  const dir = toText(formData.get("dir")); // up|down
  if (!id || (dir !== "up" && dir !== "down")) return;

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `SELECT id, sort_order, created_at
       FROM ticker_items
       ORDER BY sort_order ASC, created_at ASC, id ASC`
    );
    const items = res.rows.map((r: any) => ({
      id: String(r.id),
    }));

    const from = items.findIndex((x) => x.id === id);
    if (from === -1) {
      await client.query("ROLLBACK");
      return;
    }

    const to = dir === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= items.length) {
      await client.query("ROLLBACK");
      return;
    }

    // إعادة ترتيب بالقيم 10،20،30... لضمان عدم تكرار sortOrder
    const moved = items.splice(from, 1)[0];
    items.splice(to, 0, moved);

    for (let i = 0; i < items.length; i++) {
      await client.query(
        `UPDATE ticker_items SET sort_order=$2, updated_at=NOW() WHERE id=$1`,
        [items[i].id, (i + 1) * 10]
      );
    }

    await client.query("COMMIT");
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw new Error("فشل تحديث ترتيب الشريط الإخباري");
  } finally {
    client.release();
  }

  updateTag("ticker");
}

