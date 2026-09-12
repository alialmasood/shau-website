import crypto from "crypto";
import { query } from "./db";

const CODE_PREFIX = "IC26-";
const CODE_DIGITS = 8;

/** أبجدية واضحة بدون O/0 و I/1/L */
export const IC_TRACKING_TOKEN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TRACKING_SEGMENT_LEN = 4;

export function isValidParticipationCode(value: string): boolean {
  return /^IC26-\d{8}$/.test(String(value || "").trim());
}

function randomParticipationCandidate(): string {
  const n = crypto.randomInt(0, 10 ** CODE_DIGITS);
  return `${CODE_PREFIX}${String(n).padStart(CODE_DIGITS, "0")}`;
}

/** يولّد رمزاً فريداً بصيغة IC26-######## مع فحص uniqueness */
export async function generateUniqueParticipationCode(maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = randomParticipationCandidate();
    const exists = await query(
      `SELECT 1 FROM innovation_conference_applications WHERE participation_code = $1 LIMIT 1`,
      [candidate]
    );
    if (exists.rows.length === 0) return candidate;
  }
  throw new Error("تعذر إنشاء رقم مشاركة فريد");
}

function randomTrackingSegment(): string {
  let out = "";
  for (let i = 0; i < TRACKING_SEGMENT_LEN; i++) {
    const idx = crypto.randomInt(0, IC_TRACKING_TOKEN_ALPHABET.length);
    out += IC_TRACKING_TOKEN_ALPHABET[idx]!;
  }
  return out;
}

/** رمز متابعة قصير بصيغة XXXX-XXXX — لا يُخزَّن خام في DB */
export function generateTrackingToken(): string {
  return `${randomTrackingSegment()}-${randomTrackingSegment()}`;
}

/**
 * تطبيع رمز المتابعة قبل التحقق:
 * trim + uppercase + إزالة الشرطات/الفراغات
 * يعيد الشكل القياسي XXXX-XXXX أو null إن كان غير صالح
 */
export function normalizeTrackingToken(raw: string): string | null {
  const cleaned = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== TRACKING_SEGMENT_LEN * 2) return null;
  for (const ch of cleaned) {
    if (!IC_TRACKING_TOKEN_ALPHABET.includes(ch)) return null;
  }
  return `${cleaned.slice(0, TRACKING_SEGMENT_LEN)}-${cleaned.slice(TRACKING_SEGMENT_LEN)}`;
}

export function isValidTrackingTokenFormat(raw: string): boolean {
  return normalizeTrackingToken(raw) != null;
}

/** SHA-256 hex للتخزين — لا تسجّل القيمة الخام في logs */
export function hashTrackingToken(token: string): string {
  const normalized = normalizeTrackingToken(token) ?? String(token).trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function verifyTrackingToken(token: string, storedHash: string): boolean {
  const normalized = normalizeTrackingToken(token);
  if (!normalized) return false;
  const incoming = hashTrackingToken(normalized);
  const a = Buffer.from(incoming, "utf8");
  const b = Buffer.from(String(storedHash || ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** توليد token + hash مع ضمان عدم تكرار الـhash في DB */
export async function generateUniqueTrackingToken(
  maxAttempts = 24
): Promise<{ token: string; hash: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const token = generateTrackingToken();
    const hash = hashTrackingToken(token);
    const exists = await query(
      `SELECT 1 FROM innovation_conference_applications WHERE tracking_token_hash = $1 LIMIT 1`,
      [hash]
    );
    if (exists.rows.length === 0) return { token, hash };
  }
  throw new Error("تعذر إنشاء رمز متابعة فريد");
}
