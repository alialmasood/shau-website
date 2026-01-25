import Link from "next/link";
import { getAllApplications } from "@/lib/applicationsRepo";
import { getCategoryLabel } from "@/lib/deptFeeCategories";
import ExportApplicationsButton from "./ExportApplicationsButton";

export default async function AdminApplicationsPage() {
  let items: Awaited<ReturnType<typeof getAllApplications>> = [];
  let tableMissing = false;

  try {
    items = await getAllApplications();
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || e);
    if (/does not exist|applications|relation.*does not exist/i.test(msg)) {
      tableMissing = true;
    } else {
      throw e;
    }
  }

  if (tableMissing) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-xl font-bold text-amber-900 mb-2">جدول طلبات التقديم غير موجود</h1>
          <p className="text-amber-800/90 text-sm mb-6">
            شغّل هجرة الجدول: <code className="bg-amber-100 px-1 rounded">npm run db:migrate-applications</code>
          </p>
        </div>
        <Link href="/admin" className="inline-block mt-6 text-[#31BD9C] font-semibold hover:underline">← رجوع للأدمن</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              طلبات التقديم
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              عرض المتقدمين: الاسم، المعدل، القسم، التصنيف، رقم الهاتف.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportApplicationsButton />
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-right px-4 py-3 font-bold">الاسم</th>
                  <th className="text-right px-4 py-3 font-bold">المعدل</th>
                  <th className="text-right px-4 py-3 font-bold">القسم</th>
                  <th className="text-right px-4 py-3 font-bold">التصنيف</th>
                  <th className="text-right px-4 py-3 font-bold">رقم الهاتف</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      لا توجد طلبات تقديم.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 font-medium">{row.full_name || "—"}</td>
                      <td className="px-4 py-3">{row.average || "—"}</td>
                      <td className="px-4 py-3">{row.department_name}</td>
                      <td className="px-4 py-3">{row.category ? getCategoryLabel(row.category, "ar") : "—"}</td>
                      <td className="px-4 py-3" dir="ltr">{row.phone || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
