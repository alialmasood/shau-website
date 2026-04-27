import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";

export type CeGalleryItem = { mediaId: string; kind: "announcement" | "recap" };

export type PublicCeActivity = {
  id: string;
  title: string;
  excerpt: string | null;
  announcementDetails: string;
  recapDetails: string | null;
  eventStartsAt: string;
  eventEndsAt: string | null;
  showAnnouncement: boolean;
  showRecap: boolean;
  featured: boolean;
  coverImageId: string | null;
  certificatesZipMediaId: string | null;
  galleryAnnouncement: string[];
  galleryRecap: string[];
};

function parseUuidArray(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  return [];
}

async function fetchPublishedCeFromDb(locale: "ar" | "en"): Promise<PublicCeActivity[]> {
  const res = await query(
    `SELECT
       a.id,
       a.title_ar,
       a.title_en,
       a.excerpt_ar,
       a.excerpt_en,
       a.announcement_details_ar,
       a.announcement_details_en,
       a.recap_details_ar,
       a.recap_details_en,
       a.event_starts_at,
       a.event_ends_at,
       a.show_announcement,
       a.show_recap,
       a.featured,
       a.cover_image_id,
       a.certificates_zip_media_id,
       COALESCE(
         (SELECT array_agg(media_id ORDER BY sort_order, id)
          FROM ce_activity_gallery g WHERE g.activity_id = a.id AND g.kind = 'announcement'),
         ARRAY[]::uuid[]
       ) AS g_ann,
       COALESCE(
         (SELECT array_agg(media_id ORDER BY sort_order, id)
          FROM ce_activity_gallery g WHERE g.activity_id = a.id AND g.kind = 'recap'),
         ARRAY[]::uuid[]
       ) AS g_rec
     FROM ce_activities a
     WHERE a.is_published = true
       AND (a.show_announcement = true OR a.show_recap = true)
     ORDER BY a.featured DESC, a.event_starts_at DESC, a.updated_at DESC`,
    []
  );

  const isEn = locale === "en";
  return res.rows.map((r) => {
    const title = isEn ? String(r.title_en || r.title_ar) : String(r.title_ar);
    const excerpt = isEn
      ? r.excerpt_en != null
        ? String(r.excerpt_en)
        : r.excerpt_ar != null
          ? String(r.excerpt_ar)
          : null
      : r.excerpt_ar != null
        ? String(r.excerpt_ar)
        : r.excerpt_en != null
          ? String(r.excerpt_en)
          : null;
    const announcementDetails = isEn
      ? String(r.announcement_details_en || r.announcement_details_ar || "")
      : String(r.announcement_details_ar || r.announcement_details_en || "");
    const recapDetails =
      r.recap_details_ar != null || r.recap_details_en != null
        ? isEn
          ? String(r.recap_details_en || r.recap_details_ar || "")
          : String(r.recap_details_ar || r.recap_details_en || "")
        : null;

    return {
      id: String(r.id),
      title,
      excerpt,
      announcementDetails,
      recapDetails,
      eventStartsAt: new Date(r.event_starts_at).toISOString(),
      eventEndsAt: r.event_ends_at ? new Date(r.event_ends_at).toISOString() : null,
      showAnnouncement: Boolean(r.show_announcement),
      showRecap: Boolean(r.show_recap),
      featured: Boolean(r.featured),
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      certificatesZipMediaId: r.certificates_zip_media_id ? String(r.certificates_zip_media_id) : null,
      galleryAnnouncement: parseUuidArray(r.g_ann),
      galleryRecap: parseUuidArray(r.g_rec),
    } satisfies PublicCeActivity;
  });
}

export async function getPublishedCeActivities(locale: "ar" | "en"): Promise<PublicCeActivity[]> {
  return unstable_cache(
    async () => fetchPublishedCeFromDb(locale),
    ["ce-published", locale],
    { tags: ["continuing-education"] }
  )();
}
