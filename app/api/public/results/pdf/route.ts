import { NextRequest, NextResponse } from "next/server";
import { getResultById } from "@/lib/resultsRepo";
import { getStudentById } from "@/lib/studentsRepo";
import { verifySig } from "@/lib/resultSignature";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rid = searchParams.get("rid") ?? "";
    const sid = searchParams.get("sid") ?? "";
    const sig = searchParams.get("sig") ?? "";
    const attemptParam = searchParams.get("attempt") || "1";
    const attemptNumber = attemptParam === "2" ? 2 : 1;
    const attemptLabel = getAttemptLabel(attemptNumber);

    if (!rid || !sid || !sig) {
      return NextResponse.json(
        { error: "رابط غير صالح - معاملات مفقودة" },
        { status: 400 }
      );
    }

    if (!verifySig(rid, sid, sig)) {
      return NextResponse.json(
        { error: "رابط غير صالح أو منتهي الصلاحية" },
        { status: 403 }
      );
    }

    const result = await getResultById(rid);
    if (!result || result.studentId !== sid || result.attempt !== attemptLabel) {
      return NextResponse.json(
        { error: "النتيجة غير موجودة" },
        { status: 404 }
      );
    }

    const student = await getStudentById(result.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "الطالب غير موجود" },
        { status: 404 }
      );
    }

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BASE_URL ?? "http://localhost:3020";
    const printUrl = `${BASE_URL}/ar/verify-result/print?rid=${encodeURIComponent(rid)}&sid=${encodeURIComponent(sid)}&sig=${encodeURIComponent(sig)}&attempt=${attemptNumber}`;

    let chromium: { launch: (opts: object) => Promise<{ newContext: () => Promise<any>; close: () => Promise<void> }> };
    try {
      const playwright = await import("playwright");
      chromium = playwright.chromium;
    } catch {
      return NextResponse.json(
        { error: "خطأ في تحميل مكتبة PDF" },
        { status: 500 }
      );
    }

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu"],
      });
    } catch (launchError) {
      const details = launchError instanceof Error ? launchError.message : String(launchError);
      return NextResponse.json(
        {
          error: "فشل تشغيل المتصفح",
          details,
          installCommand: "npx playwright install chromium",
        },
        { status: 500 }
      );
    }

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(printUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await page.waitForSelector("#result-print-root", { timeout: 15000 });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      });

      await context.close();
      await browser.close();

      const filename = `result_${student.studentId}_2025-2026_sem1_attempt${attemptNumber}.pdf`;
      const pdfArray = new Uint8Array(pdfBuffer);

      return new NextResponse(pdfArray, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (err) {
      try {
        await browser.close();
      } catch {}
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `فشل توليد PDF: ${msg}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `حدث خطأ: ${msg}` },
      { status: 500 }
    );
  }
}
