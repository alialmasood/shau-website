import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getResultsAdminList } from "@/lib/resultsRepo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
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

  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = params.q || "";

  const { results, total } = await getResultsAdminList({
    search: q,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">إدارة الدرجات</h1>
            <p className="mt-2 text-sm text-neutral-600">
              عرض وتعديل درجات الطلاب التي تم استيرادها من صفحة النتائج
            </p>
          </div>
          <Link
            href="/admin/results"
            className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            رجوع إلى النتائج
          </Link>
        </div>

        <form className="mb-4 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث بالرقم الجامعي أو الاسم"
            className="h-10 flex-1 px-4 rounded-xl border border-neutral-300"
          />
          <button className="h-10 px-5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a]">
            بحث
          </button>
        </form>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-3 text-right">الطالب</th>
                <th className="p-3 text-right">القسم</th>
                <th className="p-3 text-right">المرحلة</th>
                <th className="p-3 text-right">الدور</th>
                <th className="p-3 text-right">آخر تحديث</th>
                <th className="p-3 text-right">إدارة</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">
                      <div className="font-semibold text-neutral-900">{r.studentName || "غير معروف"}</div>
                      <div className="text-xs text-neutral-500">{r.studentId}</div>
                    </td>
                    <td className="p-3">{r.departmentCode}</td>
                    <td className="p-3">{r.stage}</td>
                    <td className="p-3">{r.attempt}</td>
                    <td className="p-3">
                      {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString("ar-IQ") : "—"}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/grades/${r.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold hover:bg-blue-200"
                      >
                        تعديل الدرجات
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              صفحة {page} من {totalPages}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/grades?page=${Math.max(1, page - 1)}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`}
                className={`px-3 py-1.5 rounded-lg border ${
                  page <= 1 ? "text-neutral-400 border-neutral-200 pointer-events-none" : "text-neutral-700 border-neutral-300"
                }`}
              >
                السابق
              </Link>
              <Link
                href={`/admin/grades?page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`}
                className={`px-3 py-1.5 rounded-lg border ${
                  page >= totalPages
                    ? "text-neutral-400 border-neutral-200 pointer-events-none"
                    : "text-neutral-700 border-neutral-300"
                }`}
              >
                التالي
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
