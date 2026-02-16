import { NextRequest, NextResponse } from "next/server";
import { getStudentExamCodeByCode } from "@/lib/studentExamCodesRepo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = String(url.searchParams.get("code") ?? "").trim();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const row = await getStudentExamCodeByCode(code);
  if (!row) return NextResponse.json({ error: "Not found", valid: false }, { status: 404 });

  return NextResponse.json({
    valid: true,
    data: {
      code: row.code,
      nameAr: row.nameAr,
      department: row.department,
      stage: row.stage,
    },
  });
}
