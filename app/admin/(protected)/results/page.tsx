import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import ResultsImportForm from "./ResultsImportForm";
import { getImportStats, getImportHistory } from "./actions";
import ResultsStatsCards from "./ResultsStatsCards";
import ImportHistoryTable from "./ImportHistoryTable";
import RealtimeWrapper from "./RealtimeWrapper";
import RealtimeStatus from "./RealtimeStatus";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEPARTMENTS = [
  { code: "DENTAL_TECH", name: "تقنيات صناعة الأسنان" },
  { code: "ANESTHESIA_TECH", name: "تقنيات التخدير" },
  { code: "RADIOLOGY_TECH", name: "تقنيات الأشعة" },
];

const ATTEMPTS = ["الدور الأول", "الدور الثاني"];

export default async function AdminResultsPage() {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية - يسمح لـ ADMIN و EXAM_COMMITTEE، أو صلاحية صفحة النتائج
  const userRoleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    userRoleUpper === "ADMIN" ||
    userRoleUpper === "EXAM_COMMITTEE" ||
    (await canAdmin("results", "access"));

  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <p className="text-neutral-600 mt-2 text-sm">الدور الحالي: {user.role}</p>
          <a href="/admin" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  let stats;
  let history;
  let statsError: string | null = null;
  let historyError: string | null = null;

  try {
    [stats, history] = await Promise.all([
      getImportStats().catch((err) => {
        console.error("[AdminResultsPage] Error fetching stats:", err);
        statsError = err instanceof Error ? err.message : "خطأ في جلب الإحصائيات";
        return {
          totalUploads: 0,
          uploadedDepartments: 0,
          totalImportedStudents: 0,
          lastUpload: null,
        };
      }),
      getImportHistory().catch((err) => {
        console.error("[AdminResultsPage] Error fetching history:", err);
        historyError = err instanceof Error ? err.message : "خطأ في جلب سجل الاستيراد";
        return [];
      }),
    ]);
  } catch (error) {
    console.error("[AdminResultsPage] Fatal error:", error);
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ حدث خطأ في تحميل الصفحة</p>
          <p className="text-neutral-600 mt-2">{error instanceof Error ? error.message : "خطأ غير معروف"}</p>
          <a href="/admin" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <RealtimeWrapper />
      <RealtimeStatus />
      <div className="w-full bg-white min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              إدارة النتائج
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              استيراد نتائج الطلاب من ملف Excel (نوع الدراسة والمرحلة سيتم قراءتهما من الملف)
            </p>
          </div>

          {/* Error Messages */}
          {statsError && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
              <p className="font-bold">⚠️ تحذير: {statsError}</p>
            </div>
          )}
          {historyError && (
            <div className="mb-4 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-300 text-yellow-800">
              <p className="font-bold">⚠️ تحذير: {historyError}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && <ResultsStatsCards stats={stats} />}

          {/* Import Form */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <ResultsImportForm departments={DEPARTMENTS} attempts={ATTEMPTS} />
          </div>

          {/* Import History */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">سجل الاستيراد</h2>
            {history && <ImportHistoryTable history={history} departments={DEPARTMENTS} />}
          </div>
        </div>
      </div>
    </>
  );
}
