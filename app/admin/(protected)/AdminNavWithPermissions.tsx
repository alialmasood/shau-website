"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  pageCode: string;
  variant: "primary" | "secondary";
  title: string;
};

type AdminNavWithPermissionsProps = {
  accessiblePages: string[];
  navItems: NavItem[];
};

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
    <Link href={href} title={title} prefetch={false} className={navLinkClasses(variant, active, { fullWidth, compact })}>
      {active && (
        <span key="active-bar" className={`absolute start-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full ${activeBarColor(variant)}`} aria-hidden />
      )}
      <span key="icon">{icon}</span>
      <span key="label">{children}</span>
    </Link>
  );
}

const iconCls = "w-5 h-5";
const iconClsSm = "w-4 h-4";

export default function AdminNavWithPermissions({ accessiblePages, navItems }: AdminNavWithPermissionsProps) {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  // تصفية العناصر بناءً على الصلاحيات
  const filteredItems = navItems.filter((item) => accessiblePages.includes(item.pageCode));

  // تجميع العناصر حسب المجموعة
  const contentItems = filteredItems.filter((item) => 
    ["news", "ticker", "programs", "social"].includes(item.pageCode)
  );
  const managementItems = filteredItems.filter((item) =>
    ["tuition", "applications", "registration", "users", "results", "grades", "accounts", "student-accounts"].includes(item.pageCode)
  );

  return (
    <nav className="flex flex-wrap items-stretch gap-3">
      {/* موبايل: Dropdown */}
      <div className="relative w-full md:w-auto md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          title="فتح قائمة التنقل"
          className="h-11 w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors border border-neutral-200"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          القائمة
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute start-4 end-4 mt-1 z-50 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden flex flex-col gap-1 p-2">
              {contentItems.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide px-3 py-1.5">المحتوى</p>
                  {contentItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      variant={item.variant}
                      active={isActive(pathname, item.href)}
                      fullWidth
                      compact
                      title={item.title}
                      icon={item.icon}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </>
              )}
              {managementItems.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide px-3 py-1.5 border-t border-neutral-100 mt-1">الإدارة</p>
                  {managementItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      variant={item.variant}
                      active={isActive(pathname, item.href)}
                      fullWidth
                      compact
                      title={item.title}
                      icon={item.icon}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop: المجموعات كبطاقات */}
      <div className="hidden md:flex flex-wrap items-start gap-4">
        {contentItems.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm flex-1 min-w-[280px] max-w-[500px]">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3 px-1">المحتوى</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contentItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  variant={item.variant}
                  active={isActive(pathname, item.href)}
                  title={item.title}
                  icon={item.icon}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        {managementItems.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm flex-1 min-w-[280px] max-w-[500px]">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3 px-1">الإدارة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {managementItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  variant={item.variant}
                  active={isActive(pathname, item.href)}
                  title={item.title}
                  icon={item.icon}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
