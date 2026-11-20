import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardsForExport } from "@/lib/studentIdCardsRepo";
import {
  buildDepartmentPdfHtml,
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

  if (!department) {
    return NextResponse.json({ error: "يجب تحديد القسم" }, { status: 400 });
  }

  const cards = await getStudentIdCardsForExport({ search, department, stage });
  const rows = toDepartmentExportRows(cards);
  const html = buildDepartmentPdfHtml({
    title: "كشف هويات الطلبة حسب القسم",
    departmentLabel: department,
    rows,
  });

  let browser: Awaited<ReturnType<(typeof import("playwright"))["chromium"]["launch"]>> | null =
    null;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
    });
    await browser.close();
    browser = null;

    const filenameAr = `هويات-${department.slice(0, 40)}.pdf`.replace(/[/\\:*?"<>|]/g, "-");
    const disposition = `attachment; filename="student-ids-department.pdf"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

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
    console.error("[student-id export pdf]", e);
    return NextResponse.json({ error: "فشل إنشاء ملف PDF" }, { status: 500 });
  }
}
