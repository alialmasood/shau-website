"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavLimitedProps = {
  customUrl: string | null;
};

export default function AdminNavLimited({ customUrl }: AdminNavLimitedProps) {
  const pathname = usePathname() ?? "";

  // إذا لم يكن هناك custom_url، لا تظهر أي شيء
  if (!customUrl || customUrl === "/admin") {
    return null;
  }

  // تحديد الروابط المتاحة بناءً على custom_url
  const availableLinks: Array<{ href: string; label: string; icon: React.ReactNode }> = [];

  // إذا كان custom_url هو /admin/registration-affairs/required-documents فقط
  if (customUrl === "/admin/registration-affairs/required-documents") {
    // إظهار فقط "المستمسكات المطلوبة" بدون "شؤون التسجيل"
    availableLinks.push({
      href: "/admin/registration-affairs/required-documents",
      label: "المستمسكات المطلوبة",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
  }
  // إذا كان custom_url هو /admin/registration-affairs فقط
  else if (customUrl === "/admin/registration-affairs") {
    availableLinks.push({
      href: "/admin/registration-affairs",
      label: "شؤون التسجيل",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
  }
  // إذا كان custom_url يبدأ بـ /admin/registration-affairs (لكن ليس فقط required-documents)
  else if (customUrl.startsWith("/admin/registration-affairs")) {
    availableLinks.push({
      href: "/admin/registration-affairs",
      label: "شؤون التسجيل",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
    
    // إذا كان custom_url يحتوي على required-documents
    if (customUrl.includes("required-documents")) {
      availableLinks.push({
        href: "/admin/registration-affairs/required-documents",
        label: "المستمسكات المطلوبة",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      });
    }
  }

  // إذا لم توجد روابط متاحة، لا تظهر أي شيء
  if (availableLinks.length === 0) {
    return null;
  }

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    return pathname.startsWith(href + "/") || pathname === href;
  }

  return (
    <nav className="flex flex-wrap items-stretch gap-3">
      <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm min-w-0">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">الإدارة</p>
        <div className="flex flex-wrap gap-2">
          {availableLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`h-11 inline-flex items-center gap-2 px-4 rounded-xl transition-colors relative text-sm ${
                  active
                    ? "bg-neutral-200 text-neutral-900 font-bold"
                    : "bg-neutral-100 text-neutral-700 font-semibold hover:bg-neutral-200"
                }`}
              >
                {active && (
                  <span className="absolute start-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#31BD9C]" aria-hidden />
                )}
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
