import crypto from "crypto";
import { query } from "./db";

const PREFIX = "SH";
const DIGITS = 8;

export function isValidStaffIdentityNumber(value: string): boolean {
  return /^SH\d{8}$/.test(String(value || "").trim());
}

function randomCandidate(): string {
  const n = crypto.randomInt(0, 10 ** DIGITS);
  return `${PREFIX}${String(n).padStart(DIGITS, "0")}`;
}

export async function generateUniqueStaffIdentityNumber(maxAttempts = 40): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = randomCandidate();
    const exists = await query(
      `SELECT 1 FROM staff_identity_requests WHERE identity_number = $1 LIMIT 1`,
      [candidate]
    );
    if (exists.rows.length === 0) return candidate;
  }
  throw new Error("تعذر إنشاء رقم هوية فريد");
}
