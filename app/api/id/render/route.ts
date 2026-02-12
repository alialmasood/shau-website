import { NextRequest, NextResponse } from "next/server";
import { getStudentIdCardBySerial } from "@/lib/studentIdCardsRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function safeFileName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "هوية";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const serial = String(url.searchParams.get("serial") ?? "").trim();
  const side = String(url.searchParams.get("side") ?? "").trim();

  if (!serial || (side !== "ar" && side !== "en")) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const card = await getStudentIdCardBySerial(serial);
  const baseName = card ? safeFileName(card.nameAr) : serial;
  const sideLabel = side === "ar" ? "وجه عربي" : "وجه انكليزي";
  const downloadName = `${baseName} - ${sideLabel}.png`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  if (!baseUrl) {
    return NextResponse.json({ error: "Missing base URL" }, { status: 500 });
  }

  let chromium: any;
  try {
    const playwright = await import("playwright");
    chromium = playwright.chromium;
  } catch (err) {
    return NextResponse.json({ error: "Playwright not available" }, { status: 500 });
  }

  let browser: any;
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
  } catch (err) {
    return NextResponse.json({ error: "Failed to launch browser" }, { status: 500 });
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 640 },
      deviceScaleFactor: 3,
    });
    const page = await context.newPage();
    const target = `${baseUrl}/id-template/${encodeURIComponent(serial)}/${side}`;
    await page.goto(target, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const card = page.locator("#id-card-root");
    await card.waitFor({ state: "visible" });
    const buffer = await card.screenshot({ type: "png" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${serial}-${side}.png"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      },
    });
  } finally {
    await browser.close();
  }
}
