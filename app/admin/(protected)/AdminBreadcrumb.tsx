"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "لوحة التحكم",
  news: "الأخبار",
  new: "إضافة جديد",
  ticker: "الشريط الإخباري",
  "tuition-fees": "إدارة الرسوم",
  "tuition-pdf": "تحميل الرسوم PDF",
  programs: "برامج الكلية",
  "social-media": "إدارة السوشيال ميديا",
  applications: "طلبات التقديم",
  edit: "تعديل",
  "registration-affairs": "شؤون التسجيل",
  "required-documents": "المستمسكات المطلوبة",
  "staff-identity": "هويات الكادر",
};

function segmentToLabel(segment: string, prev: string): string {
  if (segment === "new" && prev === "news") return "إضافة خبر";
  if (segment === "new" && prev === "tuition-fees") return "إضافة قسم";
  if (segment === "new" && prev === "programs") return "إضافة برنامج";
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^[0-9a-f-]{36}$/i.test(segment)) return ""; // UUID: تخطي
  if (segment === "logout") return "";
  return segment;
}

type AdminBreadcrumbProps = {
  isLimitedUser?: boolean;
};

export default function AdminBreadcrumb({ isLimitedUser = false }: AdminBreadcrumbProps) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const items: { href: string; label: string }[] = [];
  let href = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    href += (href ? "/" : "/") + seg;
    const prev = i > 0 ? segments[i - 1] : "";
    const label = segmentToLabel(seg, prev);
    if (label) items.push({ href, label });
  }

  if (items.length === 0) return null;

  return (
    <nav aria-label="مسار التنقل" className="mb-3 sm:mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-600">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isAdminLink = item.href === "/admin" && item.label === "لوحة التحكم";
          
          // للمستخدم المحدود، تعطيل رابط "لوحة التحكم" فقط
          if (isLimitedUser && isAdminLink) {
            return (
              <li key={item.href} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-neutral-400" aria-hidden>/</span>}
                <span className="text-neutral-400 cursor-not-allowed" title="غير متاح للمستخدم المحدود">
                  {item.label}
                </span>
              </li>
            );
          }
          
          // للروابط الأخرى، السماح بالوصول
          return (
            <li key={item.href} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="text-neutral-400" aria-hidden>/</span>}
              {isLast ? (
                <span className="font-semibold text-neutral-900">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-[#31BD9C] transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
