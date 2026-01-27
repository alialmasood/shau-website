"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href + "/") || pathname === href;
}

type Variant = "primary" | "secondary" | "danger";

function navLinkClasses(
  variant: Variant,
  active: boolean,
  opts?: { fullWidth?: boolean; compact?: boolean }
): string {
  const w = opts?.fullWidth ? " w-full justify-start" : "";
  const text = opts?.compact ? " text-xs" : " text-sm";
  const base = `h-11 inline-flex items-center gap-2 px-4 rounded-xl transition-colors relative${text}${w}`;
  if (active) {
    if (variant === "primary") return `${base} bg-[#2aa88a] text-white font-extrabold`;
    if (variant === "secondary") return `${base} bg-neutral-200 text-neutral-900 font-bold`;
    if (variant === "danger") return `${base} bg-red-700 text-white font-extrabold`;
  }
  if (variant === "primary") return `${base} bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a]`;
  if (variant === "secondary") return `${base} bg-neutral-100 text-neutral-700 font-semibold hover:bg-neutral-200`;
  if (variant === "danger") return `${base} bg-red-600 text-white font-bold hover:bg-red-700`;
  return base;
}

function activeBarColor(variant: Variant): string {
  if (variant === "danger") return "bg-red-500";
  return "bg-[#31BD9C]";
}

type NavLinkProps = {
  href: string;
  variant: Variant;
  active: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
  fullWidth?: boolean;
  compact?: boolean;
  title?: string;
};
function NavLink({ href, variant, active, children, icon, fullWidth, compact, title }: NavLinkProps) {
  return (
    <Link href={href} title={title} className={navLinkClasses(variant, active, { fullWidth, compact })}>
      {active && (
        <span className={`absolute start-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full ${activeBarColor(variant)}`} aria-hidden />
      )}
      {icon}
      {children}
    </Link>
  );
}

const iconCls = "w-5 h-5";
const iconClsSm = "w-4 h-4";

export default function AdminNav() {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <nav className="flex flex-wrap items-stretch gap-3">
      {/* موبايل: Dropdown القائمة — أزرار w-full، نص أصغر */}
      <div className="relative w-full md:w-auto md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          title="فتح قائمة التنقل"
          className="h-11 w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors border border-neutral-200"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          القائمة
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute start-4 end-4 mt-1 z-50 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden flex flex-col gap-1 p-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide px-3 py-1.5">المحتوى</p>
              <NavLink href="/admin/news" variant="primary" active={isActive(pathname, "/admin/news")} fullWidth compact title="إدارة الأخبار والمقالات" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}>الأخبار</NavLink>
              <NavLink href="/admin/ticker" variant="secondary" active={isActive(pathname, "/admin/ticker")} fullWidth compact title="إدارة شريط الأخبار العليا" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}>الشريط الإخباري</NavLink>
              <NavLink href="/admin/programs" variant="secondary" active={isActive(pathname, "/admin/programs")} fullWidth compact title="إدارة برامج الكلية" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>برامج الكلية</NavLink>
              <NavLink href="/admin/social-media" variant="secondary" active={isActive(pathname, "/admin/social-media")} fullWidth compact title="إدارة روابط السوشيال ميديا" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}>إدارة السوشيال ميديا</NavLink>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide px-3 py-1.5 border-t border-neutral-100 mt-1">الإدارة</p>
              <NavLink href="/admin/tuition-fees" variant="secondary" active={isActive(pathname, "/admin/tuition-fees")} fullWidth compact title="إدارة رسوم الأقسام" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>إدارة الرسوم</NavLink>
              <NavLink href="/admin/tuition-pdf" variant="secondary" active={isActive(pathname, "/admin/tuition-pdf")} fullWidth compact title="رفع دليل الرسوم الدراسية PDF" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>تحميل الرسوم PDF</NavLink>
              <NavLink href="/admin/applications" variant="secondary" active={isActive(pathname, "/admin/applications")} fullWidth compact title="عرض طلبات التقديم" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}>طلبات التقديم</NavLink>
              <NavLink href="/admin/registration-affairs" variant="secondary" active={isActive(pathname, "/admin/registration-affairs")} fullWidth compact title="إدارة شؤون التسجيل" icon={<svg className={iconClsSm} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>شؤون التسجيل</NavLink>
            </div>
          </>
        )}
      </div>

      {/* Desktop: المجموعات كبطاقات — من md فما فوق */}
      <div className="hidden md:flex flex-wrap items-start gap-4">
        {/* المجموعة 1 – المحتوى */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm flex-1 min-w-[280px] max-w-[500px]">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3 px-1">المحتوى</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NavLink href="/admin/news" variant="primary" active={isActive(pathname, "/admin/news")} title="إدارة الأخبار والمقالات" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}>الأخبار</NavLink>
            <NavLink href="/admin/ticker" variant="secondary" active={isActive(pathname, "/admin/ticker")} title="إدارة شريط الأخبار العليا" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}>الشريط الإخباري</NavLink>
            <NavLink href="/admin/programs" variant="secondary" active={isActive(pathname, "/admin/programs")} title="إدارة برامج الكلية" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>برامج الكلية</NavLink>
            <NavLink href="/admin/social-media" variant="secondary" active={isActive(pathname, "/admin/social-media")} title="إدارة روابط السوشيال ميديا" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}>إدارة السوشيال ميديا</NavLink>
          </div>
        </div>
        {/* المجموعة 2 – الإدارة */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm flex-1 min-w-[280px] max-w-[500px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide px-1">الإدارة</p>
            {pathname.startsWith("/admin/users") && (
              <Link
                href="/admin/users/create"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#31BD9C] text-white text-xs font-bold hover:bg-[#2aa88a] transition-colors"
                title="إنشاء مستخدم جديد"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                إنشاء مستخدم
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <NavLink href="/admin/tuition-fees" variant="secondary" active={isActive(pathname, "/admin/tuition-fees")} title="إدارة رسوم الأقسام" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>إدارة الرسوم</NavLink>
            <NavLink href="/admin/tuition-pdf" variant="secondary" active={isActive(pathname, "/admin/tuition-pdf")} title="رفع دليل الرسوم الدراسية PDF" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>تحميل الرسوم PDF</NavLink>
            <NavLink href="/admin/applications" variant="secondary" active={isActive(pathname, "/admin/applications")} title="عرض طلبات التقديم" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}>طلبات التقديم</NavLink>
            <NavLink href="/admin/registration-affairs" variant="secondary" active={isActive(pathname, "/admin/registration-affairs")} title="إدارة شؤون التسجيل" icon={<svg className={iconCls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>شؤون التسجيل</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
