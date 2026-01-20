import Image from "next/image";
import { getActiveTickerItems } from "@/lib/tickerRepo";

export default async function NewsTicker() {
  const items = await getActiveTickerItems();
  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items];
  return (
    <div 
      className="w-full bg-[#31BD9C] text-white h-10 overflow-hidden relative"
      style={{ direction: "rtl" }}
    >
      <div className="flex items-center h-full gap-3 md:gap-6 animate-scroll-rtl px-3 md:px-10">
        {/* تكرار الأخبار عدة مرات لضمان حركة مستمرة */}
        {repeated.map((item, index) => (
          <div key={index} className="flex items-center gap-3 md:gap-6 whitespace-nowrap flex-shrink-0">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm font-medium hover:underline"
              >
                {item.text}
              </a>
            ) : (
              <span className="text-xs md:text-sm font-medium">{item.text}</span>
            )}
            
            {/* شعار الكلية الدائري كفاصل - أبيض بالكامل */}
            {index < repeated.length - 1 && (
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
