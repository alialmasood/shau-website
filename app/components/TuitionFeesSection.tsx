"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { getTranslations, type Locale } from "@/lib/i18n";
import { getCategoryLabel } from "@/lib/deptFeeCategories";

type HomeDeptItem = { id: string; slug: string; name: string; image: string; admissionKey: string; morningPrice: string; eveningPrice: string; morningMinGPA: string; eveningMinGPA: string };

/** البطاقات تظهر فقط للأقسام المُدخَلة في إدارة الرسوم (نفس بيانات صفحة /tuition-fees) */
export default function TuitionFeesSection({ items }: { items?: HomeDeptItem[] }) {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);
  const deptName = (slug: string, fallback: string) =>
    (t.programs.dept as Record<string, string>)?.[slug] ?? fallback;
  const admissionLabel = (k: string) => (k ? getCategoryLabel(k, locale) : "—");

  const list = items ?? [];
  const duplicatedDepartments = [...list, ...list];

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // معالجة بداية السحب
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
    
    // إيقاف الحركة التلقائية
    if (trackRef.current) {
      trackRef.current.style.animationPlayState = 'paused';
    }
  };

  // معالجة السحب
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.touches[0].pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 1.2; // سرعة السحب
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  // معالجة نهاية السحب
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // استئناف الحركة التلقائية بعد تأخير قصير
    setTimeout(() => {
      if (trackRef.current) {
        trackRef.current.style.animationPlayState = 'running';
      }
    }, 300);
  };

  return (
    <section className="relative w-full bg-[#04025E] py-4 sm:py-6 md:py-8 lg:py-10 overflow-x-hidden md:overflow-hidden min-h-[400px] md:min-h-0">
      {/* خطوط هندسية بيضاء */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {/* خطوط متقاطعة */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255, 255, 255, 0.15) 80px, rgba(255, 255, 255, 0.15) 160px),
              repeating-linear-gradient(-45deg, transparent, transparent 80px, rgba(255, 255, 255, 0.15) 80px, rgba(255, 255, 255, 0.15) 160px)
            `,
          }}
        ></div>
        
        {/* خطوط أفقية */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-y-1/2"></div>
        
        {/* خطوط عمودية */}
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 right-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        {/* دوائر هندسية */}
        <div className="absolute top-20 right-20 w-40 h-40 border border-white/15 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 border border-white/15 rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-28 h-28 border border-white/15 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* مربعات هندسية */}
        <div className="absolute top-16 right-16 w-24 h-24 border border-white/15 rotate-45"></div>
        <div className="absolute bottom-24 left-24 w-20 h-20 border border-white/15 rotate-45"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t.tuition.title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#31BD9C] to-[#2aa88a] mx-auto rounded-full"></div>
        </div>

        {/* أزرار CTA */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={locale === "ar" ? "/ar/tuition-fees-guide" : "/en/tuition-fees-guide"}
              className="inline-flex items-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm sm:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 justify-center"
              aria-label={t.tuition.downloadAria}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t.tuition.downloadGuide}</span>
            </a>
            <a
              href={locale === "ar" ? "/ar/tuition-fees" : "/en/tuition-fees"}
              className="inline-flex items-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base rounded-full transition-all duration-300 border border-white/40 hover:border-white/60 justify-center"
              aria-label={t.tuition.viewDeptFeesAria}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>{t.tuition.viewDeptFees}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cards Container - Infinite Marquee Loop (يُعرض فقط عند وجود أقسام من إدارة الرسوم) */}
      {list.length > 0 && (
      <div className="relative z-10 w-full overflow-x-auto md:overflow-hidden scrollbar-hide" style={{ direction: 'ltr' }}>
        {/* Mask Gradient على الأطراف */}
        <div className="absolute inset-y-0 right-0 w-16 md:w-64 bg-gradient-to-l from-[#04025E] via-[#04025E]/90 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-y-0 left-0 w-16 md:w-64 bg-gradient-to-r from-[#04025E] via-[#04025E]/90 to-transparent z-20 pointer-events-none"></div>

        {/* Track - Infinite Loop */}
        <div 
          ref={trackRef}
          className="flex gap-3 md:gap-4 lg:gap-6 animate-marquee-infinite scrollbar-hide pb-2 md:pb-0"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {duplicatedDepartments.map((dept, index) => (
            <div
              key={`${dept.id}-${index}`}
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-64 lg:w-72 xl:w-80"
              style={{ flexShrink: 0, direction: 'rtl' }}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-neutral-100 h-full flex flex-col">
                {/* الصورة - ارتفاع ثابت */}
                <div className="relative w-full h-24 sm:h-28 overflow-hidden">
                  <Image
                    src={dept.image}
                    alt={deptName(dept.slug, dept.name)}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* المحتوى */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {/* اسم القسم */}
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-2.5 leading-tight line-clamp-2 min-h-[3rem]">
                    {deptName(dept.slug, dept.name)}
                  </h3>

                  {/* نوع القبول - Pill صغير */}
                  <div className="mb-3">
                    <span className="inline-block px-2.5 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full">
                      {admissionLabel(dept.admissionKey)}
                    </span>
                  </div>

                  {/* السعر */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                      <span className="text-xs font-medium text-neutral-700">{t.tuition.morning}</span>
                      <span className="text-sm font-bold text-[#31BD9C]">{dept.morningPrice} {t.tuition.currency}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                      <span className="text-xs font-medium text-neutral-700">{t.tuition.evening}</span>
                      <span className="text-sm font-bold text-[#31BD9C]">{dept.eveningPrice} {t.tuition.currency}</span>
                    </div>
                  </div>

                  {/* الحد الأدنى للمعدل */}
                  <div className="mt-auto pt-3 border-t border-neutral-200">
                    <p className="text-[10px] text-neutral-600 mb-1.5">{t.tuition.minGPAHint}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">{t.tuition.morning}:</span>
                      <span className="font-bold text-neutral-900">{dept.morningMinGPA}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-neutral-600">{t.tuition.evening}:</span>
                      <span className="font-bold text-neutral-900">{dept.eveningMinGPA}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
