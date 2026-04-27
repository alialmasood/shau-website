import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { deleteCertificateById } from "@/lib/ceAdminRepo";
import { revalidateContinuingEducation } from "@/lib/ceRevalidate";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  await deleteCertificateById(id);
  revalidateContinuingEducation();
  return NextResponse.json({ ok: true });
}
