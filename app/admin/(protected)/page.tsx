import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboardStats";

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
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-neutral-900">ملخص سريع</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Wrapper = c.href ? Link : "div";
          const wrapperProps = c.href ? { href: c.href } : {};
          return (
            <Wrapper
              key={c.title}
              {...wrapperProps}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <span className="text-neutral-400">{c.icon}</span>
              <p className={`font-extrabold text-neutral-900 ${c.title === "آخر تحديث" ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{c.value}</p>
              <p className="text-sm font-medium text-neutral-500">{c.title}</p>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

