import Image from "next/image";
import Link from "next/link";
import { getLatestPublishedNews } from "@/lib/newsRepo";

function formatArabicDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function NewsSection() {
  const items = await getLatestPublishedNews(4);
  return (
    <section className="w-full bg-gradient-to-b from-white to-neutral-50 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4">
            آخر الأخبار
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#31BD9C] to-[#2aa88a] mx-auto rounded-full"></div>
        </div>

        {/* بطاقات الأخبار */}
        <div className="flex md:grid md:grid-cols-4 overflow-x-auto gap-3 md:gap-6 lg:gap-8 snap-x snap-mandatory md:overflow-visible md:snap-none scrollbar-hide pb-2 md:pb-0">
          {items.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-neutral-100 hover:border-[#31BD9C]/30 w-[48%] sm:w-[45%] md:w-auto md:min-w-0 snap-start flex-shrink-0"
            >
              {/* الشريط الملون من الأعلى */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C] z-10"></div>

              {/* الصورة */}
              <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
                <Image
                  src={news.coverImageId ? `/api/media/${news.coverImageId}` : "/hero-image-1.jpg"}
                  alt={news.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
                {/* Overlay متدرج */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* فئة الخبر */}
                <div className="absolute top-3 right-3 z-20">
                  <span className="px-3 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                    {news.categoryLabel}
                  </span>
                </div>
              </div>

              {/* المحتوى */}
              <div className="p-5 sm:p-6">
                {/* التاريخ */}
                <p className="text-xs sm:text-sm text-[#31BD9C] font-medium mb-3">
                  {formatArabicDate(news.publishedAt)}
                </p>

                {/* العنوان */}
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight">
                  {news.title}
                </h3>

                {/* الملخص */}
                <p className="text-sm sm:text-base text-neutral-600 line-clamp-3 leading-relaxed mb-4">
                  {news.excerpt ?? ""}
                </p>

                {/* زر القراءة */}
                <div className="flex items-center text-[#31BD9C] font-semibold text-sm group-hover:gap-2 transition-all duration-300">
                  <span>اقرأ المزيد</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              {/* تأثير إضاءة عند hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </Link>
          ))}
        </div>

        {/* زر عرض المزيد */}
        <div className="text-center mt-10 sm:mt-12 md:mt-16">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-base sm:text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span>عرض جميع الأخبار</span>
            <svg
              className="w-5 h-5"
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
    </section>
  );
}
