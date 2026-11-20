import { NextRequest, NextResponse } from "next/server";
import { getStudentIdCardBySerial } from "@/lib/studentIdCardsRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function safeFileName(name: string): string {
  return (
    name
      .replace(/[/\\:*?"<>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "هوية"
  );
}

function resolveBaseUrl(request: NextRequest): string {
  const origin = request.nextUrl?.origin;
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, "");
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3020";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const serial = String(url.searchParams.get("serial") ?? "").trim();
  const side = String(url.searchParams.get("side") ?? "").trim();

  if (!serial || (side !== "ar" && side !== "en")) {
    return NextResponse.json(
      { error: "معاملات غير صالحة. أدخل السيريال واختر الوجه (ar أو en)." },
      { status: 400 }
    );
  }

  const card = await getStudentIdCardBySerial(serial);
  if (!card) {
    return NextResponse.json(
      {
        error: "لم يتم العثور على هوية بهذا السيريال",
        hint: "استخدم السيريال من قائمة الهويات المسجلة، وليس الاسم فقط.",
        serial,
      },
      { status: 404 }
    );
  }

  const baseName = safeFileName(card.nameAr);
  const sideLabel = side === "ar" ? "وجه عربي" : "وجه انكليزي";
  const downloadName = `${baseName} - ${sideLabel}.png`;
  const baseUrl = resolveBaseUrl(request);

  let chromium: {
    launch: (opts: object) => Promise<{
      newContext: (opts?: object) => Promise<{
        newPage: () => Promise<{
          goto: (url: string, opts?: object) => Promise<unknown>;
          locator: (sel: string) => {
            waitFor: (opts: object) => Promise<unknown>;
            screenshot: (opts: object) => Promise<Buffer>;
          };
          waitForTimeout: (ms: number) => Promise<void>;
        }>;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };

  try {
    const playwright = await import("playwright");
    chromium = playwright.chromium;
  } catch (err) {
    console.error("[id/render] playwright import failed", err);
    return NextResponse.json(
      {
        error: "مكتبة Playwright غير متاحة",
        installCommand: "npx playwright install chromium",
      },
      { status: 500 }
    );
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
    } catch (launchError) {
      console.error("[id/render] browser launch failed", launchError);
      const details =
        launchError instanceof Error ? launchError.message : String(launchError);
      return NextResponse.json(
        {
          error: "فشل تشغيل المتصفح",
          details,
          installCommand: "npx playwright install chromium",
        },
        { status: 500 }
      );
    }

    const context = await browser.newContext({
      viewport: { width: 1024, height: 640 },
      deviceScaleFactor: 3,
    });
    const page = await context.newPage();
    const target = `${baseUrl}/id-template/${encodeURIComponent(serial)}/${side}`;

    try {
      await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(400);
      const cardEl = page.locator("#id-card-root");
      await cardEl.waitFor({ state: "visible", timeout: 15000 });
      const buffer = await cardEl.screenshot({ type: "png" });

      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${serial}-${side}.png"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        },
      });
    } finally {
      await context.close().catch(() => undefined);
    }
  } catch (err) {
    console.error("[id/render] render failed", err);
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "فشل توليد صورة الهوية",
        details,
      },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}
