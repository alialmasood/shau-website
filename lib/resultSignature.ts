import crypto from "crypto";

/**
 * توليد توقيع رقمي للنتيجة (HMAC-SHA256)
 * يُستخدم لإنشاء روابط تحقق ومشاركة آمنة
 */
export function signResult(resultId: string, studentId: string): string {
  const secret = process.env.RESULT_QR_SECRET;
  if (!secret || secret === "YOUR_STRONG_RANDOM_SECRET_HERE") {
    const fallbackSecret =
      process.env.STUDENT_SESSION_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      "fallback-secret";
    const payload = `${resultId}:${studentId}`;
    return crypto.createHmac("sha256", fallbackSecret).update(payload).digest("hex");
  }
  const payload = `${resultId}:${studentId}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * التحقق من صحة التوقيع الرقمي
 */
export function verifySig(rid: string, sid: string, sig: string): boolean {
  const secret = process.env.RESULT_QR_SECRET;
  if (!secret || secret === "YOUR_STRONG_RANDOM_SECRET_HERE") {
    const fallbackSecret =
      process.env.STUDENT_SESSION_SECRET ||
      process.env.ADMIN_SESSION_SECRET ||
      "fallback-secret";
    const payload = `${rid}:${sid}`;
    const expected = crypto.createHmac("sha256", fallbackSecret).update(payload).digest("hex");
    return expected === sig;
  }
  const payload = `${rid}:${sid}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === sig;
}
