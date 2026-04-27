import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { createCeActivity } from "@/lib/ceAdminRepo";
import { revalidateContinuingEducation } from "@/lib/ceRevalidate";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type Body = {
  titleAr: string;
  titleEn?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  announcementDetailsAr: string;
  announcementDetailsEn?: string | null;
  recapDetailsAr?: string | null;
  recapDetailsEn?: string | null;
  eventStartsAt: string;
  eventEndsAt?: string | null;
  showAnnouncement?: boolean;
  showRecap?: boolean;
  published?: boolean;
  featured?: boolean;
  coverImageId?: string | null;
  certificatesZipMediaId?: string | null;
  gallery?: Array<{ mediaId: string; kind: "announcement" | "recap" }>;
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const titleAr = String(body?.titleAr ?? "").trim();
  const eventStartsRaw = String(body?.eventStartsAt ?? "").trim();
  if (!titleAr || !eventStartsRaw) {
    return NextResponse.json({ error: "Missing titleAr or eventStartsAt" }, { status: 400 });
  }

  const eventStartsAt = new Date(eventStartsRaw);
  if (Number.isNaN(eventStartsAt.getTime())) {
    return NextResponse.json({ error: "Invalid eventStartsAt" }, { status: 400 });
  }

  const endsRaw = body?.eventEndsAt ? String(body.eventEndsAt).trim() : "";
  const eventEndsAt = endsRaw ? new Date(endsRaw) : null;
  if (eventEndsAt && Number.isNaN(eventEndsAt.getTime())) {
    return NextResponse.json({ error: "Invalid eventEndsAt" }, { status: 400 });
  }

  const coverImageId = body?.coverImageId ? String(body.coverImageId) : null;
  const zipId = body?.certificatesZipMediaId ? String(body.certificatesZipMediaId) : null;
  if (coverImageId && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }
  if (zipId && !isUuid(zipId)) {
    return NextResponse.json({ error: "Invalid certificatesZipMediaId" }, { status: 400 });
  }

  const gallery = Array.isArray(body?.gallery) ? body.gallery : [];

  try {
    const id = await createCeActivity({
      titleAr,
      titleEn: body?.titleEn ? String(body.titleEn).trim() || null : null,
      excerptAr: body?.excerptAr ? String(body.excerptAr).trim() || null : null,
      excerptEn: body?.excerptEn ? String(body.excerptEn).trim() || null : null,
      announcementDetailsAr: String(body?.announcementDetailsAr ?? "").trim() || "",
      announcementDetailsEn: body?.announcementDetailsEn ? String(body.announcementDetailsEn).trim() || null : null,
      recapDetailsAr: body?.recapDetailsAr ? String(body.recapDetailsAr).trim() || null : null,
      recapDetailsEn: body?.recapDetailsEn ? String(body.recapDetailsEn).trim() || null : null,
      eventStartsAt,
      eventEndsAt: eventEndsAt && !Number.isNaN(eventEndsAt.getTime()) ? eventEndsAt : null,
      showAnnouncement: body?.showAnnouncement !== false,
      showRecap: Boolean(body?.showRecap),
      published: Boolean(body?.published),
      featured: Boolean(body?.featured),
      coverImageId,
      certificatesZipMediaId: zipId,
      gallery: gallery
        .filter((g) => g && isUuid(String(g.mediaId)))
        .map((g) => ({
          mediaId: String(g.mediaId),
          kind: g.kind === "recap" ? "recap" : "announcement",
        })),
    });
    revalidateContinuingEducation();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
