import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import {
  getStudentExamCodesList,
  getStudentExamCodesCount,
  generateUniqueCode,
  insertStudentExamCode,
} from "@/lib/studentExamCodesRepo";

export const dynamic = "force-dynamic";

async function checkAccess() {
  const user = await getCurrentAdminUser();
  if (!user) return { status: 401 as const, body: { error: "Unauthorized" } };
  const hasAccess =
    String(user.role || "").toUpperCase() === "ADMIN" ||
    (await canAdmin("student-accounts", "access"));
  if (!hasAccess) return { status: 403 as const, body: { error: "Forbidden" } };
  return { user };
}

export async function GET(request: NextRequest) {
  const access = await checkAccess();
  if ("status" in access) return NextResponse.json(access.body, { status: access.status });

  const url = new URL(request.url);
  const department = url.searchParams.get("department") ?? "";
  const stage = url.searchParams.get("stage") ?? "";
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
  const offset = (page - 1) * limit;

  const [list, total] = await Promise.all([
    getStudentExamCodesList({ department, stage, search, limit, offset }),
    getStudentExamCodesCount({ department, stage, search }),
  ]);
  return NextResponse.json({ list, total, page, limit });
}
