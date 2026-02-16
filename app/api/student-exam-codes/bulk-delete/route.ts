import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { deleteByDepartment, deleteAll } from "@/lib/studentExamCodesRepo";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hasAccess =
    String(user.role || "").toUpperCase() === "ADMIN" ||
    (await canAdmin("student-accounts", "access"));
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { department?: string; deleteAll?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.deleteAll) {
    const count = await deleteAll();
    return NextResponse.json({ deleted: count });
  }
  if (body.department?.trim()) {
    const count = await deleteByDepartment(body.department.trim());
    return NextResponse.json({ deleted: count });
  }
  return NextResponse.json({ error: "حدد القسم أو deleteAll: true" }, { status: 400 });
}
