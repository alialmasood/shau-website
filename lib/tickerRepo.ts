import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";

export type TickerItemRow = {
  id: string;
  text: string;
  link: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function mapRow(r: any): TickerItemRow {
  return {
    id: String(r.id),
    text: String(r.text),
    link: r.link ? String(r.link) : null,
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

export async function getAllTickerItems() {
  const res = await query(
    `SELECT id, text, link, is_active, sort_order, created_at, updated_at
     FROM ticker_items
     ORDER BY sort_order ASC, created_at ASC, id ASC`
  );
  return res.rows.map(mapRow);
}

async function _getActiveTickerItems() {
  const res = await query(
    `SELECT id, text, link, is_active, sort_order, created_at, updated_at
     FROM ticker_items
     WHERE is_active = true
     ORDER BY sort_order ASC, created_at ASC, id ASC`
  );
  return res.rows.map(mapRow);
}

// يستخدم في الواجهة العامة (NewsTicker) مع إمكانية revalidateTag("ticker")
export const getActiveTickerItems = unstable_cache(_getActiveTickerItems, ["ticker_active_v1"], {
  revalidate: 60,
  tags: ["ticker"],
});

