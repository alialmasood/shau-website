import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardsForExport } from "@/lib/studentIdCardsRepo";

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
  const search = String(url.searchParams.get("q") ?? "").trim();
  const department = String(url.searchParams.get("department") ?? "").trim();
  const stage = String(url.searchParams.get("stage") ?? "").trim();

  const cards = await getStudentIdCardsForExport({ search, department, stage });

  const headers = [
    "الاسم (عربي)",
    "الاسم (إنكليزي)",
    "تاريخ الولادة",
    "العنوان",
    "العنوان (إنكليزي)",
    "فصيلة الدم",
    "القسم",
    "القسم (إنكليزي)",
    "المرحلة",
    "المرحلة (إنكليزي)",
    "السيريال",
    "تاريخ انتهاء الهوية",
  ];
  const rows = cards.map((c) => [
    c.nameAr,
    c.nameEn,
    c.dob,
    c.address,
    c.addressEn,
    c.bloodType,
    c.department,
    c.departmentEn,
    c.stage,
    c.stageEn,
    c.serial,
    c.expiryDate,
  ]);
  const sheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "هويات طلبة");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const suffix = department ? `-${department.slice(0, 20)}` : "";
  const filenameAr = `هويات-طلبة${suffix}.xlsx`.replace(/[/\\:*?"<>|]/g, "-");
  const filenameAscii = "student-ids.xlsx";
  const disposition = `attachment; filename="${filenameAscii}"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
