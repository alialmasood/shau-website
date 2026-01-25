"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";

export default function GreenCard() {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);

  return (
    <section className="w-full bg-[#31BD9C] min-h-[200px] md:h-[300px] lg:h-[400px] relative overflow-hidden">
      <div className="w-full h-full flex flex-col md:flex-row-reverse items-stretch">
               {/* صورة العميد - موبايل: في الأعلى، ديسكتوب: على اليمين */}
               <div className="relative w-full md:w-80 lg:w-96 xl:w-[500px] h-[200px] md:h-full flex-shrink-0">
                 <Image
                   src="/2025.jpg"
                   alt={t.greenCard.deanImageAlt}
                   fill
                   className="object-cover object-center"
                   priority
                   unoptimized
                 />
                 {/* النص على الصورة */}
                 <div className="absolute inset-0 flex flex-col items-center justify-end bg-black/40 z-10 p-4 md:p-6 pb-4 md:pb-6">
                   <div className="text-center text-white space-y-1 md:space-y-2">
                     <p className="text-xs md:text-base font-semibold">
                       {t.greenCard.prefix}
                     </p>
                     <p className="text-sm md:text-lg lg:text-xl font-bold">
                       {t.greenCard.name}
                     </p>
                     <p className="text-xs md:text-base font-medium">
                       {t.greenCard.role}
                     </p>
                   </div>
                 </div>
               </div>

        {/* النص - موبايل: تحت الصورة، ديسكتوب: على الجانب المقابل */}
        <div className="flex-1 flex items-center justify-center px-3 md:px-4 lg:px-6 xl:px-8 py-3 md:py-4 lg:py-6 xl:py-8">
          <div className="space-y-1 md:space-y-1.5 lg:space-y-2 text-white leading-relaxed md:leading-[1.5] lg:leading-[1.6] w-full">
            <h2 className="text-xs md:text-sm lg:text-base xl:text-lg font-bold mb-1 md:mb-1.5">
              {t.greenCard.title}
            </h2>
            
            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium">
              {t.greenCard.intro}
            </p>
            
            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              {t.greenCard.p1}
            </p>

            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              {t.greenCard.p2}
            </p>

            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              {t.greenCard.p3}
            </p>

            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              {t.greenCard.p4}
            </p>

            <p className="text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium">
              {t.greenCard.p5}
            </p>

            <p className="text-[10px] md:text-xs lg:text-sm xl:text-base font-semibold pt-1 md:pt-2">
              {t.greenCard.outro}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
