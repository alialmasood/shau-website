import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardsForExport } from "@/lib/studentIdCardsRepo";
import { formatIssueDateAr } from "@/lib/studentIdExport";

export default async function StudentIdDepartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const department = String(params.department ?? "").trim();
  if (!department) {
    redirect("/admin/student-id");
  }

  const cards = await getStudentIdCardsForExport({ department });
  const excelHref = `/api/student-id/export-excel?department=${encodeURIComponent(department)}`;
  const pdfHref = `/api/student-id/export-pdf?department=${encodeURIComponent(department)}`;

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/student-id"
              prefetch={false}
              className="text-sm text-[#31BD9C] hover:underline"
            >
              ← العودة إلى هويات الطلبة
            </Link>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-neutral-900">
              هويات قسم: {department}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              كشف رسمي بأسماء الطلبة وكود الهوية وتاريخ الإصدار والمرحلة — العدد: {cards.length}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={excelHref}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
            >
              تصدير Excel
            </a>
            <a
              href={pdfHref}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              تصدير PDF (A4)
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-l from-[#04025E]/5 to-white">
            <p className="text-sm font-bold text-[#04025E]">كلية الشرق للعلوم التقنية التخصصية</p>
            <p className="text-xs text-neutral-500 mt-0.5">جدول هويات الطلبة حسب القسم</p>
          </div>

          {cards.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">لا توجد هويات مسجّلة لهذا القسم.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#31BD9C] text-white">
                    <th className="text-center py-3 px-3 font-bold w-12">ت</th>
                    <th className="text-start py-3 px-4 font-bold">الاسم</th>
                    <th className="text-start py-3 px-4 font-bold">القسم</th>
                    <th className="text-start py-3 px-4 font-bold">كود الهوية</th>
                    <th className="text-start py-3 px-4 font-bold">تاريخ إصدار الهوية</th>
                    <th className="text-start py-3 px-4 font-bold">المرحلة</th>
                    <th className="text-start py-3 px-4 font-bold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card, idx) => (
                    <tr
                      key={card.serial}
                      className={`border-b border-neutral-100 ${
                        idx % 2 === 0 ? "bg-neutral-50/80" : "bg-white"
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-neutral-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">{card.nameAr}</td>
                      <td className="py-3 px-4 text-neutral-700">{card.department}</td>
                      <td className="py-3 px-4 font-mono text-xs text-neutral-700 text-left" dir="ltr">
                        {card.serial}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {formatIssueDateAr(card.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">{card.stage}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/student-id/preview/${encodeURIComponent(card.serial)}`}
                          className="text-[#31BD9C] font-semibold hover:underline"
                        >
                          معاينة
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
