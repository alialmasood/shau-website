import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardByStudent } from "@/lib/studentIdCardsRepo";

type StudentKey = { nameAr: string; dob: string; department: string };

export async function POST(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { students?: StudentKey[] };
  try {
    body = (await request.json()) as { students?: StudentKey[] };
  } catch {
    return NextResponse.json({ serials: [] });
  }

  const students = Array.isArray(body.students) ? body.students : [];
  const serials: (string | null)[] = [];

  for (const s of students) {
    const nameAr = String(s?.nameAr ?? "").trim();
    const dob = String(s?.dob ?? "").trim();
    const department = String(s?.department ?? "").trim();
    if (!nameAr || !dob || !department) {
      serials.push(null);
      continue;
    }
    const card = await getStudentIdCardByStudent(nameAr, dob, department);
    serials.push(card ? card.serial : null);
  }

  return NextResponse.json({ serials });
}
