import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.RESULT_QR_SECRET || "";
  if (!secret) {
    throw new Error("RESULT_QR_SECRET is not set");
  }
  return secret;
}

export function buildStaffVerifyToken(identityNumber: string, requestId: string): string {
  const payload = `staff|${identityNumber}|${requestId}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifyStaffToken(identityNumber: string, requestId: string, token: string): boolean {
  if (!identityNumber || !requestId || !token) return false;
  try {
    const expected = buildStaffVerifyToken(identityNumber, requestId);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildStaffVerifyUrl(identityNumber: string, requestId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3020";
  const token = buildStaffVerifyToken(identityNumber, requestId);
  return `${base}/verify-staff?id=${encodeURIComponent(identityNumber)}&t=${token}`;
}
