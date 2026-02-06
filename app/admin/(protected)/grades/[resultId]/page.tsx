import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getResultWithStudentById } from "@/lib/resultsRepo";
import GradesEditor from "../GradesEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGradesDetailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" ||
    roleUpper === "EXAM_COMMITTEE" ||
    (await canAdmin("grades", "access"));

  if (!hasAccess) {
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

  const { resultId } = await params;
  const result = await getResultWithStudentById(resultId);
  if (!result) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ النتيجة غير موجودة</p>
          <Link href="/admin/grades" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى إدارة الدرجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">إدارة درجات الطالب</h1>
            <p className="mt-2 text-sm text-neutral-600">
              {result.studentName || "غير معروف"} — {result.studentId}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/grades"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500">القسم</div>
            <div className="font-bold text-neutral-900">{result.departmentCode}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500">المرحلة</div>
            <div className="font-bold text-neutral-900">{result.stage}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500">نوع الدراسة</div>
            <div className="font-bold text-neutral-900">{result.studyType}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500">الدور</div>
            <div className="font-bold text-neutral-900">{result.attempt}</div>
          </div>
        </div>

        <GradesEditor resultId={result.id} subjects={result.subjectsJson as Array<Record<string, unknown>>} />
      </div>
    </div>
  );
}
