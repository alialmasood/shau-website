import {
  labelActivityType,
  labelStage,
  labelStatus,
  labelStudyType,
} from "@/lib/conferenceHallConfig";
import type { ConferenceHallRequestRow } from "@/lib/conferenceHallRepo";
import { escapeHtml, formatIssueDateShort } from "@/lib/studentIdExport";

export type ConferenceHallExportRow = {
  department: string;
  stage: string;
  studyType: string;
  activityType: string;
  activityTitle: string;
  activityBrief: string;
  organizers: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  createdAt: string;
};

export function toConferenceHallExportRows(
  rows: ConferenceHallRequestRow[],
  locale: "ar" | "en" = "ar"
): ConferenceHallExportRow[] {
  return rows.map((r) => ({
    department: locale === "en" ? r.departmentNameEn || r.departmentNameAr : r.departmentNameAr,
    stage: labelStage(r.stage, locale),
    studyType: labelStudyType(r.studyType, locale),
    activityType: labelActivityType(r.activityType, locale),
    activityTitle: r.activityTitle || "—",
    activityBrief: r.activityBrief || "—",
    organizers: r.organizers,
    dateFrom: r.dateFrom,
    dateTo: r.dateTo,
    status: labelStatus(r.status, locale),
    createdAt: formatIssueDateShort(r.createdAt),
  }));
}

export async function buildConferenceHallWorkbook(opts: {
  title: string;
  rows: ConferenceHallExportRow[];
}): Promise<Buffer> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "كلية الشرق للعلوم التقنية التخصصية";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("طلبات القاعة", {
    views: [{ rightToLeft: true }],
  });

  const colCount = 11;
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = opts.title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF04025E" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, colCount);
  const meta = sheet.getCell(2, 1);
  meta.value = `تاريخ التصدير: ${formatIssueDateShort(new Date().toISOString())} — العدد: ${opts.rows.length}`;
  meta.font = { size: 10, color: { argb: "FF334155" } };
  meta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  meta.alignment = { horizontal: "center", vertical: "middle" };

  const headers = [
    "القسم",
    "المرحلة",
    "نوع الدراسة",
    "نوع النشاط",
    "عنوان النشاط",
    "نبذة عن النشاط",
    "القائمون",
    "من",
    "إلى",
    "الحالة",
    "تاريخ الطلب",
  ];
  const headerRow = sheet.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF31BD9C" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
  headerRow.height = 22;

  opts.rows.forEach((row, idx) => {
    const excelRow = sheet.getRow(4 + idx);
    const values = [
      row.department,
      row.stage,
      row.studyType,
      row.activityType,
      row.activityTitle,
      row.activityBrief,
      row.organizers,
      row.dateFrom,
      row.dateTo,
      row.status,
      row.createdAt,
    ];
    values.forEach((v, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = v;
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.alignment = { horizontal: "right", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  sheet.columns = [
    { width: 22 },
    { width: 10 },
    { width: 12 },
    { width: 14 },
    { width: 22 },
    { width: 28 },
    { width: 22 },
    { width: 11 },
    { width: 11 },
    { width: 12 },
    { width: 12 },
  ];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildConferenceHallPdfHtml(opts: {
  title: string;
  rows: ConferenceHallExportRow[];
}): string {
  const tableRows = opts.rows
    .map(
      (r, i) => `<tr class="${i % 2 === 0 ? "even" : "odd"}">
      <td class="num">${i + 1}</td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.stage)}</td>
      <td>${escapeHtml(r.studyType)}</td>
      <td>${escapeHtml(r.activityType)}</td>
      <td>${escapeHtml(r.activityTitle)}</td>
      <td>${escapeHtml(r.activityBrief)}</td>
      <td>${escapeHtml(r.organizers)}</td>
      <td>${escapeHtml(r.dateFrom)}</td>
      <td>${escapeHtml(r.dateTo)}</td>
      <td>${escapeHtml(r.status)}</td>
      <td>${escapeHtml(r.createdAt)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; color: #0f172a; font-size: 9px; }
    .header { border-bottom: 3px solid #31BD9C; padding-bottom: 8px; margin-bottom: 10px; }
    .brand { color: #04025E; font-size: 11px; font-weight: 700; margin: 0 0 4px; }
    h1 { margin: 0; font-size: 14px; }
    .meta { margin-top: 4px; color: #64748b; font-size: 8px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 5px; text-align: right; vertical-align: top; word-wrap: break-word; }
    th { background: #31BD9C; color: #fff; font-weight: 700; font-size: 8px; }
    tr.even td { background: #f8fafc; }
    td.num { width: 20px; text-align: center; color: #64748b; }
    .footer { margin-top: 8px; font-size: 8px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <p class="brand">كلية الشرق للعلوم التقنية التخصصية</p>
    <h1>${escapeHtml(opts.title)}</h1>
    <p class="meta">العدد: ${opts.rows.length} — تاريخ التصدير: ${escapeHtml(
      formatIssueDateShort(new Date().toISOString())
    )}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>ت</th>
        <th>القسم</th>
        <th>المرحلة</th>
        <th>الدراسة</th>
        <th>نوع النشاط</th>
        <th>عنوان النشاط</th>
        <th>نبذة</th>
        <th>القائمون</th>
        <th>من</th>
        <th>إلى</th>
        <th>الحالة</th>
        <th>تاريخ الطلب</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="12" style="text-align:center">لا توجد بيانات</td></tr>`}
    </tbody>
  </table>
  <p class="footer">تقرير رسمي — إدارة قاعة المؤتمرات</p>
</body>
</html>`;
}
