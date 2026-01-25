import Link from "next/link";
import { getAllDepartmentFees } from "@/lib/departmentFeeRepo";
import { getCategoryLabel } from "@/lib/deptFeeCategories";
import { deleteDepartmentFee } from "./actions";
import { DeleteDeptFeeButton } from "./DeleteDeptFeeButton";

export default async function AdminTuitionFeesPage() {
  let items: Awaited<ReturnType<typeof getAllDepartmentFees>> = [];
  let tableMissing = false;

  try {
    items = await getAllDepartmentFees();
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || e);
    if (/does not exist|department_fees|relation.*does not exist/i.test(msg)) {
      tableMissing = true;
    } else {
      throw e;
    }
  }

  if (tableMissing) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-xl font-bold text-amber-900 mb-2">جدول الرسوم غير موجود</h1>
          <p className="text-amber-800/90 text-sm mb-6">
            التطبيق يتصل بقاعدة بيانات لا تحتوي على جدول <code className="bg-amber-100 px-1 rounded">department_fees</code>. شغّل هجرة الجدول على <strong>نفس</strong> قاعدة البيانات التي يستخدمها التطبيق.
          </p>
          <p className="text-neutral-700 text-sm mb-4 font-mono bg-white px-4 py-3 rounded-lg border border-amber-200">
            npm run db:migrate-dept-fees
          </p>
          <p className="text-xs text-neutral-600">
            تأكد أن <code>.env</code> و <code>.env.local</code> يحتويان على نفس <code>DATABASE_URL</code> أو <code>DB_HOST, DB_NAME, …</code> التي يستخدمها Next.js.
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
              إدارة الرسوم الدراسية
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              إدارة تفاصيل رسوم الأقسام (صباحي/مسائي، الحد الأدنى للمعدل، التقديم، العرض في الهوم وصفحة الرسوم).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/tuition-fees/new"
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
            >
              إضافة سجل جديد
            </Link>
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
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-right px-4 py-3 font-bold">الترتيب</th>
                  <th className="text-right px-4 py-3 font-bold">القسم</th>
                  <th className="text-right px-4 py-3 font-bold">التصنيف</th>
                  <th className="text-right px-4 py-3 font-bold">صباحي</th>
                  <th className="text-right px-4 py-3 font-bold">مسائي</th>
                  <th className="text-center px-4 py-3 font-bold">مميز</th>
                  <th className="text-center px-4 py-3 font-bold">الحالة</th>
                  <th className="text-center px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                      لا توجد سجلات. أضف سجلاً جديداً من الأعلى.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{row.sortOrder}</td>
                      <td className="px-4 py-3 font-medium">{row.displayName || row.departmentSlug}</td>
                      <td className="px-4 py-3 text-sm">{(row.categories || []).map((s) => getCategoryLabel(s, "ar")).join("، ") || "—"}</td>
                      <td className="px-4 py-3">{row.morningPrice} {row.currency}</td>
                      <td className="px-4 py-3">{row.eveningPrice} {row.currency}</td>
                      <td className="px-4 py-3 text-center">{row.featured ? "✓" : "—"}</td>
                      <td className="px-4 py-3 text-center">{row.isActive ? "ظاهر" : "مخفي"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/tuition-fees/${row.id}/edit`}
                            className="px-3 py-1.5 rounded-lg border border-[#31BD9C] text-[#31BD9C] text-xs font-bold hover:bg-[#31BD9C]/10"
                          >
                            تعديل
                          </Link>
                          <DeleteDeptFeeButton id={row.id} deleteAction={deleteDepartmentFee} />
                        </div>
                      </td>
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
