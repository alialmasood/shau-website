import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardsForExport } from "@/lib/studentIdCardsRepo";
import {
  buildColoredStudentIdWorkbook,
  toDepartmentExportRows,
} from "@/lib/studentIdExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const format = String(url.searchParams.get("format") ?? "").trim();

  const cards = await getStudentIdCardsForExport({ search, department, stage });

  // تصدير ملوّن ومنظم لقائمة القسم (أو عند طلب format=department)
  if (department || format === "department") {
    const rows = toDepartmentExportRows(cards);
    const title = department
      ? `كشف هويات طلبة قسم: ${department}`
      : "كشف هويات الطلبة";
    const buffer = await buildColoredStudentIdWorkbook({
      title,
      departmentLabel: department || undefined,
      rows,
    });
    const filenameAr = `هويات-${(department || "الكل").slice(0, 40)}.xlsx`.replace(
      /[/\\:*?"<>|]/g,
      "-"
    );
    const disposition = `attachment; filename="student-ids.xlsx"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": disposition,
      },
    });
  }

  // التصدير الشامل السابق (كل الحقول) عند عدم تحديد قسم
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "كلية الشرق للعلوم التقنية التخصصية";
  const sheet = workbook.addWorksheet("هويات طلبة", { views: [{ rightToLeft: true }] });

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
    "تاريخ إصدار الهوية",
    "تاريخ انتهاء الهوية",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "كشف هويات الطلبة — كلية الشرق للعلوم التقنية التخصصية";
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF04025E" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 26;

  const headerRow = sheet.getRow(2);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF31BD9C" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  headerRow.height = 22;

  cards.forEach((c, idx) => {
    const row = sheet.getRow(3 + idx);
    const values = [
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
      c.createdAt ? c.createdAt.slice(0, 10) : "",
      c.expiryDate,
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 9 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  sheet.columns = headers.map(() => ({ width: 16 }));
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(7).width = 24;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const filenameAr = "هويات-طلبة.xlsx";
  const disposition = `attachment; filename="student-ids.xlsx"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
