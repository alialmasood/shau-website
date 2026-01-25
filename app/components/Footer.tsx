"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/i18n";

type FooterProps = {
  /** مكوّن أزرار السوشيال ميديا (يُمرَّر من الـ layout بعد جلب الروابط من قاعدة البيانات) */
  socialButtons?: React.ReactNode;
};

export default function Footer({ socialButtons }: FooterProps) {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);
  const linkLabel = (href: string, fallback: string) =>
    (t.footer.links as Record<string, string>)?.[href] ?? fallback;
  const [email, setEmail] = useState("");
  const [visitorCount, setVisitorCount] = useState(1680);
  const [isLoading, setIsLoading] = useState(true);

  // جلب عدد الزوار وتحديثه عند تحميل المكون
  useEffect(() => {
    const updateVisitorCount = async () => {
      try {
        // التحقق من localStorage لتجنب العد المتكرر في نفس الجلسة
        const hasVisited = localStorage.getItem("hasVisitedToday");
        const today = new Date().toDateString();

        if (hasVisited !== today) {
          // زيادة العدد
          const response = await fetch("/api/visitors", {
            method: "POST",
          });
          if (response.ok) {
            const data = await response.json();
            if (data && typeof data.count === 'number') {
              setVisitorCount(data.count);
              // حفظ التاريخ في localStorage
              localStorage.setItem("hasVisitedToday", today);
            }
          }
        } else {
          // فقط جلب العدد الحالي بدون زيادة
          const response = await fetch("/api/visitors");
          if (response.ok) {
            const data = await response.json();
            if (data && typeof data.count === 'number') {
              setVisitorCount(data.count);
            }
          }
        }
      } catch (error) {
        console.error("Error updating visitor count:", error);
        // في حالة الخطأ، استخدم قيمة افتراضية
        setVisitorCount(1680);
      } finally {
        setIsLoading(false);
      }
    };

    updateVisitorCount();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(t.footer.newsletter.thanks);
      setEmail("");
    }
  };

  const footerLinks = {
    relatedSites: {
      title: "مواقع ذات صلة",
      links: [
        { label: "وزارة التعليم العالي والبحث العلمي", href: "/related-sites/ministry" },
        { label: "دائرة التعليم الجامعي الاهلي", href: "/related-sites/private-education" },
        { label: "جامعات ومؤسسات", href: "/related-sites/universities" },
        { label: "وزارة التعليم العالي والبحث العلمي - دائرة البحث والتطوير", href: "/related-sites/research-development" },
        { label: "جهاز الاشراف والتقويم العلمي", href: "/related-sites/supervision" },
      ],
    },
    rankings: {
      title: "تصنيفات الجامعة",
      links: [
        { label: "THE Impact Ranking", href: "/rankings/the-impact" },
        { label: "Round University Ranking", href: "/rankings/round-university" },
        { label: "Green Metrics", href: "/rankings/green-metrics" },
        { label: "Scimagoir", href: "/rankings/scimagoir" },
        { label: "Qs ranking", href: "/rankings/qs" },
      ],
    },
    services: {
      title: "الخدمات",
      links: [
        { label: "التقويم الجامعي", href: "/services/calendar" },
        { label: "إستمارة الخطة الدراسية", href: "/services/study-plan" },
        { label: "الوظائف", href: "/services/jobs" },
      ],
    },
    academics: {
      title: "الاكاديميين",
      links: [
        { label: "بوابة العمداء", href: "/academics/deans" },
        { label: "بوابة التدريسيين", href: "/academics/faculty" },
        { label: "بوابة الطلبة", href: "/academics/students" },
        { label: "جدول المحاضرات", href: "/academics/schedule" },
        { label: "استمارة البحوث المنشورة", href: "/academics/published-research" },
      ],
    },
    research: {
      title: "البحث العلمي",
      links: [
        { label: "المجلات العلمية", href: "/research/journals" },
        { label: "البحوث العلمية", href: "/research/papers" },
        { label: "الانجازات العلمية", href: "/research/achievements" },
      ],
    },
    news: {
      title: "اخبار كلية الشرق",
      links: [
        { label: "الاخبار العامة", href: "/news/general" },
        { label: "اخبار الطلبة", href: "/news/students" },
        { label: "الندوات وورش العمل", href: "/news/workshops" },
      ],
    },
  };

  return (
    <footer className="w-full bg-neutral-900 text-neutral-300" style={{ marginTop: 0, paddingTop: 0, marginBottom: 0, paddingBottom: 0 }}>
      {/* التبويبات الرئيسية */}
      <div className="w-full border-b border-neutral-800 pt-6 sm:pt-8 md:pt-12 pb-6 sm:pb-8 md:pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex flex-col md:grid md:grid-cols-4 lg:grid-cols-7 gap-8 md:gap-10 lg:gap-8">
            {/* شعار الكلية والنشرة البريدية */}
            <div className="flex flex-col items-center text-center md:items-start md:text-start">
              {/* الشعار */}
              <Link href="/" className="flex items-center -mb-3 sm:-mb-4 md:-mb-5 -mt-6 sm:-mt-8 md:-mt-12">
                <div className="relative w-32 h-24 sm:w-40 sm:h-[7.5rem] md:w-40 md:h-[7.5rem] lg:w-44 lg:h-[8.25rem] xl:w-56 xl:h-42">
                  <Image
                    src="/Untitledoffffffff2 copy.png"
                    alt={t.footer.logoAlt}
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
              </Link>
              {/* النشرة البريدية */}
              <div className="w-full">
                <h4 className="text-sm md:text-base font-semibold text-white mb-2 text-center lg:text-right">
                  {t.footer.newsletter.title}
                </h4>
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.footer.newsletter.placeholder}
                    className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all duration-300 text-sm md:text-base"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base whitespace-nowrap"
                  >
                    {t.footer.newsletter.submit}
                  </button>
                </form>
              </div>
            </div>

            {/* مواقع ذات صلة */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.relatedSites.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.relatedSites.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* تصنيفات الجامعة */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.rankings.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.rankings.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* الخدمات */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.services.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.services.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* الاكاديميين */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.academics.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.academics.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* البحث العلمي */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.research.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.research.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* اخبار كلية الشرق */}
            <div className="text-center md:text-start">
              <h3 className="text-sm md:text-base lg:text-lg font-bold text-white mb-3 md:mb-4">
                {t.footer.news.title}
              </h3>
              <ul className="space-y-1.5 md:space-y-2">
                {footerLinks.news.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm md:text-base text-neutral-400 hover:text-[#31BD9C] transition-colors duration-300 flex items-center justify-center md:justify-start gap-1.5 group"
                    >
                      <span>{linkLabel(link.href, link.label)}</span>
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* عدد الزوار - تحت الندوات وورش العمل */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-xs sm:text-sm text-neutral-400">{t.footer.visitors}</span>
                  {isLoading ? (
                    <span className="text-sm sm:text-base font-bold text-[#31BD9C]">...</span>
                  ) : (
                    <span className="text-sm sm:text-base font-bold text-[#31BD9C]">
                      {visitorCount ? visitorCount.toLocaleString() : '0'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* الفوتر الإضافي */}
      <div className="w-full pt-1.5 sm:pt-2 md:pt-2.5 pb-0" style={{ paddingBottom: 0, marginBottom: 0 }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            {/* جميع الحقوق محفوظة - على اليسار */}
            <div className="text-xs sm:text-sm text-neutral-400 text-center lg:text-right order-3 lg:order-1">
              {t.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
            </div>

            {/* أزرار التواصل الاجتماعي - في الوسط (من قاعدة البيانات) */}
            <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3 order-1 lg:order-2">
              <h4 className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                {t.footer.followUs}
              </h4>
              <div className="flex flex-wrap justify-center lg:justify-end gap-1.5">
                {socialButtons}
              </div>
            </div>

            {/* العنوان - على اليمين */}
            <div className="text-xs sm:text-sm text-neutral-400 text-center lg:text-left order-2 lg:order-3">
              {t.footer.address}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
