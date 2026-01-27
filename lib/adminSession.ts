import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "shau_admin_session";

type SessionPayload = {
  sub: string; // admin id (uuid)
  exp: number; // unix seconds
};

function base64UrlEncode(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecodeToString(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing ADMIN_SESSION_SECRET in production.");
    }
    return "dev-admin-session-secret";
  }
  return secret;
}

function sign(data: string) {
  return base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(data).digest()
  );
}

export function createAdminSessionValue(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifyAdminSessionValue(value: string | undefined | null) {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  // مقارنة ثابتة لتجنب timing attacks
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = base64UrlDecodeToString(body);
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload?.sub || !payload?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(adminId: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days
  const payload: SessionPayload = {
    sub: adminId,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const value = createAdminSessionValue(payload);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  // حذف الـ cookie بضبط maxAge إلى 0 و expires إلى تاريخ في الماضي
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_SESSION_COOKIE);
    
    if (!cookie) {
      console.warn("[getAdminSession] Cookie not found in request");
      return null;
    }

    const value = cookie.value;
    if (!value) {
      console.warn("[getAdminSession] Cookie value is empty");
      return null;
    }

    const secret = getSecret();
    if (!secret) {
      console.error("[getAdminSession] ADMIN_SESSION_SECRET is not set");
      return null;
    }

    const session = verifyAdminSessionValue(value);
    if (!session) {
      console.warn("[getAdminSession] Cookie verification failed - may be expired or invalid signature");
    } else {
      console.log(`[getAdminSession] Session verified successfully for user: ${session.sub}`);
    }
    
    return session;
  } catch (error) {
    console.error("[getAdminSession] Error getting session:", error);
    if (error instanceof Error) {
      console.error("[getAdminSession] Error message:", error.message);
    }
    return null;
  }
}

