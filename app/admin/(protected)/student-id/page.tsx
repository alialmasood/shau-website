import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import StudentIdForm from "./StudentIdForm";
import PreviewActions from "./PreviewActions";
import StudentIdRowActions from "./StudentIdRowActions";
import StudentDirectoryImport from "./StudentDirectoryImport";
import {
  getStudentIdCardsCount,
  getStudentIdCardsList,
  getStudentIdDepartmentsStats,
  getStudentIdStagesList,
} from "@/lib/studentIdCardsRepo";
import { getStudentDirectoryStats } from "@/lib/studentDirectoryRepo";

export default async function AdminStudentIdPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string; q?: string; department?: string; stage?: string }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));

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
  const isEditing = Boolean(String(params.serial ?? "").trim());
  const searchQuery = isEditing ? "" : String(params.q ?? "").trim();
  const departmentFilter = isEditing ? "" : String(params.department ?? "").trim();
  const stageFilter = isEditing ? "" : String(params.stage ?? "").trim();

  const totalCards = await getStudentIdCardsCount();
  const latestCards = await getStudentIdCardsList({
    limit: 50,
    search: searchQuery,
    department: departmentFilter,
    stage: stageFilter,
  });
  const departmentsStats = await getStudentIdDepartmentsStats();
  const stageOptions = await getStudentIdStagesList();
  const departmentsCount = departmentsStats.length;
  const directoryStats = await getStudentDirectoryStats();

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            إنشاء هوية طالب
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            إدخال بيانات الهوية وحفظها
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-neutral-500">عدد الهويات المسجلة</p>
            <p className="text-2xl font-bold text-neutral-900">{totalCards}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-neutral-500">عدد الأقسام التي لديها هويات</p>
            <p className="text-2xl font-bold text-neutral-900">{departmentsCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-neutral-500">عدد الطلبة</p>
            <p className="text-2xl font-bold text-neutral-900">{totalCards}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-neutral-500">عدد الأسماء في الدليل</p>
            <p className="text-2xl font-bold text-neutral-900">{directoryStats.total}</p>
          </div>
        </div>
        {departmentsStats.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">إحصائيات الأقسام</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departmentsStats.map((dept) => (
                <div
                  key={dept.department}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-neutral-900">{dept.department}</p>
                  <p className="text-xs text-neutral-500 mt-1">عدد الطلبة</p>
                  <p className="text-lg font-bold text-neutral-900">{dept.total}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <PreviewActions />
        <StudentDirectoryImport />
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">قائمة الأسماء</h2>
          <form className="mb-4" method="get">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="بحث بالاسم أو السيريال..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              />
              <select
                name="department"
                defaultValue={departmentFilter}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              >
                <option value="">كل الأقسام</option>
                {departmentsStats.map((dept) => (
                  <option key={dept.department} value={dept.department}>
                    {dept.department}
                  </option>
                ))}
              </select>
              <select
                name="stage"
                defaultValue={stageFilter}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              >
                <option value="">كل المراحل</option>
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
                >
                  بحث
                </button>
                {(searchQuery || departmentFilter || stageFilter) && (
                  <Link
                    href="/admin/student-id"
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    مسح
                  </Link>
                )}
              </div>
            </div>
            {(searchQuery || departmentFilter || stageFilter) && (
              <p className="text-xs text-neutral-500 mt-2">عدد النتائج: {latestCards.length}</p>
            )}
          </form>
          {latestCards.length === 0 ? (
            <p className="text-sm text-neutral-500">لا توجد هويات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-200">
                    <th className="text-start py-2">الاسم</th>
                    <th className="text-start py-2">القسم</th>
                    <th className="text-start py-2">المرحلة</th>
                    <th className="text-start py-2">السيريال</th>
                    <th className="text-start py-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCards.map((card) => (
                    <tr key={card.serial} className="border-b border-neutral-100">
                      <td className="py-2 font-semibold text-neutral-900">{card.nameAr}</td>
                      <td className="py-2 text-neutral-700">{card.department}</td>
                      <td className="py-2 text-neutral-700">{card.stage}</td>
                      <td className="py-2 text-neutral-500">{card.serial}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/student-id/preview/${encodeURIComponent(card.serial)}`}
                            className="text-[#31BD9C] hover:underline"
                          >
                            معاينة
                          </Link>
                          <a
                            href={`/api/id/render?serial=${encodeURIComponent(card.serial)}&side=ar`}
                            className="text-neutral-700 hover:underline"
                          >
                            PNG AR
                          </a>
                          <a
                            href={`/api/id/render?serial=${encodeURIComponent(card.serial)}&side=en`}
                            className="text-neutral-700 hover:underline"
                          >
                            PNG EN
                          </a>
                          <StudentIdRowActions serial={card.serial} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <StudentIdForm initialSerial={params.serial} />
        </div>
      </div>
    </div>
  );
}
