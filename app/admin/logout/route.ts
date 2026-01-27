import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

export async function GET(request: NextRequest) {
  // حذف الـ cookie باستخدام الدالة المخصصة
  await clearAdminSessionCookie();
  
  // بناء URL صحيح من headers الطلب (للتعامل مع reverse proxy)
  let loginUrl: string | URL;
  try {
    // الحصول على host من headers (يدعم reverse proxy)
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    const protocol = request.headers.get("x-forwarded-proto") || 
                     (request.url.startsWith("https://") ? "https" : "http");
    
    if (host) {
      // بناء URL كامل من host و protocol
      loginUrl = new URL("/admin/login", `${protocol}://${host}`);
    } else {
      // في حالة عدم وجود host في headers، استخدام request.url
      const url = new URL(request.url);
      loginUrl = new URL("/admin/login", url.origin);
    }
  } catch (error) {
    console.error("[logout] Error building login URL:", error);
    // في حالة فشل، استخدام مسار نسبي (Next.js سيتعامل معه)
    loginUrl = "/admin/login";
  }
  
  // إنشاء response مع redirect
  const res = NextResponse.redirect(loginUrl);
  
  // التأكد من حذف الـ cookie في الـ response أيضاً (بجميع الطرق الممكنة)
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  
  // حذف الـ cookie أيضاً
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  
  // إضافة headers لمنع الـ cache
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("X-Accel-Expires", "0");
  
  return res;
}