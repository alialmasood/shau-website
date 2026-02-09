import { NextResponse } from "next/server";
import { getStudentIdCardBySerial, deleteStudentIdCard } from "@/lib/studentIdCardsRepo";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  const card = await getStudentIdCardBySerial(serial);
  if (!card) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json({ card });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-id", "delete"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { serial } = await params;
  const ok = await deleteStudentIdCard(serial);
  if (!ok) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
