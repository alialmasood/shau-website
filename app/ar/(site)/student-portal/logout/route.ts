import { NextRequest, NextResponse } from "next/server";
import { clearStudentSessionCookie } from "@/lib/studentSession";

export async function GET(request: NextRequest) {
  await clearStudentSessionCookie();

  let loginUrl: string | URL;
  try {
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    const protocol = request.headers.get("x-forwarded-proto") ||
                     (request.url.startsWith("https://") ? "https" : "http");

    if (host) {
      loginUrl = new URL("/ar/student-portal/login", `${protocol}://${host}`);
    } else {
      const url = new URL(request.url);
      loginUrl = new URL("/ar/student-portal/login", url.origin);
    }
  } catch (error) {
    console.error("[student logout] Error building login URL:", error);
    loginUrl = "/ar/student-portal/login";
  }

  return NextResponse.redirect(loginUrl);
}
