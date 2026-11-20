import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import {
  getStudentIdCardBySerial,
  getStudentIdCardsList,
} from "@/lib/studentIdCardsRepo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = String(request.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "أدخل اسمًا أو سيريالًا للبحث" }, { status: 400 });
  }

  const bySerial = await getStudentIdCardBySerial(q);
  if (bySerial) {
    return NextResponse.json({
      matches: [
        {
          serial: bySerial.serial,
          nameAr: bySerial.nameAr,
          nameEn: bySerial.nameEn,
          department: bySerial.department,
          stage: bySerial.stage,
        },
      ],
    });
  }

  const list = await getStudentIdCardsList({ search: q, limit: 15, offset: 0 });
  return NextResponse.json({
    matches: list.map((c) => ({
      serial: c.serial,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      department: c.department,
      stage: c.stage,
    })),
  });
}
