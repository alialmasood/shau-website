import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { query } from "@/lib/db";
import { buildSerial, getDepartmentCode, getNextSequence } from "@/lib/studentIdSerial";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-id", "create"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const departmentLabel = String(url.searchParams.get("department") ?? "").trim();
  if (!departmentLabel) {
    return NextResponse.json({ error: "Missing department" }, { status: 400 });
  }

  const deptCode = getDepartmentCode(departmentLabel);
  if (!deptCode) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const now = new Date();
  const year = String(now.getFullYear() % 100).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `SH-${deptCode}${year}${month}-`;

  const res = await query(
    `SELECT serial
     FROM student_id_cards
     WHERE serial LIKE $1
     ORDER BY serial DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  const lastSerial = res.rows[0]?.serial ? String(res.rows[0].serial) : null;
  const seq = getNextSequence(lastSerial);
  const serial = buildSerial(deptCode, now, seq);

  return NextResponse.json({ serial });
}
