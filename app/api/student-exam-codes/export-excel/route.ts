import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAllForExport } from "@/lib/studentExamCodesRepo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hasAccess =
    String(user.role || "").toUpperCase() === "ADMIN" ||
    (await canAdmin("student-accounts", "access"));
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const department = url.searchParams.get("department") ?? "";
  const stage = url.searchParams.get("stage") ?? "";

  const rows = await getAllForExport({ department, stage });

  const headers = ["اسم الطالب", "القسم", "المرحلة", "الكود"];
  const data = [headers, ...rows.map((r) => [r.nameAr, r.department, r.stage, r.code])];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "كودات الطلبة");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = "student-exam-codes.xlsx";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
