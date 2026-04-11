import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { listStaffIdentityRequests } from "@/lib/staffIdentityRequestsRepo";

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
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("staff-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listStaffIdentityRequests();
  const tableRows = rows
    .map((r) => {
      const sent = r.created_at
        ? new Date(r.created_at).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })
        : "";
      return `<tr>
        <td>${escapeHtml(sent)}</td>
        <td>${escapeHtml(r.name_ar)}</td>
        <td dir="ltr">${escapeHtml(r.name_en)}</td>
        <td>${escapeHtml(r.date_of_birth)}</td>
        <td>${escapeHtml(r.academic_title ?? "—")}</td>
        <td>${escapeHtml(r.workplace)}</td>
        <td>${escapeHtml(r.position ?? "—")}</td>
        <td dir="ltr">${escapeHtml(r.phone)}</td>
        <td dir="ltr">${escapeHtml(r.university_email)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 16px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; }
  </style>
</head>
<body>
  <h1>طلبات هوية الكادر — كلية الشرق للعلوم التقنية التخصصية</h1>
  <table>
    <thead>
      <tr>
        <th>توقيت الإرسال</th>
        <th>الاسم (عربي)</th>
        <th>الاسم (إنجليزي)</th>
        <th>تاريخ التولد</th>
        <th>اللقب العلمي</th>
        <th>القسم</th>
        <th>المنصب</th>
        <th>الهاتف</th>
        <th>البريد الجامعي</th>
      </tr>
    </thead>
    <tbody>${tableRows || "<tr><td colspan=\"9\">لا توجد بيانات</td></tr>"}</tbody>
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
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    await browser.close();
    browser = undefined;

    const filenameAr = "هويات-الكادر.pdf";
    const disposition = `attachment; filename="staff-identity.pdf"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

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
    console.error("[staff-identity export pdf]", e);
    return NextResponse.json({ error: "فشل إنشاء ملف PDF" }, { status: 500 });
  }
}
