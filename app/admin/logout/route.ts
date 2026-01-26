import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

export async function GET(request: NextRequest) {
  // حذف الـ cookie باستخدام الدالة المخصصة
  await clearAdminSessionCookie();
  
  // إنشاء URL للتوجيه
  const loginUrl = new URL("/admin/login", request.url);
  
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