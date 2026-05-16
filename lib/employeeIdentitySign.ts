import crypto from "crypto";
import { getStaffSiteBaseUrl } from "./staffIdentityConfig";

function getSecret(): string {
  const secret = process.env.RESULT_QR_SECRET || "";
  if (!secret) {
    throw new Error("RESULT_QR_SECRET is not set");
  }
  return secret;
}

export function buildEmployeeVerifyToken(identityNumber: string, requestId: string): string {
  const payload = `employee|${identityNumber}|${requestId}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifyEmployeeToken(identityNumber: string, requestId: string, token: string): boolean {
  if (!identityNumber || !requestId || !token) return false;
  try {
    const expected = buildEmployeeVerifyToken(identityNumber, requestId);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildEmployeeVerifyUrl(identityNumber: string, requestId: string): string {
  const token = buildEmployeeVerifyToken(identityNumber, requestId);
  return `${getStaffSiteBaseUrl()}/verify-employee?id=${encodeURIComponent(identityNumber)}&t=${token}`;
}
