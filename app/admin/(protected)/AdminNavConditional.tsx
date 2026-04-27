import { getAccessiblePages } from "@/lib/adminAuthz";
import AdminNavWithPermissions from "./AdminNavWithPermissions";

// تعريف جميع عناصر القائمة
const allNavItems = [
  {
    href: "/admin/news",
    label: "الأخبار",
    pageCode: "news",
    variant: "primary" as const,
    title: "إدارة الأخبار والمقالات",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    href: "/admin/continuing-education",
    label: "التعليم المستمر",
    pageCode: "continuing-education",
    variant: "secondary" as const,
    title: "إدارة شعبة التعليم المستمر",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/admin/events",
    label: "الأحداث",
    pageCode: "events",
    variant: "secondary" as const,
    title: "إدارة الفعاليات والمواعيد",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/ticker",
    label: "الشريط الإخباري",
    pageCode: "ticker",
    variant: "secondary" as const,
    title: "إدارة شريط الأخبار العليا",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    href: "/admin/programs",
    label: "برامج الكلية",
    pageCode: "programs",
    variant: "secondary" as const,
    title: "إدارة برامج الكلية",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: "/admin/social-media",
    label: "إدارة السوشيال ميديا",
    pageCode: "social",
    variant: "secondary" as const,
    title: "إدارة روابط السوشيال ميديا",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    href: "/admin/tuition-fees",
    label: "إدارة الرسوم",
    pageCode: "tuition",
    variant: "secondary" as const,
    title: "إدارة رسوم الأقسام",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/tuition-pdf",
    label: "تحميل الرسوم PDF",
    pageCode: "tuition",
    variant: "secondary" as const,
    title: "رفع دليل الرسوم الدراسية PDF",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/applications",
    label: "طلبات التقديم",
    pageCode: "applications",
    variant: "secondary" as const,
    title: "عرض طلبات التقديم",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/admin/registration-affairs",
    label: "شؤون التسجيل",
    pageCode: "registration",
    variant: "secondary" as const,
    title: "إدارة شؤون التسجيل",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "إدارة المستخدمين",
    pageCode: "users",
    variant: "secondary" as const,
    title: "إدارة المستخدمين والصلاحيات",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/results",
    label: "إدارة النتائج",
    pageCode: "results",
    variant: "secondary" as const,
    title: "إدارة نتائج الطلاب",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/grades",
    label: "إدارة الدرجات",
    pageCode: "grades",
    variant: "secondary" as const,
    title: "إدارة درجات الطلاب",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H7l-4 4V7a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    href: "/admin/accounts",
    label: "الحسابات",
    pageCode: "accounts",
    variant: "secondary" as const,
    title: "إدارة الحسابات المالية",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/student-accounts",
    label: "حسابات الطلاب",
    pageCode: "student-accounts",
    variant: "secondary" as const,
    title: "إدارة حسابات تسجيل دخول الطلاب",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/student-id",
    label: "هويات الطلبة",
    pageCode: "student-id",
    variant: "secondary" as const,
    title: "إدارة هويات الطلبة",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10m-9 4h8m-9 4h6M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    href: "/admin/student-code",
    label: "كودات الطلبة للتجريبي",
    pageCode: "student-accounts",
    variant: "secondary" as const,
    title: "كودات الطلبة للتجريبي",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    href: "/admin/staff-identity",
    label: "هويات الكادر",
    pageCode: "staff-identity",
    variant: "secondary" as const,
    title: "طلبات هوية الكادر",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
];

export default async function AdminNavConditional() {
  try {
    console.log("[AdminNavConditional] Getting accessible pages...");
    const accessiblePages = await getAccessiblePages();
    console.log(`[AdminNavConditional] Accessible pages: ${accessiblePages.length} pages`, accessiblePages);
    
    // إذا كانت القائمة فارغة (مثل عدم وجود جداول RBAC)، نعرض جميع الصفحات كـ fallback
    // هذا يضمن أن النظام يعمل حتى لو لم تكن جداول RBAC موجودة
    const pagesToShow = accessiblePages.length > 0 
      ? accessiblePages 
      : allNavItems.map(item => item.pageCode);
    
    console.log(`[AdminNavConditional] Pages to show: ${pagesToShow.length} pages`);
    return <AdminNavWithPermissions accessiblePages={pagesToShow} navItems={allNavItems} />;
  } catch (error) {
    console.error("[AdminNavConditional] Error getting accessible pages:", error);
    if (error instanceof Error) {
      console.error("[AdminNavConditional] Error message:", error.message);
      console.error("[AdminNavConditional] Error stack:", error.stack);
    }
    // في حالة خطأ، نعرض جميع الصفحات كـ fallback
    const fallbackPages = allNavItems.map(item => item.pageCode);
    console.log(`[AdminNavConditional] Using fallback pages: ${fallbackPages.length} pages`);
    return <AdminNavWithPermissions accessiblePages={fallbackPages} navItems={allNavItems} />;
  }
}
