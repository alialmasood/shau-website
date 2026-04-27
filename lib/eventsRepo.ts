import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";

export type PublicEventRow = {
  id: string;
  title: string;
  excerpt: string | null;
  details: string;
  startsAt: string;
  endsAt: string | null;
  coverImageId: string | null;
  galleryImageIds: string[];
  brochureMediaId: string | null;
  brochureFilename: string | null;
  videoUrl: string | null;
  registrationLabel: string | null;
  registrationUrl: string | null;
  featured: boolean;
};

function parseGalleryIds(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  return [];
}

async function fetchPublishedEventsFromDb(locale: "ar" | "en"): Promise<PublicEventRow[]> {
  const res = await query(
    `SELECT
       e.id,
       e.title_ar,
       e.title_en,
       e.excerpt_ar,
       e.excerpt_en,
       e.details_ar,
       e.details_en,
       e.starts_at,
       e.ends_at,
       e.cover_image_id,
       e.brochure_media_id,
       b.filename AS brochure_filename,
       e.video_url,
       e.registration_label_ar,
       e.registration_label_en,
       e.registration_url,
       e.featured,
       COALESCE(
         (SELECT array_agg(eg.media_id ORDER BY eg.sort_order, eg.id)
          FROM event_gallery eg
          WHERE eg.event_id = e.id),
         ARRAY[]::uuid[]
       ) AS gallery_ids
     FROM events e
     LEFT JOIN media b ON b.id = e.brochure_media_id
     WHERE e.is_published = true
     ORDER BY
       e.featured DESC,
       (e.starts_at >= NOW()) DESC,
       CASE WHEN e.starts_at >= NOW() THEN e.starts_at END ASC NULLS LAST,
       CASE WHEN e.starts_at < NOW() THEN e.starts_at END DESC NULLS LAST`,
    []
  );

  const isEn = locale === "en";
  return res.rows.map((r) => {
    const gid = parseGalleryIds(r.gallery_ids);
    return {
      id: String(r.id),
      title: isEn ? String(r.title_en || r.title_ar) : String(r.title_ar),
      excerpt: isEn
        ? r.excerpt_en != null
          ? String(r.excerpt_en)
          : r.excerpt_ar != null
            ? String(r.excerpt_ar)
            : null
        : r.excerpt_ar != null
          ? String(r.excerpt_ar)
          : r.excerpt_en != null
            ? String(r.excerpt_en)
            : null,
      details: isEn
        ? String(r.details_en || r.details_ar || "")
        : String(r.details_ar || r.details_en || ""),
      startsAt: new Date(r.starts_at).toISOString(),
      endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null,
      coverImageId: r.cover_image_id ? String(r.cover_image_id) : null,
      galleryImageIds: gid,
      brochureMediaId: r.brochure_media_id ? String(r.brochure_media_id) : null,
      brochureFilename: r.brochure_filename ? String(r.brochure_filename) : null,
      videoUrl: r.video_url ? String(r.video_url) : null,
      registrationLabel: isEn
        ? r.registration_label_en != null
          ? String(r.registration_label_en)
          : r.registration_label_ar != null
            ? String(r.registration_label_ar)
            : null
        : r.registration_label_ar != null
          ? String(r.registration_label_ar)
          : r.registration_label_en != null
            ? String(r.registration_label_en)
            : null,
      registrationUrl: r.registration_url ? String(r.registration_url) : null,
      featured: Boolean(r.featured),
    } satisfies PublicEventRow;
  });
}

/**
 * أحداث منشورة للواجهة العامة — مع invalidation عبر revalidateTag("events") و revalidatePath (انظر eventsRevalidate).
 */
export async function getPublishedEvents(locale: "ar" | "en"): Promise<PublicEventRow[]> {
  return unstable_cache(
    async () => fetchPublishedEventsFromDb(locale),
    ["published-events", locale],
    { tags: ["events"] }
  )();
}
