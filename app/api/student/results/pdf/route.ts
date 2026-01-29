import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResultsSecure } from "@/lib/resultsRepo";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

export async function GET(request: NextRequest) {
  try {
    // Get student session (security: always use session, never from query params)
    const session = await getStudentSession();
    if (!session || !session.studentId) {
      return NextResponse.json(
        { error: "غير مصرح - يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    // Get student record
    const student = await getStudentById(session.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "الطالب غير موجود" },
        { status: 404 }
      );
    }

    // SECURITY CHECK: Verify financial clearance
    if (!student.financialClearance) {
      return NextResponse.json(
        { error: "الحساب المالي غير مسدد" },
        { status: 403 }
      );
    }

    // Get attempt from query params (default to 1)
    const searchParams = request.nextUrl.searchParams;
    const attemptParam = searchParams.get("attempt") || "1";
    const attemptNumber = attemptParam === "2" ? 2 : 1;
    const attemptLabel = getAttemptLabel(attemptNumber);

    // Get results securely
    const resultsResponse = await getStudentResultsSecure(
      session.studentId,
      ACADEMIC_YEAR,
      SEMESTER
    );

    if (resultsResponse.error || !resultsResponse.results) {
      return NextResponse.json(
        { error: "لا توجد نتائج متاحة" },
        { status: 404 }
      );
    }

    // Filter results by attempt
    const result = resultsResponse.results.find((r) => r.attempt === attemptLabel);
    if (!result) {
      return NextResponse.json(
        { error: "لا توجد نتيجة لهذا الدور" },
        { status: 404 }
      );
    }

    // Get base URL for PDF generation
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BASE_URL ?? "http://localhost:3020";
    
    // Validate BASE_URL
    if (!BASE_URL || BASE_URL.includes("localhost") && process.env.NODE_ENV === "production") {
      console.error("Invalid BASE_URL in production:", BASE_URL);
      return NextResponse.json(
        { error: "خطأ في إعدادات السيرفر - BASE_URL غير صحيح" },
        { status: 500 }
      );
    }

    // Extract domain from BASE_URL
    let domain: string;
    try {
      const urlObj = new URL(BASE_URL);
      domain = urlObj.hostname;
    } catch (urlError) {
      console.error("Invalid BASE_URL format:", BASE_URL, urlError);
      return NextResponse.json(
        { error: "خطأ في إعدادات السيرفر - BASE_URL غير صحيح" },
        { status: 500 }
      );
    }

    // Read cookies from incoming request
    const cookieHeader = request.headers.get("cookie") || "";
    const STUDENT_SESSION_COOKIE_NAME = "shau_student_session";
    
    // Extract session cookie value
    let sessionCookieValue: string | null = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map(c => c.trim());
      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.split("=");
        if (name.trim() === STUDENT_SESSION_COOKIE_NAME) {
          sessionCookieValue = valueParts.join("=");
          break;
        }
      }
    }

    if (!sessionCookieValue) {
      console.error("Session cookie not found in request");
      return NextResponse.json(
        { error: "جلسة غير صالحة - يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    // Import playwright dynamically (only when needed)
    let chromium: any;
    try {
      const playwright = await import("playwright");
      chromium = playwright.chromium;
    } catch (importError) {
      console.error("Failed to import playwright:", importError);
      return NextResponse.json(
        { error: "خطأ في تحميل مكتبة PDF - تأكد من تثبيت Playwright" },
        { status: 500 }
      );
    }

    // Launch browser
    let browser: any;
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ], // Important for production servers
      });
    } catch (launchError) {
      console.error("Failed to launch browser:", launchError);
      const errorDetails = launchError instanceof Error ? launchError.message : String(launchError);
      console.error("Error details:", errorDetails);
      
      // Check if it's a browser not found error
      if (errorDetails.includes("Executable doesn't exist") || 
          errorDetails.includes("BrowserType.launch") ||
          errorDetails.includes("chromium") ||
          errorDetails.includes("browserType")) {
        return NextResponse.json(
          { 
            error: "فشل تشغيل المتصفح - تأكد من تثبيت متصفحات Playwright",
            details: "قم بتنفيذ الأمر التالي على السيرفر: npx playwright install chromium",
            installCommand: "npx playwright install chromium"
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "فشل تشغيل المتصفح",
          details: errorDetails,
          solution: "تأكد من تثبيت متصفحات Playwright: npx playwright install chromium"
        },
        { status: 500 }
      );
    }

    try {
      // Create browser context with cookies
      const context = await browser.newContext();
      
      // Add session cookie to browser context
      try {
        await context.addCookies([
          {
            name: STUDENT_SESSION_COOKIE_NAME,
            value: sessionCookieValue,
            domain: domain,
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax" as const,
          },
        ]);
      } catch (cookieError) {
        console.error("Failed to add cookies:", cookieError);
        await browser.close();
        return NextResponse.json(
          { error: "فشل إضافة الكوكيز" },
          { status: 500 }
        );
      }

      const page = await context.newPage();

      // Navigate to print result page (using print route group)
      const url = `${BASE_URL}/ar/student/print-result?attempt=${attemptNumber}`;
      console.log("Navigating to:", url);
      
      try {
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
      } catch (navigationError) {
        console.error("Navigation error:", navigationError);
        await browser.close();
        return NextResponse.json(
          { error: `فشل تحميل الصفحة: ${navigationError instanceof Error ? navigationError.message : "خطأ غير معروف"}` },
          { status: 500 }
        );
      }

      // Wait for the result-print-root to ensure page is fully loaded
      try {
        await page.waitForSelector("#result-print-root", { timeout: 15000 });
      } catch (selectorError) {
        console.error("Selector not found:", selectorError);
        // Try to get page content for debugging
        const pageContent = await page.content();
        console.error("Page content length:", pageContent.length);
        await browser.close();
        return NextResponse.json(
          { error: "فشل تحميل محتوى الصفحة - العنصر المطلوب غير موجود" },
          { status: 500 }
        );
      }

      // Generate PDF with CSS page size preference
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm",
          },
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        await browser.close();
        return NextResponse.json(
          { error: `فشل توليد PDF: ${pdfError instanceof Error ? pdfError.message : "خطأ غير معروف"}` },
          { status: 500 }
        );
      }

      await context.close();
      await browser.close();

      // Generate filename
      const filename = `result_${student.studentId}_2025-2026_sem1_attempt${attemptNumber}.pdf`;

      // Convert Buffer to Uint8Array for NextResponse
      const pdfArray = new Uint8Array(pdfBuffer);

      // Return PDF as response
      return new NextResponse(pdfArray, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (playwrightError) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser:", closeError);
        }
      }
      console.error("Playwright PDF generation error:", playwrightError);
      const errorMessage = playwrightError instanceof Error ? playwrightError.message : "خطأ غير معروف";
      return NextResponse.json(
        { error: `فشل توليد PDF: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
    return NextResponse.json(
      { error: `حدث خطأ أثناء توليد PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}
