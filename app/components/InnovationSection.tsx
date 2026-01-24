"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/i18n";

export default function InnovationSection() {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);
  const base = locale === "ar" ? "/ar" : "/en";
  return (
    <section 
      className="relative w-full min-h-[70vh] overflow-hidden bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/innovation-hub.jpg)',
      }}
    >
      {/* Overlay شفاف لتحسين قراءة النص */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* المحتوى */}
      <div className="relative z-10 w-full min-h-[70vh] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-10 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* العنوان */}
          <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight">
            {t.innovation.h2Line1}
            <br />
            {t.innovation.h2Line2}
          </h2>

          {/* النص */}
          <p className="text-base md:text-xl lg:text-2xl mb-8 md:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto">
            {t.innovation.p}
          </p>

          {/* الزر */}
          <Link
            href={`${base}/innovation-hub`}
            className="inline-block w-full sm:w-auto px-8 md:px-10 lg:px-12 py-3 md:py-4 lg:py-5 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm md:text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {t.innovation.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
