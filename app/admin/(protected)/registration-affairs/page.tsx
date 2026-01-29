import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";

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
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          إدارة شؤون التسجيل
        </h1>
        <Link
          href="/admin"
          className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          رجوع
        </Link>
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
      </div>
    </div>
  );
}
