/** تشغيل Chromium لـ Playwright بشكل متوافق مع سيرفرات Linux/PM2 */

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--font-render-hinting=none",
];

function candidateExecutables(): string[] {
  return [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROMIUM_PATH,
    process.env.GOOGLE_CHROME_BIN,
    process.env.CHROME_BIN,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/snap/bin/chromium",
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

export async function launchChromiumForPdf() {
  const { chromium } = await import("playwright");
  const errors: string[] = [];

  try {
    return await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  for (const executablePath of candidateExecutables()) {
    try {
      return await chromium.launch({
        headless: true,
        executablePath,
        args: LAUNCH_ARGS,
      });
    } catch (err) {
      errors.push(
        `${executablePath}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const details = errors.filter(Boolean).join(" | ") || "unknown launch error";
  const error = new Error(
    `Failed to launch Chromium for PDF. ${details}. Fix: npx playwright install --with-deps chromium`
  );
  (error as Error & { installCommand?: string }).installCommand =
    "npx playwright install --with-deps chromium";
  throw error;
}
