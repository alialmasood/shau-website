import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", request.url));
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

