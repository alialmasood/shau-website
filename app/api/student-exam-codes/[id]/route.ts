import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import {
  getStudentExamCodeById,
  updateStudentExamCode,
  deleteStudentExamCode,
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await checkAccess();
  if ("status" in access) return NextResponse.json(access.body, { status: access.status });

  const { id } = await params;
  const row = await getStudentExamCodeById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await checkAccess();
  if ("status" in access) return NextResponse.json(access.body, { status: access.status });

  const { id } = await params;
  let body: { nameAr?: string; department?: string; stage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updated = await updateStudentExamCode(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await checkAccess();
  if ("status" in access) return NextResponse.json(access.body, { status: access.status });

  const { id } = await params;
  const ok = await deleteStudentExamCode(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
