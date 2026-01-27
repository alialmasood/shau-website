import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

export async function GET(request: NextRequest) {
  // حذف الـ cookie باستخدام الدالة المخصصة
  await clearAdminSessionCookie();
  
  // استخدام مسار نسبي - Next.js سيتعامل معه تلقائياً
  // أو بناء URL من request.url بشكل صحيح
  let loginUrl: string | URL;
  try {
    // محاولة بناء URL من request.url
    const url = new URL(request.url);
    loginUrl = new URL("/admin/login", url.origin);
  } catch {
    // في حالة فشل، استخدام مسار نسبي
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