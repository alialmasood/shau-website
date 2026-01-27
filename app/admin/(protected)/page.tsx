import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getDashboardStats } from "@/lib/dashboardStats";
import AdminNav from "./AdminNav";

function formatLastUpdated(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default async function AdminDashboardPage() {
  // التحقق من تسجيل الدخول
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية على صفحة admin
  const hasAccess = await canAdmin("admin", "access");
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  // التحقق من أن المستخدم المحدود لا يمكنه الوصول إلى هذه الصفحة
  if (user.custom_url && user.custom_url !== "/admin" && user.role !== "ADMIN") {
    if (user.custom_url) {
      redirect(user.custom_url);
    }
  }

  let stats = { newsCount: 0, programsCount: 0, applicationsCount: 0, lastUpdated: null as string | null };
  try {
    stats = await getDashboardStats();
  } catch {
    // إبقاء القيم الافتراضية
  }

  const cards = [
    {
      title: "عدد الأخبار",
      value: stats.newsCount.toLocaleString("ar-EG"),
      href: "/admin/news",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
      ),
    },
    {
      title: "عدد البرامج",
      value: stats.programsCount.toLocaleString("ar-EG"),
      href: "/admin/programs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      ),
    },
    {
      title: "عدد طلبات التقديم",
      value: stats.applicationsCount.toLocaleString("ar-EG"),
      href: "/admin/applications",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
      ),
    },
    {
      title: "آخر تحديث",
      value: formatLastUpdated(stats.lastUpdated),
      href: null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* العنوان الرئيسي */}
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">لوحة التحكم</h1>
        <p className="text-sm text-neutral-600">نظرة عامة على النظام والإحصائيات</p>
      </div>

      {/* ملخص سريع */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-neutral-900">ملخص سريع</h2>
          <Link
            href="/admin/users"
            prefetch={false}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            إدارة المستخدمين
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const cn = "rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 group";
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${c.title === "آخر تحديث" ? "bg-neutral-100" : "bg-[#31BD9C]/10"} group-hover:scale-110 transition-transform`}>
                    <span className={`${c.title === "آخر تحديث" ? "text-neutral-600" : "text-[#31BD9C]"}`}>{c.icon}</span>
                  </div>
                  {c.href && (
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-[#31BD9C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-extrabold text-neutral-900 mb-1 ${c.title === "آخر تحديث" ? "text-xl" : "text-3xl"}`}>{c.value}</p>
                  <p className="text-sm font-medium text-neutral-500">{c.title}</p>
                </div>
              </>
            );
            return c.href ? (
              <Link key={c.title} href={c.href} className={cn}>{inner}</Link>
            ) : (
              <div key={c.title} className={cn}>{inner}</div>
            );
          })}
        </div>
      </div>

      {/* القوائم السريعة */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">القوائم السريعة</h2>
        <AdminNav />
      </div>
    </div>
  );
}

