"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// أسماء الصور - سيتم استبدالها لاحقاً
const images = [
  "/hero-image-1.jpg",
  "/hero-image-2.jpg",
  "/hero-image-3.jpg",
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // تغيير الصورة تلقائياً كل 5 ثوان
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
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
              alt={`صورة ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            {/* Overlay خفيف لتحسين قراءة النص */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        ))}
      </div>

      {/* النص الثابت على الصور */}
      <div className="absolute right-8 sm:right-12 md:right-16 lg:right-20 top-[55%] transform -translate-y-1/2 z-20 max-w-lg sm:max-w-xl md:max-w-2xl">
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* العنوان الرئيسي */}
            <h2 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight text-right">
              مرحبًا بكم في كلية الشرق للعلوم التقنية التخصصية
            </h2>
            
            {/* العبارة الفرعية */}
            <p className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-relaxed text-right -mt-2 sm:-mt-2.5 md:-mt-3 whitespace-nowrap">
              نُعِدُّ كوادر تقنية مؤهلة للمستقبل
            </p>
            
            {/* النص الطويل */}
            <div className="pt-2 sm:pt-4 border-t border-white/20">
              <p className="text-white text-xs sm:text-xs md:text-sm lg:text-base leading-relaxed sm:leading-loose font-normal text-right space-y-0">
                <span className="block">استنادًا إلى أسس علمية رصينة ومواكبة مستمرة للتطورات التقنية الحديثة،</span>
                <span className="block">تقدم <span className="font-bold text-[#31BD9C]">كلية الشرق</span> تعليمًا تطبيقيًا متكاملًا لإعداد كفاءات علمية قادرة على خدمة المجتمع وسوق العمل</span>
              </p>
            </div>

            {/* زر فلنبدأ */}
            <div className="pt-2 sm:pt-3 md:pt-4 flex justify-start">
              <button className="px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-xs sm:text-sm md:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                فلنبدأ
              </button>
            </div>
          </div>
      </div>

      {/* Social Media Icons - Vertical Column on Left */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 flex flex-col items-center gap-2">
        {/* Social Icons */}
        <div className="flex flex-col items-center gap-2">
          {/* Facebook */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="Facebook"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="Instagram"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="LinkedIn"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>

          {/* Telegram */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="Telegram"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559z"/>
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="TikTok"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="YouTube"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="WhatsApp"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>

          {/* X (Twitter) */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#31BD9C] hover:bg-white hover:border-2 hover:border-[#31BD9C] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg group"
            aria-label="X"
          >
            <svg className="w-4 h-4 text-white group-hover:text-[#31BD9C] group-hover:scale-110 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
