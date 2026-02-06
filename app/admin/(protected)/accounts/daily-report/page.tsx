import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentsStats } from "@/lib/studentsRepo";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEPARTMENTS = [
  { code: "DENTAL_TECH", name: "تقنيات صناعة الأسنان" },
  { code: "ANESTHESIA_TECH", name: "تقنيات التخدير" },
  { code: "RADIOLOGY_TECH", name: "تقنيات الأشعة" },
];

function formatDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export default async function DailyAccountsReportPage() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" ||
    roleUpper === "ACCOUNTS" ||
    (await canAdmin("accounts", "access"));

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

  const stats = await getStudentsStats(undefined, { ignoreDepartment: true });
  const departmentCount = Object.keys(stats.byDepartment).length;
  const reportDate = formatDate(new Date());

  return (
    <div className="w-full bg-white min-h-screen">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .print-hide { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 print-hide">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              تقرير يومي - الحسابات
            </h1>
            <p className="mt-2 text-sm text-neutral-600">تقرير إحصائي رسمي قابل للطباعة</p>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <Link
              href="/admin/accounts"
              prefetch={false}
              className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              رجوع
            </Link>
          </div>
        </div>

        <div className="print-area rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">تقرير يومي للحسابات</h2>
              <p className="text-sm text-neutral-600 mt-1">التاريخ: {reportDate}</p>
            </div>
            <div className="text-xs text-neutral-500">
              عدد الأقسام: {departmentCount}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد الطلبة الكلي</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد الطلبة الدافعين الكلي</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.paid}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد الطلبة غير الدافعين الكلي</p>
              <p className="text-2xl font-bold text-amber-700">{stats.unpaid}</p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-800">
              إحصائية الأقسام (الكلية / الدافعين / غير الدافعين)
            </div>
            <div className="divide-y divide-neutral-200">
              {Object.entries(stats.byDepartment).map(([deptCode, deptStats]) => (
                <div key={deptCode} className="grid grid-cols-3 px-4 py-3 text-sm">
                  <div className="font-semibold text-neutral-800">
                    {DEPARTMENTS.find((d) => d.code === deptCode)?.name || deptCode}
                  </div>
                  <div className="text-neutral-700">الكل: {deptStats.total}</div>
                  <div className="text-neutral-700">
                    الدافعين: {deptStats.paid} • غير الدافعين: {deptStats.unpaid}
                  </div>
                </div>
              ))}
              {Object.keys(stats.byDepartment).length === 0 && (
                <div className="px-4 py-6 text-sm text-neutral-500">لا توجد بيانات بعد.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
