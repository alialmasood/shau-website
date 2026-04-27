import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { insertCertificate } from "@/lib/ceAdminRepo";
import { revalidateContinuingEducation } from "@/lib/ceRevalidate";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type Body = {
  activityId: string;
  pdfMediaId: string;
  participantNameAr: string;
  participantNameEn?: string | null;
  code?: string | null;
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const activityId = String(body?.activityId ?? "").trim();
  const pdfMediaId = String(body?.pdfMediaId ?? "").trim();
  const participantNameAr = String(body?.participantNameAr ?? "").trim();
  if (!activityId || !pdfMediaId || !participantNameAr) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isUuid(activityId) || !isUuid(pdfMediaId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  try {
    const row = await insertCertificate({
      activityId,
      pdfMediaId,
      participantNameAr,
      participantNameEn: body?.participantNameEn ? String(body.participantNameEn).trim() || null : null,
      code: body?.code ? String(body.code).trim().toUpperCase() : null,
    });
    revalidateContinuingEducation();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add certificate" }, { status: 500 });
  }
}
