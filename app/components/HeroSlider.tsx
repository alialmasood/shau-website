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

      {/* مؤشرات التنقل (Dots) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`انتقل إلى الصورة ${index + 1}`}
          />
        ))}
      </div>

      {/* أزرار التنقل (اختياري) */}
      <button
        onClick={() =>
          setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
          )
        }
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="الصورة السابقة"
      >
        <svg
          className="w-5 h-5 text-neutral-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>

      <button
        onClick={() =>
          setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        }
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="الصورة التالية"
      >
        <svg
          className="w-5 h-5 text-neutral-700"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>
  );
}
