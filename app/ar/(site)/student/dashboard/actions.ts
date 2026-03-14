"use server";

import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResultsSecure } from "@/lib/resultsRepo";
import { signResult } from "@/lib/resultSignature";

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

/**
 * إرجاع رابط تحميل PDF للنتيجة يمكن مشاركته مع الآخرين دون الحاجة لتسجيل الدخول.
 * الرابط يعتمد على التوقيع الرقمي (rid, sid, sig) ويمكن لأي شخص فتحه وتحميل النتيجة.
 */
export async function getShareablePdfUrl(
  attemptNumber: 1 | 2
): Promise<{ url: string } | { error: string }> {
  try {
    const session = await getStudentSession();
    if (!session?.studentId) {
      return { error: "يجب تسجيل الدخول" };
    }

    const student = await getStudentById(session.studentId);
    if (!student) {
      return { error: "الطالب غير موجود" };
    }

    if (!student.financialClearance) {
      return { error: "الحساب المالي غير مسدد" };
    }

    const resultsResponse = await getStudentResultsSecure(
      session.studentId,
      ACADEMIC_YEAR,
      SEMESTER
    );

    if (resultsResponse.error || !resultsResponse.results) {
      return { error: "لا توجد نتائج متاحة" };
    }

    const attemptLabel = getAttemptLabel(attemptNumber);
    const result = resultsResponse.results.find((r) => r.attempt === attemptLabel);
    if (!result) {
      return { error: "لا توجد نتيجة لهذا الدور" };
    }

    const rid = String(result.id);
    const sid = String(session.studentId);
    const sig = signResult(rid, sid);

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
    const url = `${base}/api/public/results/pdf?rid=${encodeURIComponent(rid)}&sid=${encodeURIComponent(sid)}&sig=${sig}&attempt=${attemptNumber}`;

    return { url };
  } catch (err) {
    console.error("getShareablePdfUrl error:", err);
    return { error: "حدث خطأ أثناء إنشاء الرابط" };
  }
}
