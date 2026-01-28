import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const STUDENT_SESSION_COOKIE = "shau_student_session";
const STUDENT_SESSION_SECRET = process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "default-secret-change-in-production";

function getSecret(): string {
  const secret = STUDENT_SESSION_SECRET;
  if (!secret || secret === "default-secret-change-in-production") {
    throw new Error("STUDENT_SESSION_SECRET must be set");
  }
  return secret;
}

function signStudentSessionValue(studentId: string): string {
  const secret = getSecret();
  const payload = JSON.stringify({ studentId, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }); // 30 days
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyStudentSessionValue(value: string): { studentId: string } | null {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;

    const secret = getSecret();
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");
    
    if (signature.length !== expectedSignature.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

    const data = JSON.parse(payload);
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;

    return { studentId: data.studentId };
  } catch {
    return null;
  }
}

export async function setStudentSessionCookie(studentId: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const token = signStudentSessionValue(studentId);

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function getStudentSession(): Promise<{ studentId: string } | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(STUDENT_SESSION_COOKIE);
    if (!cookie?.value) return null;
    return verifyStudentSessionValue(cookie.value);
  } catch {
    return null;
  }
}

export async function clearStudentSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_SESSION_COOKIE);
}
