import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardByStudent } from "@/lib/studentIdCardsRepo";

export async function GET(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const nameAr = String(url.searchParams.get("nameAr") ?? "").trim();
  const dob = String(url.searchParams.get("dob") ?? "").trim();
  const department = String(url.searchParams.get("department") ?? "").trim();

  if (!nameAr || !dob || !department) {
    return NextResponse.json({ hasIssued: false });
  }

  const card = await getStudentIdCardByStudent(nameAr, dob, department);
  if (!card) {
    return NextResponse.json({ hasIssued: false });
  }
  return NextResponse.json({ hasIssued: true, serial: card.serial });
}
