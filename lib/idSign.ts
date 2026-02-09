import crypto from "crypto";

function normalizeDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function buildVerifyToken(serial: string, dobISO: string, expiryISO: string): string {
  const secret = process.env.RESULT_QR_SECRET || "";
  if (!secret) {
    throw new Error("RESULT_QR_SECRET is not set");
  }
  const payload = `${serial}|${dobISO}|${expiryISO}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyToken(serial: string, dob: string | Date, expiry: string | Date, token: string): boolean {
  const dobISO = normalizeDate(dob);
  const expiryISO = normalizeDate(expiry);
  if (!dobISO || !expiryISO || !token) return false;
  const expected = buildVerifyToken(serial, dobISO, expiryISO);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function formatDateISO(value: string | Date): string {
  return normalizeDate(value);
}
