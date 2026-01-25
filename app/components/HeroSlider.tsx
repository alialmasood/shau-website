"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, type Locale } from "@/lib/i18n";

const images = ["/hero-image-1.jpg", "/hero-image-2.jpg", "/hero-image-3.jpg"];

type HeroSliderProps = {
  /** أزرار السوشيال ميديا (يُمرَّر من الصفحة بعد جلب الروابط من قاعدة البيانات) */
  socialButtons?: React.ReactNode;
};

export default function HeroSlider({ socialButtons }: HeroSliderProps) {
  const pathname = usePathname();
  const locale: Locale = (pathname ?? "").startsWith("/en") ? "en" : "ar";
  const t = getTranslations(locale);
  const isEn = locale === "en";

  const imgAlt = (i: number) =>
    (t.hero as { imgAlt?: string }).imgAlt?.replace("{n}", String(i + 1)) ??
    (isEn ? `Image ${i + 1}` : `صورة ${i + 1}`);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setCurrentIndex(index);

  return (
    <div className="relative w-full h-[50vh] md:h-[650px] overflow-hidden">
      {/* الصور */}
      <div className="relative w-full h-full">
        {images.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={src}
              alt={imgAlt(index)}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      {/* النص الثابت على الصور */}
      <div
        className={`absolute ${
          isEn ? "left-4 sm:left-8 md:left-16 lg:left-20" : "right-4 sm:right-8 md:right-16 lg:right-20"
        } top-[55%] transform -translate-y-1/2 z-20 max-w-lg sm:max-w-xl md:max-w-2xl px-2 md:px-0`}
      >
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          <h2
            className={`text-white text-sm md:text-lg lg:text-xl font-bold leading-tight ${
              isEn ? "text-left" : "text-right"
            }`}
          >
            {t.hero.h2}
          </h2>

          <p
            className={`text-white text-xl md:text-4xl font-bold leading-tight ${
              isEn ? "text-left" : "text-right"
            } -mt-2 md:-mt-3`}
          >
            {t.hero.h1}
          </p>

          <div className="pt-2 md:pt-4 border-t border-white/20">
            <p
              className={`text-white text-xs md:text-sm lg:text-base leading-relaxed md:leading-loose font-normal ${
                isEn ? "text-left" : "text-right"
              } line-clamp-2 md:line-clamp-none`}
            >
              <span className="block">{t.hero.line1}</span>
              <span className="block">
                <span className="font-bold text-[#31BD9C]">
                  {t.hero.collegeName}
                </span>{" "}
                {t.hero.line2}
              </span>
            </p>
          </div>

          <div className={`pt-2 md:pt-4 flex ${isEn ? "justify-start" : "justify-start"}`}>
            <Link
              href={`/${locale}/start`}
              className="h-11 w-auto max-w-[85%] sm:max-w-none sm:w-auto px-4 md:px-6 py-2.5 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-xs md:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center justify-center"
            >
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </div>

      {/* أزرار السوشيال ميديا (من قاعدة البيانات) — عمودي على الجانب الأيسر، تظهر على الموبايل والديسكتوب */}
      {socialButtons && (
        <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-30 flex flex-col gap-2 p-2 rounded-xl bg-black/25 backdrop-blur-sm max-md:bg-black/35">
          {socialButtons}
        </div>
      )}
    </div>
  );
}
