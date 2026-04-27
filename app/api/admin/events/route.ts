import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { createEvent } from "@/lib/eventsAdminRepo";
import { revalidatePublicEvents } from "@/lib/eventsRevalidate";
import { isYouTubeUrl } from "@/lib/youtubeEmbed";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type Body = {
  titleAr: string;
  titleEn?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  detailsAr: string;
  detailsEn?: string | null;
  startsAt: string;
  endsAt?: string | null;
  registrationLabelAr?: string | null;
  registrationLabelEn?: string | null;
  registrationUrl?: string | null;
  published?: boolean;
  featured?: boolean;
  coverImageId?: string | null;
  brochureMediaId?: string | null;
  videoUrl?: string | null;
  galleryMediaIds?: string[];
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const titleAr = String(body?.titleAr ?? "").trim();
  const detailsAr = String(body?.detailsAr ?? "").trim();
  const startsAtRaw = String(body?.startsAt ?? "").trim();
  if (!titleAr || !startsAtRaw) {
    return NextResponse.json({ error: "Missing titleAr or startsAt" }, { status: 400 });
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
  }

  const endsAtRaw = body?.endsAt ? String(body.endsAt).trim() : "";
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
  }

  const videoUrl = body?.videoUrl ? String(body.videoUrl).trim() || null : null;
  if (videoUrl && !isYouTubeUrl(videoUrl)) {
    return NextResponse.json({ error: "Invalid videoUrl" }, { status: 400 });
  }

  const coverImageId = body?.coverImageId ? String(body.coverImageId) : null;
  const brochureMediaId = body?.brochureMediaId ? String(body.brochureMediaId) : null;
  if (coverImageId && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }
  if (brochureMediaId && !isUuid(brochureMediaId)) {
    return NextResponse.json({ error: "Invalid brochureMediaId" }, { status: 400 });
  }

  const galleryMediaIds = Array.isArray(body?.galleryMediaIds)
    ? body.galleryMediaIds.map(String).filter(isUuid)
    : [];

  try {
    const id = await createEvent({
      titleAr,
      titleEn: body?.titleEn ? String(body.titleEn).trim() || null : null,
      excerptAr: body?.excerptAr ? String(body.excerptAr).trim() || null : null,
      excerptEn: body?.excerptEn ? String(body.excerptEn).trim() || null : null,
      detailsAr: detailsAr || "",
      detailsEn: body?.detailsEn ? String(body.detailsEn).trim() || null : null,
      startsAt,
      endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
      registrationLabelAr: body?.registrationLabelAr ? String(body.registrationLabelAr).trim() || null : null,
      registrationLabelEn: body?.registrationLabelEn ? String(body.registrationLabelEn).trim() || null : null,
      registrationUrl: body?.registrationUrl ? String(body.registrationUrl).trim() || null : null,
      published: Boolean(body?.published),
      featured: Boolean(body?.featured),
      coverImageId,
      brochureMediaId,
      videoUrl,
      galleryMediaIds,
    });
    revalidatePublicEvents();
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
