import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAllRegistrationDocuments } from "@/lib/registrationDocumentsRepo";
import PrintReportButton from "./PrintReportButton";

export default async function AdminRegistrationAffairsPage() {
  // التحقق من تسجيل الدخول
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من أن المستخدم المحدود لا يمكنه الوصول إلى هذه الصفحة
  const isLimitedUser =
    user.custom_url && user.custom_url !== "/admin" && String(user.role || "").toUpperCase() !== "ADMIN";
  if (isLimitedUser && user.custom_url) {
    // إذا كان custom_url هو required-documents فقط، إعادة توجيه
    if (user.custom_url === "/admin/registration-affairs/required-documents") {
      redirect(user.custom_url);
    }
  }

  // التحقق من الصلاحية على صفحة التسجيل
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("registration", "access"));
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
  const documents = await getAllRegistrationDocuments();
  const totalStudents = documents.length;
  const byDepartment = new Map<string, number>();
  const byStage = new Map<string, number>();
  const byStudyType = new Map<string, number>();

  for (const doc of documents) {
    byDepartment.set(doc.department, (byDepartment.get(doc.department) || 0) + 1);
    byStage.set(doc.stage, (byStage.get(doc.stage) || 0) + 1);
    const studyLabel =
      doc.studyType === "morning"
        ? "صباحي"
        : doc.studyType === "evening"
          ? "مسائي"
          : doc.studyType || "غير محدد";
    byStudyType.set(studyLabel, (byStudyType.get(studyLabel) || 0) + 1);
  }

  const departmentCount = byDepartment.size;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .print-hide { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          إدارة شؤون التسجيل
        </h1>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <Link
            href="/admin"
            className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            رجوع
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                المستمسكات المطلوبة
              </h2>
              <p className="text-sm text-neutral-600">
                إدارة قائمة المستمسكات المطلوبة للتسجيل
              </p>
            </div>
            <Link
              href="/admin/registration-affairs/required-documents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              المستمسكات المطلوبة
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">إحصائيات التسجيل</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد الطلبة المسجلين الكلي</p>
              <p className="text-2xl font-bold text-neutral-900">{totalStudents}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد الأقسام المسجلة</p>
              <p className="text-2xl font-bold text-neutral-900">{departmentCount}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">عدد المراحل</p>
              <p className="text-2xl font-bold text-neutral-900">{byStage.size}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-xs text-neutral-500">أنواع الدراسة</p>
              <p className="text-2xl font-bold text-neutral-900">{byStudyType.size}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <div className="bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-800">
                عدد الطلبة في كل قسم
              </div>
              <div className="divide-y divide-neutral-200">
                {Array.from(byDepartment.entries()).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-neutral-800">{dept}</span>
                    <span className="text-neutral-700">{count}</span>
                  </div>
                ))}
                {byDepartment.size === 0 && (
                  <div className="px-4 py-6 text-sm text-neutral-500">لا توجد بيانات بعد.</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 overflow-hidden">
              <div className="bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-800">
                توزيع حسب المرحلة ونوع الدراسة
              </div>
              <div className="divide-y divide-neutral-200">
                {Array.from(byStage.entries()).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-neutral-800">{stage}</span>
                    <span className="text-neutral-700">{count}</span>
                  </div>
                ))}
                {byStage.size === 0 && (
                  <div className="px-4 py-6 text-sm text-neutral-500">لا توجد بيانات مراحل بعد.</div>
                )}
              </div>
              <div className="border-t border-neutral-200">
                {Array.from(byStudyType.entries()).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-neutral-800">{type}</span>
                    <span className="text-neutral-700">{count}</span>
                  </div>
                ))}
                {byStudyType.size === 0 && (
                  <div className="px-4 py-6 text-sm text-neutral-500">لا توجد بيانات نوع دراسة بعد.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="print-area rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">تقرير تفصيلي رسمي</h2>
              <p className="text-sm text-neutral-600">إحصائية كلية ولكل قسم حسب البيانات المرفوعة</p>
            </div>
            <div className="text-xs text-neutral-500">
              إجمالي الطلبة: {totalStudents} • عدد الأقسام: {departmentCount}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-800">
              <div>القسم</div>
              <div>عدد الطلبة</div>
              <div>نسبة القسم من الإجمالي</div>
            </div>
            <div className="divide-y divide-neutral-200">
              {Array.from(byDepartment.entries()).map(([dept, count]) => {
                const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : "0";
                return (
                  <div key={dept} className="grid grid-cols-3 px-4 py-3 text-sm">
                    <div className="font-semibold text-neutral-800">{dept}</div>
                    <div className="text-neutral-700">{count}</div>
                    <div className="text-neutral-700">{pct}%</div>
                  </div>
                );
              })}
              {byDepartment.size === 0 && (
                <div className="px-4 py-6 text-sm text-neutral-500">لا توجد بيانات بعد.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
