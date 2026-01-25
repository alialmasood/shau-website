"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/i18n";

export type ProgramItem = { id: string; slug: string; name: string; image: string };

type Props = { items?: ProgramItem[]; base?: string };

/** البطاقات تأتي من جدول programs في قاعدة البيانات (إدارة برامج الكلية) */
export default function ProgramsSection({ items, base: baseProp }: Props) {
  const pathname = usePathname();
  const locale: Locale = baseProp ? (baseProp === "/en" ? "en" : "ar") : ((pathname ?? "").startsWith("/en") ? "en" : "ar");
  const t = getTranslations(locale);
  const base = baseProp ?? (locale === "ar" ? "/ar" : "/en");
  const list = items ?? [];
  const tp = (t as { programsPage?: Record<string, string> }).programsPage ?? {};
  return (
    <section className="w-full bg-white pt-0 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
      {/* العنوان الرئيسي في شريط أخضر مزخرف - يمتد على عرض الصفحة */}
      <div className="relative w-full mb-10 sm:mb-12 md:mb-16 overflow-hidden -mt-0">
        {/* الشريط الأخضر */}
        <div className="relative bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C] py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-12">
            {/* الزخرفة - مربعات خضراء وبيضاء */}
            <div className="absolute inset-0 opacity-40">
              {/* نمط المربعات */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.2) 20px, rgba(255,255,255,0.2) 40px),
                  repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.2) 20px, rgba(255,255,255,0.2) 40px)
                `,
              }}></div>
              
              {/* مربعات منفصلة */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/50 rounded-sm"></div>
              <div className="absolute top-2 right-12 w-6 h-6 bg-white/40 rounded-sm"></div>
              <div className="absolute bottom-2 left-2 w-8 h-8 bg-white/50 rounded-sm"></div>
              <div className="absolute bottom-2 left-12 w-6 h-6 bg-white/40 rounded-sm"></div>
              <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-white/45 rounded-sm transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/45 rounded-sm transform -translate-y-1/2"></div>
            </div>

            {/* العنوان */}
            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {t.programs.title}
              </h2>
              {/* خط فاصل أبيض */}
              <div className="w-32 h-1 bg-white/80 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="relative flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* الخانة الأولى: النص */}
          <div className="lg:sticky lg:top-24 pr-0 lg:pr-8 order-2 lg:order-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-6 leading-tight">
              {t.programs.h3}
            </h3>
            
            <div className="space-y-4 text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed">
              <p>{t.programs.p1}</p>
              <p>{t.programs.p2}</p>
            </div>

            {/* زر عرض جميع البرامج */}
            <div className="mt-6 sm:mt-8">
              <Link
                href={`${base}/programs`}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>{t.programs.viewAll}</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>

          {/* خط عمودي فاصل */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#31BD9C] transform -translate-x-1/2 -translate-x-0.5"></div>

          {/* الخانة الثانية: بطاقات البرامج (من قاعدة البيانات) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pl-0 lg:pl-8 order-1 lg:order-2">
            {list.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 py-8 text-center text-neutral-500 rounded-2xl border border-dashed border-neutral-200">
                {tp.noPrograms ?? (locale === "ar" ? "لا توجد برامج متاحة." : "No programs available.")}
              </div>
            ) : (
              list.map((dept, index) => (
                <Link
                  key={dept.id}
                  href={`${base}/programs/${dept.slug}`}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#31BD9C]/50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative w-full h-40 md:h-48 overflow-hidden">
                    <Image src={dept.image} alt={dept.name} fill className="object-cover transition-transform duration-700 group-hover:scale-125" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="relative p-4 sm:p-5 bg-white">
                    <div className="absolute -top-3 right-4 w-8 h-8 bg-[#31BD9C] rounded-full flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 mb-2 pr-10 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight line-clamp-2">{dept.name}</h3>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-[#31BD9C] to-transparent mb-2"></div>
                    <p className="text-sm text-neutral-600 line-clamp-2">{t.programs.discover}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
