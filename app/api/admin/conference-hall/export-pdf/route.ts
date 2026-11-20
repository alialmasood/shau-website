import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { listConferenceHallRequests } from "@/lib/conferenceHallRepo";
import {
  buildConferenceHallPdfHtml,
  toConferenceHallExportRows,
} from "@/lib/conferenceHallExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("conference-hall", "access"));
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = String(request.nextUrl.searchParams.get("status") ?? "").trim();
  const activityType = String(request.nextUrl.searchParams.get("activityType") ?? "").trim();
  const stage = String(request.nextUrl.searchParams.get("stage") ?? "").trim();
  const studyType = String(request.nextUrl.searchParams.get("studyType") ?? "").trim();
  const q = String(request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  let rows = await listConferenceHallRequests(1000);
  if (status) rows = rows.filter((r) => r.status === status);
  if (activityType) rows = rows.filter((r) => r.activityType === activityType);
  if (stage) rows = rows.filter((r) => r.stage === stage);
  if (studyType) rows = rows.filter((r) => r.studyType === studyType);
  if (q) {
    rows = rows.filter((r) =>
      [r.departmentNameAr, r.departmentNameEn, r.organizers, r.status, r.dateFrom, r.dateTo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  const exportRows = toConferenceHallExportRows(rows, "ar");
  const html = buildConferenceHallPdfHtml({
    title: "كشف طلبات قاعة المؤتمرات",
    rows: exportRows,
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
      landscape: true,
      printBackground: true,
      margin: { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" },
    });
    await browser.close();
    browser = null;

    const filenameAr = "طلبات-قاعة-المؤتمرات.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="conference-hall.pdf"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`,
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
    console.error("[admin conference-hall export pdf]", e);
    return NextResponse.json({ error: "فشل إنشاء ملف PDF" }, { status: 500 });
  }
}
