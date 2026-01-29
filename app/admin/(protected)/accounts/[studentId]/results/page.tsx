import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { getStudentById } from "@/lib/studentsRepo";
import { query } from "@/lib/db";
import { getFinalEvaluationAndResult } from "@/lib/grades";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentResultsHistoryPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية - فقط ACCOUNTS أو ADMIN
  if (user.role !== "ACCOUNTS" && user.role !== "ADMIN") {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const { studentId } = await params;
  const student = await getStudentById(studentId);

  if (!student) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">الطالب غير موجود</p>
          <Link href="/admin/accounts" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى الحسابات
          </Link>
        </div>
      </div>
    );
  }

  // جلب جميع النتائج لهذا الطالب
  const resultsRes = await query(
    `SELECT 
      r.id,
      r.student_id,
      r.department_code,
      r.academic_year,
      r.semester,
      r.stage,
      r.study_type,
      r.attempt,
      r.summary_json,
      r.subjects_json,
      r.uploaded_at,
      r.uploaded_by,
      au.full_name as uploaded_by_name
    FROM results r
    LEFT JOIN admin_users au ON r.uploaded_by = au.id
    WHERE r.student_id = $1
    ORDER BY r.academic_year DESC, r.semester DESC, r.attempt DESC, r.uploaded_at DESC`,
    [studentId]
  );

  const results = resultsRes.rows.map((r) => ({
    id: String(r.id),
    departmentCode: String(r.department_code),
    academicYear: String(r.academic_year),
    semester: String(r.semester),
    stage: String(r.stage),
    studyType: String(r.study_type || ""),
    attempt: String(r.attempt),
    summaryJson: r.summary_json,
    subjectsJson: r.subjects_json,
    uploadedAt: r.uploaded_at ? new Date(r.uploaded_at as string).toISOString() : null,
    uploadedByName: r.uploaded_by_name ? String(r.uploaded_by_name) : null,
  }));

  const departments: Record<string, string> = {
    DENTAL_TECH: "تقنيات صناعة الأسنان",
    ANESTHESIA_TECH: "تقنيات التخدير",
    RADIOLOGY_TECH: "تقنيات الأشعة",
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/admin/accounts"
            prefetch={false}
            className="text-[#31BD9C] hover:underline text-sm mb-4 inline-block"
          >
            ← العودة إلى الحسابات
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            سجل النتائج - {student.fullName}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            رقم الطالب: {student.studentId} | القسم: {departments[student.departmentCode] || student.departmentCode}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">لا توجد نتائج مسجلة لهذا الطالب</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => {
                const summary = result.summaryJson && typeof result.summaryJson === "object"
                  ? result.summaryJson as Record<string, unknown>
                  : null;
                
                // Calculate evaluation from average, finalStatus from MIN of subject scores (ministerial logic)
                const { evaluation, finalStatus } = getFinalEvaluationAndResult(
                  summary,
                  result.subjectsJson as Array<{ score?: number | string | null }> | undefined
                );
                
                const total = summary?.total ? Number(summary.total) : null;
                const average = summary?.avg ?? summary?.average ? Number(summary.avg ?? summary.average) : null;

                return (
                  <div
                    key={result.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">القسم</p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {departments[result.departmentCode] || result.departmentCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">السنة الأكاديمية</p>
                        <p className="text-sm font-semibold text-neutral-900">{result.academicYear}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">الفصل الدراسي</p>
                        <p className="text-sm font-semibold text-neutral-900">{result.semester}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">المرحلة</p>
                        <p className="text-sm font-semibold text-neutral-900">{result.stage}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">نوع الدراسة</p>
                        <p className="text-sm font-semibold text-neutral-900">{result.studyType || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">الدور</p>
                        <p className="text-sm font-semibold text-neutral-900">{result.attempt}</p>
                      </div>
                    </div>

                    {(finalStatus || evaluation || total !== null || average !== null) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-200">
                        {finalStatus && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">النتيجة النهائية</p>
                            <p className="text-sm font-bold text-[#31BD9C]">{finalStatus}</p>
                          </div>
                        )}
                        {evaluation && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">التقييم</p>
                            <p className="text-sm font-bold text-neutral-900">{evaluation}</p>
                          </div>
                        )}
                        {total !== null && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">المجموع</p>
                            <p className="text-sm font-semibold text-neutral-900">{total}</p>
                          </div>
                        )}
                        {average !== null && (
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">المعدل</p>
                            <p className="text-sm font-semibold text-neutral-900">{average.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {result.uploadedAt && (
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <p className="text-xs text-neutral-400">
                          تم الرفع: {new Date(result.uploadedAt).toLocaleDateString("ar-IQ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {result.uploadedByName && ` بواسطة ${result.uploadedByName}`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
