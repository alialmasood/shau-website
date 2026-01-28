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
    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";

    // Extract domain from BASE_URL
    const urlObj = new URL(BASE_URL);
    const domain = urlObj.hostname;

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
      return NextResponse.json(
        { error: "جلسة غير صالحة - يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    // Import playwright dynamically (only when needed)
    const { chromium } = await import("playwright");

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      // Create browser context with cookies
      const context = await browser.newContext();
      
      // Add session cookie to browser context
      await context.addCookies([
        {
          name: STUDENT_SESSION_COOKIE_NAME,
          value: sessionCookieValue,
          domain: domain,
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Lax",
        },
      ]);

      const page = await context.newPage();

      // Navigate to print result page (using print route group)
      const url = `${BASE_URL}/ar/student/print-result?attempt=${attemptNumber}`;
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for the result-print-root to ensure page is fully loaded
      await page.waitForSelector("#result-print-root", { timeout: 15000 });

      // Generate PDF with CSS page size preference
      const pdfBuffer = await page.pdf({
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
      await browser.close();
      console.error("Playwright PDF generation error:", playwrightError);
      return NextResponse.json(
        { error: "فشل توليد PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء توليد PDF" },
      { status: 500 }
    );
  }
}
