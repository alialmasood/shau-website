import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import AdminNavConditional from "./AdminNavConditional";
import AdminNavLimited from "./AdminNavLimited";
import AdminBreadcrumb from "./AdminBreadcrumb";

// منع cache هذه الصفحة
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // التحقق من تسجيل الدخول
    const userData = await getCurrentAdminUser();
    if (!userData) {
      console.error("[AdminProtectedLayout] No current user, redirecting to login");
      redirect("/admin/login");
    }

    const isLimitedUser = userData.custom_url && userData.custom_url !== "/admin" && userData.role.toUpperCase() !== "ADMIN";

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Header ثابت (Sticky) — مجموعات تنقل منطقية + Active State */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* شريط علوي: لوحة التحكم | تسجيل خروج — موبايل: نص أصغر */}
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-3 border-b border-neutral-100">
            {!isLimitedUser ? (
              <Link
                href="/admin"
                title="العودة إلى لوحة التحكم"
                className="text-base sm:text-lg font-extrabold text-neutral-900 hover:text-[#31BD9C] transition-colors"
              >
                لوحة التحكم
              </Link>
            ) : (
              <div className="text-base sm:text-lg font-extrabold text-neutral-900">
                {userData?.full_name || "لوحة التحكم"}
              </div>
            )}
            <Link
              href="/admin/logout"
              title="تسجيل الخروج من لوحة التحكم"
              className="h-10 sm:h-11 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              تسجيل خروج
            </Link>
          </div>
          {/* التبويبات: المحتوى + الإدارة */}
          <div className="py-4">
            {isLimitedUser ? (
              <AdminNavLimited customUrl={userData?.custom_url || null} />
            ) : (
              <AdminNavConditional />
            )}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي — Breadcrumb، حركة خفيفة، محتوى الصفحة */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <AdminBreadcrumb isLimitedUser={!!isLimitedUser} />
        <div className="animate-admin-fade-in">{children}</div>
      </main>
    </div>
    );
  } catch (error) {
    console.error("[AdminProtectedLayout] Fatal error:", error);
    // في حالة خطأ فادح، إعادة توجيه إلى تسجيل الدخول
    redirect("/admin/login");
  }
}

