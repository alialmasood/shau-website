import { query } from "@/lib/db";
import { SOCIAL_PLATFORMS } from "./socialMediaPlatforms";

export { SOCIAL_PLATFORMS };

export type SocialLinkRow = {
  id: string;
  platform: string;
  url: string | null;
  sortOrder: number;
  isActive: boolean;
};

const COLS = "id, platform, url, sort_order, is_active";

function mapRow(r: { [k: string]: unknown }): SocialLinkRow {
  return {
    id: String(r.id),
    platform: String(r.platform),
    url: r.url != null && r.url !== "" ? String(r.url) : null,
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
  };
}

/** للموقع: الروابط النشطة فقط، مرتبة */
export async function getActiveSocialLinks(): Promise<SocialLinkRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM social_links WHERE is_active = true AND url IS NOT NULL AND TRIM(url) != '' ORDER BY sort_order ASC, platform ASC`
  );
  return (res.rows || []).map(mapRow);
}

/** للأدمن: كل السجلات */
export async function getAllSocialLinks(): Promise<SocialLinkRow[]> {
  const res = await query(`SELECT ${COLS} FROM social_links ORDER BY sort_order ASC, platform ASC`);
  return (res.rows || []).map(mapRow);
}

/** حفظ: إدراج أو تحديث حسب المنصة */
export async function upsertSocialLinks(updates: { platform: string; url: string | null }[]): Promise<void> {
  const order: Record<string, number> = {};
  SOCIAL_PLATFORMS.forEach((p, i) => { order[p.key] = i; });
  for (const u of updates) {
    const url = typeof u.url === "string" && u.url.trim() ? u.url.trim() : null;
    const isActive = !!(url && url.length > 0);
    const sortOrder = order[u.platform] ?? 99;
    await query(
      `INSERT INTO social_links (platform, url, is_active, sort_order, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (platform) DO UPDATE SET url = EXCLUDED.url, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order, updated_at = NOW()`,
      [u.platform, url, isActive, sortOrder]
    );
  }
}
