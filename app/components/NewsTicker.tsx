"use client";

import Image from "next/image";

const newsItems = [
  "تعلن كلية الشرق للعلوم التقنية التخصصية عن بدء التسجيل للفصل الدراسي الجديد",
  "ورشة عمل حول أحدث التطورات في مجال الذكاء الاصطناعي",
  "حفل تكريم للطلبة المتميزين في البحث العلمي",
  "ندوة علمية حول أهمية الابتكار في التعليم التقني",
];

export default function NewsTicker() {
  return (
    <div 
      className="w-full bg-[#31BD9C] text-white py-1.5 overflow-hidden relative"
      style={{ direction: "rtl" }}
    >
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6 animate-scroll-rtl">
        {/* تكرار الأخبار عدة مرات لضمان حركة مستمرة */}
        {[...newsItems, ...newsItems, ...newsItems].map((news, index) => (
          <div key={index} className="flex items-center gap-3 sm:gap-4 md:gap-6 whitespace-nowrap flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium px-2 sm:px-4">{news}</span>
            
            {/* شعار الكلية الدائري كفاصل - أبيض بالكامل */}
            {index < [...newsItems, ...newsItems, ...newsItems].length - 1 && (
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src="/logo3333333333.png"
                    alt="شعار الكلية"
                    fill
                    className="object-contain"
                    style={{ filter: "brightness(0) invert(1)" }}
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
