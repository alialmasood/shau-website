import { query } from "@/lib/db";

/**
 * إرجاع media_id لملف PDF الرسوم الدراسية إن وُجد.
 * يُستخدَم في الهوم وصفحة الرسوم لعرض زر التحميل.
 */
export async function getTuitionPdfMediaId(): Promise<string | null> {
  const res = await query(
    `SELECT media_id FROM tuition_pdf ORDER BY id DESC LIMIT 1`
  );
  if (res.rows.length === 0) return null;
  return String(res.rows[0].media_id ?? "");
}

/** إرجاع بيانات الملف الحالي (للعرض في الأدمن) */
export async function getTuitionPdfInfo(): Promise<{ mediaId: string; filename: string } | null> {
  const res = await query(
    `SELECT t.media_id, m.filename
     FROM tuition_pdf t
     JOIN media m ON m.id = t.media_id
     ORDER BY t.id DESC LIMIT 1`
  );
  if (res.rows.length === 0) return null;
  return { mediaId: String(res.rows[0].media_id), filename: String(res.rows[0].filename || "document.pdf") };
}

/**
 * تعيين ملف PDF الرسوم الدراسية (يستبدل أي ملف سابق).
 * mediaId يجب أن يكون من جدول media ونوع الملف application/pdf.
 */
export async function setTuitionPdfMediaId(mediaId: string): Promise<void> {
  const id = String(mediaId ?? "").trim();
  if (!id) throw new Error("معرف الوسيط مطلوب");
  const chk = await query(`SELECT mime_type FROM media WHERE id = $1 LIMIT 1`, [id]);
  if (chk.rows.length === 0) throw new Error("الوسيط غير موجود");
  if (String(chk.rows[0].mime_type) !== "application/pdf") throw new Error("يجب أن يكون الملف من نوع PDF");
  await query(`DELETE FROM tuition_pdf`);
  await query(`INSERT INTO tuition_pdf (media_id) VALUES ($1)`, [id]);
}
