"use client";

import Image from "next/image";
import Link from "next/link";

// بيانات الأخبار - يمكن استبدالها لاحقاً بمصدر بيانات
const newsItems = [
  {
    id: 1,
    title: "ورشة عمل حول أحدث التطورات في مجال الذكاء الاصطناعي",
    excerpt: "تنظم كلية الشرق ورشة عمل متخصصة حول أحدث التطورات في مجال الذكاء الاصطناعي وتطبيقاته في التعليم",
    image: "/hero-image-1.jpg",
    date: "15 يناير 2025",
    category: "فعاليات",
  },
  {
    id: 2,
    title: "حفل تكريم للطلبة المتميزين في البحث العلمي",
    excerpt: "تحت رعاية عميد الكلية، تم تكريم الطلبة المتميزين في مجال البحث العلمي والابتكار",
    image: "/hero-image-2.jpg",
    date: "12 يناير 2025",
    category: "أحداث",
  },
  {
    id: 3,
    title: "ندوة علمية حول أهمية الابتكار في التعليم التقني",
    excerpt: "ندوة علمية متخصصة تناقش دور الابتكار في تطوير التعليم التقني ومواكبة متطلبات سوق العمل",
    image: "/hero-image-3.jpg",
    date: "10 يناير 2025",
    category: "ندوات",
  },
  {
    id: 4,
    title: "تعلن كلية الشرق عن بدء التسجيل للفصل الدراسي الجديد",
    excerpt: "تعلن كلية الشرق للعلوم التقنية التخصصية عن فتح باب التسجيل للفصل الدراسي الجديد",
    image: "/hero-image-1.jpg",
    date: "8 يناير 2025",
    category: "إعلانات",
  },
];

export default function NewsSection() {
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
          {newsItems.map((news) => (
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
                  src={news.image}
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
                    {news.category}
                  </span>
                </div>
              </div>

              {/* المحتوى */}
              <div className="p-5 sm:p-6">
                {/* التاريخ */}
                <p className="text-xs sm:text-sm text-[#31BD9C] font-medium mb-3">
                  {news.date}
                </p>

                {/* العنوان */}
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight">
                  {news.title}
                </h3>

                {/* الملخص */}
                <p className="text-sm sm:text-base text-neutral-600 line-clamp-3 leading-relaxed mb-4">
                  {news.excerpt}
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
