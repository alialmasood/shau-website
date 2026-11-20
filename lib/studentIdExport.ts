import type { StudentIdCardRow } from "@/lib/studentIdCardsRepo";

export function formatIssueDateAr(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatIssueDateShort(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DepartmentExportRow = {
  nameAr: string;
  department: string;
  serial: string;
  issueDate: string;
  stage: string;
};

export function toDepartmentExportRows(cards: StudentIdCardRow[]): DepartmentExportRow[] {
  return cards.map((c) => ({
    nameAr: c.nameAr,
    department: c.department,
    serial: c.serial,
    issueDate: formatIssueDateShort(c.createdAt),
    stage: c.stage,
  }));
}

export async function buildColoredStudentIdWorkbook(opts: {
  title: string;
  departmentLabel?: string;
  rows: DepartmentExportRow[];
}): Promise<Buffer> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "كلية الشرق للعلوم التقنية التخصصية";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("هويات القسم", {
    views: [{ rightToLeft: true }],
  });

  sheet.mergeCells(1, 1, 1, 5);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = opts.title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF04025E" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, 5);
  const metaCell = sheet.getCell(2, 1);
  const deptPart = opts.departmentLabel ? ` — ${opts.departmentLabel}` : "";
  metaCell.value = `تاريخ التصدير: ${formatIssueDateShort(new Date().toISOString())}${deptPart} — العدد: ${opts.rows.length}`;
  metaCell.font = { size: 10, color: { argb: "FF334155" } };
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 20;

  const headerRow = sheet.getRow(3);
  const displayHeaders = ["الاسم", "القسم", "كود الهوية", "تاريخ إصدار الهوية", "المرحلة"];
  displayHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF31BD9C" },
    };
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
    const values = [row.nameAr, row.department, row.serial, row.issueDate, row.stage];
    values.forEach((v, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = v;
      cell.alignment = {
        horizontal: i === 2 ? "left" : "right",
        vertical: "middle",
        wrapText: true,
      };
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  sheet.columns = [
    { width: 28 },
    { width: 28 },
    { width: 22 },
    { width: 20 },
    { width: 14 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildDepartmentPdfHtml(opts: {
  title: string;
  departmentLabel: string;
  rows: DepartmentExportRow[];
}): string {
  const tableRows = opts.rows
    .map(
      (r, i) => `<tr class="${i % 2 === 0 ? "even" : "odd"}">
      <td class="num">${i + 1}</td>
      <td>${escapeHtml(r.nameAr)}</td>
      <td>${escapeHtml(r.department)}</td>
      <td class="mono" dir="ltr">${escapeHtml(r.serial)}</td>
      <td>${escapeHtml(r.issueDate)}</td>
      <td>${escapeHtml(r.stage)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <style>
    @page { size: A4; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      margin: 0;
      color: #0f172a;
      font-size: 11px;
    }
    .header {
      border-bottom: 3px solid #31BD9C;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand {
      color: #04025E;
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 4px;
    }
    h1 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }
    .meta {
      margin-top: 6px;
      color: #64748b;
      font-size: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 7px;
      text-align: right;
      vertical-align: middle;
      word-wrap: break-word;
    }
    th {
      background: #31BD9C;
      color: #fff;
      font-weight: 700;
      font-size: 10px;
    }
    tr.even td { background: #f8fafc; }
    tr.odd td { background: #ffffff; }
    td.num { width: 28px; text-align: center; color: #64748b; }
    td.mono { font-family: Consolas, 'Courier New', monospace; font-size: 9px; text-align: left; }
    .footer {
      margin-top: 12px;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="brand">كلية الشرق للعلوم التقنية التخصصية</p>
    <h1>${escapeHtml(opts.title)}</h1>
    <p class="meta">القسم: ${escapeHtml(opts.departmentLabel)} — العدد: ${opts.rows.length} — تاريخ التصدير: ${escapeHtml(
      formatIssueDateShort(new Date().toISOString())
    )}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">ت</th>
        <th>الاسم</th>
        <th>القسم</th>
        <th style="width:120px">كود الهوية</th>
        <th style="width:100px">تاريخ الإصدار</th>
        <th style="width:80px">المرحلة</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="6" style="text-align:center">لا توجد بيانات</td></tr>`}
    </tbody>
  </table>
  <p class="footer">تقرير رسمي — نظام هويات الطلبة</p>
</body>
</html>`;
}
