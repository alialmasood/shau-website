import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { educationLevelLabelAr, jobCategoryLabelAr } from "@/lib/employeeIdentityConfig";
import { listEmployeeIdentityRequests } from "@/lib/employeeIdentityRequestsRepo";

export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("employee-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listEmployeeIdentityRequests();
  const tableRows = rows
    .map((r) => {
      const sent = r.created_at
        ? new Date(r.created_at).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })
        : "";
      return `<tr>
        <td>${escapeHtml(sent)}</td>
        <td dir="ltr">${escapeHtml(r.identity_number ?? "—")}</td>
        <td>${escapeHtml(r.name_ar)}</td>
        <td dir="ltr">${escapeHtml(r.name_en)}</td>
        <td>${escapeHtml(r.date_of_birth)}</td>
        <td>${escapeHtml(r.address)}</td>
        <td dir="ltr">${escapeHtml(r.phone)}</td>
        <td dir="ltr">${escapeHtml(r.blood_type)}</td>
        <td>${escapeHtml(r.education_level ? educationLevelLabelAr(r.education_level) : "—")}</td>
        <td>${escapeHtml(r.workplace)}</td>
        <td>${escapeHtml(jobCategoryLabelAr(r.job_category))}</td>
        <td>${escapeHtml(r.position ?? "—")}</td>
        <td dir="ltr">${escapeHtml(r.official_email ?? "—")}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 16px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 12px; color: #04025E; }
    table { width: 100%; border-collapse: collapse; font-size: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; vertical-align: top; }
    th { background: #e0e7ff; font-weight: 700; }
  </style>
</head>
<body>
  <h1>طلبات هوية الموظفين — كلية الشرق للعلوم التقنية التخصصية</h1>
  <table>
    <thead>
      <tr>
        <th>توقيت الإرسال</th>
        <th>رقم الهوية</th>
        <th>الاسم (عربي)</th>
        <th>الاسم (إنجليزي)</th>
        <th>التولد</th>
        <th>عنوان السكن</th>
        <th>الهاتف</th>
        <th>فصيلة الدم</th>
        <th>التحصيل العلمي</th>
        <th>مكان العمل</th>
        <th>الوظيفة</th>
        <th>المنصب</th>
        <th>البريد الرسمي</th>
      </tr>
    </thead>
    <tbody>${tableRows || "<tr><td colspan=\"13\">لا توجد بيانات</td></tr>"}</tbody>
  </table>
</body>
</html>`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
    });
    await browser.close();
    browser = undefined;

    const filenameAr = "هويات-الموظفين.pdf";
    const disposition = `attachment; filename="employee-identity.pdf"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    console.error("[employee-identity export pdf]", e);
    return NextResponse.json({ error: "فشل إنشاء ملف PDF" }, { status: 500 });
  }
}
