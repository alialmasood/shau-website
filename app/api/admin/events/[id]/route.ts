import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { revalidatePublicEvents } from "@/lib/eventsRevalidate";
import { getAdminEventById, updateEvent, deleteEventById } from "@/lib/eventsAdminRepo";
import { isYouTubeUrl } from "@/lib/youtubeEmbed";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type PatchBody = {
  titleAr?: string;
  titleEn?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  detailsAr?: string;
  detailsEn?: string | null;
  startsAt?: string;
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const row = await getAdminEventById(id);
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const current = await getAdminEventById(id);
  if (!current) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const body = (await request.json()) as PatchBody;

  const titleAr = body.titleAr != null ? String(body.titleAr).trim() : current.titleAr;
  const detailsAr = body.detailsAr != null ? String(body.detailsAr).trim() : current.detailsAr;
  const startsAtRaw = body.startsAt != null ? String(body.startsAt).trim() : current.startsAt;
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
  }

  const endsAtProvided = body.endsAt !== undefined;
  let endsAt: Date | null = current.endsAt ? new Date(current.endsAt) : null;
  if (endsAtProvided) {
    const t = body.endsAt ? String(body.endsAt).trim() : "";
    endsAt = t ? new Date(t) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
    }
  }

  const videoUrl =
    body.videoUrl !== undefined
      ? String(body.videoUrl || "").trim() || null
      : current.videoUrl;
  if (videoUrl && !isYouTubeUrl(videoUrl)) {
    return NextResponse.json({ error: "Invalid videoUrl" }, { status: 400 });
  }

  const coverImageId =
    body.coverImageId !== undefined ? (body.coverImageId ? String(body.coverImageId) : null) : current.coverImageId;
  const brochureMediaId =
    body.brochureMediaId !== undefined
      ? body.brochureMediaId
        ? String(body.brochureMediaId)
        : null
      : current.brochureMediaId;
  if (coverImageId && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }
  if (brochureMediaId && !isUuid(brochureMediaId)) {
    return NextResponse.json({ error: "Invalid brochureMediaId" }, { status: 400 });
  }

  const galleryMediaIds =
    body.galleryMediaIds !== undefined
      ? body.galleryMediaIds.map(String).filter(isUuid)
      : current.galleryMediaIds;

  try {
    await updateEvent(id, {
      titleAr,
      titleEn: body.titleEn !== undefined ? String(body.titleEn || "").trim() || null : current.titleEn,
      excerptAr:
        body.excerptAr !== undefined ? String(body.excerptAr || "").trim() || null : current.excerptAr,
      excerptEn:
        body.excerptEn !== undefined ? String(body.excerptEn || "").trim() || null : current.excerptEn,
      detailsAr,
      detailsEn:
        body.detailsEn !== undefined ? String(body.detailsEn || "").trim() || null : current.detailsEn,
      startsAt,
      endsAt,
      registrationLabelAr:
        body.registrationLabelAr !== undefined
          ? String(body.registrationLabelAr || "").trim() || null
          : current.registrationLabelAr,
      registrationLabelEn:
        body.registrationLabelEn !== undefined
          ? String(body.registrationLabelEn || "").trim() || null
          : current.registrationLabelEn,
      registrationUrl:
        body.registrationUrl !== undefined
          ? String(body.registrationUrl || "").trim() || null
          : current.registrationUrl,
      published: body.published !== undefined ? Boolean(body.published) : current.published,
      featured: body.featured !== undefined ? Boolean(body.featured) : current.featured,
      coverImageId,
      brochureMediaId,
      videoUrl,
      galleryMediaIds,
    });
    revalidatePublicEvents();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  await deleteEventById(id);
  revalidatePublicEvents();
  return NextResponse.json({ ok: true });
}
