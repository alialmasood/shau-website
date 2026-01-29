import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
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

  // التحقق من الصلاحية - فقط EXAM_COMMITTEE أو ADMIN
  if (user.role !== "EXAM_COMMITTEE" && user.role !== "ADMIN") {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <a href="/admin" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  const [stats, history] = await Promise.all([
    getImportStats(),
    getImportHistory(),
  ]);

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

          {/* Stats Cards */}
          <ResultsStatsCards stats={stats} />

          {/* Import Form */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <ResultsImportForm departments={DEPARTMENTS} attempts={ATTEMPTS} />
          </div>

          {/* Import History */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">سجل الاستيراد</h2>
            <ImportHistoryTable history={history} departments={DEPARTMENTS} />
          </div>
        </div>
      </div>
    </>
  );
}
