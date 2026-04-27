import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAdminCeById, updateCeActivity, deleteCeActivity } from "@/lib/ceAdminRepo";
import { revalidateContinuingEducation } from "@/lib/ceRevalidate";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type PatchBody = {
  titleAr?: string;
  titleEn?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  announcementDetailsAr?: string;
  announcementDetailsEn?: string | null;
  recapDetailsAr?: string | null;
  recapDetailsEn?: string | null;
  eventStartsAt?: string;
  eventEndsAt?: string | null;
  showAnnouncement?: boolean;
  showRecap?: boolean;
  published?: boolean;
  featured?: boolean;
  coverImageId?: string | null;
  certificatesZipMediaId?: string | null;
  gallery?: Array<{ mediaId: string; kind: "announcement" | "recap" }>;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const row = await getAdminCeById(id);
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const cur = await getAdminCeById(id);
  if (!cur) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const body = (await request.json()) as PatchBody;

  const titleAr = body.titleAr != null ? String(body.titleAr).trim() : cur.titleAr;
  const eventStartsRaw = body.eventStartsAt != null ? String(body.eventStartsAt).trim() : cur.eventStartsAt;
  const eventStartsAt = new Date(eventStartsRaw);
  if (Number.isNaN(eventStartsAt.getTime())) {
    return NextResponse.json({ error: "Invalid eventStartsAt" }, { status: 400 });
  }

  const endsProvided = body.eventEndsAt !== undefined;
  let eventEndsAt: Date | null = cur.eventEndsAt ? new Date(cur.eventEndsAt) : null;
  if (endsProvided) {
    const t = body.eventEndsAt ? String(body.eventEndsAt).trim() : "";
    eventEndsAt = t ? new Date(t) : null;
    if (eventEndsAt && Number.isNaN(eventEndsAt.getTime())) {
      return NextResponse.json({ error: "Invalid eventEndsAt" }, { status: 400 });
    }
  }

  const coverImageId =
    body.coverImageId !== undefined ? (body.coverImageId ? String(body.coverImageId) : null) : cur.coverImageId;
  const zipId =
    body.certificatesZipMediaId !== undefined
      ? body.certificatesZipMediaId
        ? String(body.certificatesZipMediaId)
        : null
      : cur.certificatesZipMediaId;
  if (coverImageId && !isUuid(coverImageId)) {
    return NextResponse.json({ error: "Invalid coverImageId" }, { status: 400 });
  }
  if (zipId && !isUuid(zipId)) {
    return NextResponse.json({ error: "Invalid zip id" }, { status: 400 });
  }

  const gallery =
    body.gallery !== undefined
      ? body.gallery
          .filter((g) => g && isUuid(String(g.mediaId)))
          .map((g) => ({
            mediaId: String(g.mediaId),
            kind: g.kind === "recap" ? "recap" as const : "announcement" as const,
          }))
      : cur.gallery;

  try {
    await updateCeActivity(id, {
      titleAr,
      titleEn: body.titleEn !== undefined ? String(body.titleEn || "").trim() || null : cur.titleEn,
      excerptAr: body.excerptAr !== undefined ? String(body.excerptAr || "").trim() || null : cur.excerptAr,
      excerptEn: body.excerptEn !== undefined ? String(body.excerptEn || "").trim() || null : cur.excerptEn,
      announcementDetailsAr:
        body.announcementDetailsAr !== undefined
          ? String(body.announcementDetailsAr || "").trim() || ""
          : cur.announcementDetailsAr,
      announcementDetailsEn:
        body.announcementDetailsEn !== undefined
          ? String(body.announcementDetailsEn || "").trim() || null
          : cur.announcementDetailsEn,
      recapDetailsAr:
        body.recapDetailsAr !== undefined ? String(body.recapDetailsAr || "").trim() || null : cur.recapDetailsAr,
      recapDetailsEn:
        body.recapDetailsEn !== undefined ? String(body.recapDetailsEn || "").trim() || null : cur.recapDetailsEn,
      eventStartsAt,
      eventEndsAt,
      showAnnouncement:
        body.showAnnouncement !== undefined ? Boolean(body.showAnnouncement) : cur.showAnnouncement,
      showRecap: body.showRecap !== undefined ? Boolean(body.showRecap) : cur.showRecap,
      published: body.published !== undefined ? Boolean(body.published) : cur.published,
      featured: body.featured !== undefined ? Boolean(body.featured) : cur.featured,
      coverImageId,
      certificatesZipMediaId: zipId,
      gallery,
    });
    revalidateContinuingEducation();
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
  await deleteCeActivity(id);
  revalidateContinuingEducation();
  return NextResponse.json({ ok: true });
}
