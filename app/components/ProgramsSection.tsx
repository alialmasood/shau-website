"use client";

import Image from "next/image";
import Link from "next/link";

// بيانات الأقسام الدراسية
const departments = [
  {
    id: 1,
    name: "قسم تقنيات صناعة الاسنان",
    slug: "dental-technology",
    image: "/hero-image-1.jpg",
  },
  {
    id: 2,
    name: "قسم تقنيات التخدير",
    slug: "anesthesia-technology",
    image: "/hero-image-2.jpg",
  },
  {
    id: 3,
    name: "قسم تقنيات الاشعة",
    slug: "radiology-technology",
    image: "/hero-image-3.jpg",
  },
  {
    id: 4,
    name: "قسم تقنيات البصريات",
    slug: "optics-technology",
    image: "/hero-image-1.jpg",
  },
  {
    id: 5,
    name: "قسم تقنيات طب الطوارئ والاسعافات الاولية",
    slug: "emergency-medicine",
    image: "/hero-image-2.jpg",
  },
  {
    id: 7,
    name: "قسم تقنيات العلاج الطبيعي",
    slug: "physical-therapy",
    image: "/hero-image-1.jpg",
  },
  {
    id: 8,
    name: "قسم هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي",
    slug: "medical-physics-radiotherapy",
    image: "/hero-image-2.jpg",
  },
  {
    id: 9,
    name: "قسم هندسة تقنيات النفط والغاز",
    slug: "oil-gas-engineering",
    image: "/hero-image-3.jpg",
  },
  {
    id: 10,
    name: "قسم هندسة تقنيات الامن السيبراني والحوسبة السحابية",
    slug: "cybersecurity-cloud-computing",
    image: "/hero-image-1.jpg",
  },
  {
    id: 11,
    name: "قسم هندسة تقنيات البناء والانشاءات",
    slug: "construction-engineering",
    image: "/hero-image-2.jpg",
  },
];

export default function ProgramsSection() {
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
                برامج الكلية
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
              الدراسة في كلية الشرق للعلوم التقنية التخصصية
            </h3>
            
            <div className="space-y-4 text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed">
              <p>
                تبدأ رحلتك التعليمية في كلية الشرق من خلال برامج أكاديمية تقنية متخصصة، صُممت لتزويد الطلبة بالمعرفة العلمية والمهارات العملية اللازمة، بما يواكب متطلبات سوق العمل المحلي والإقليمي.
              </p>
              
              <p>
                ومن خلال اعتماد مناهج تعليمية حديثة تجمع بين الجوانب النظرية والتطبيقية، توفر الكلية أساسًا علميًا رصينًا في تخصصاتها المختلفة، مع التركيز على تنمية مهارات التحليل والتفكير العلمي والعمل المهني، بما يُعدّ الطلبة لمسيرة أكاديمية ومهنية ناجحة في مجالاتهم التخصصية.
              </p>
            </div>

            {/* زر عرض جميع البرامج */}
            <div className="mt-6 sm:mt-8">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span>عرض جميع البرامج</span>
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

          {/* الخانة الثانية: بطاقات الأقسام */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pl-0 lg:pl-8 order-1 lg:order-2">
            {departments.map((dept, index) => (
              <Link
                key={dept.id}
                href={`/departments/${dept.slug}`}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#31BD9C]/50"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* الصورة */}
                <div className="relative w-full h-40 md:h-36 lg:h-40 overflow-hidden">
                  <Image
                    src={dept.image}
                    alt={dept.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-125"
                    unoptimized
                  />
                  
                  {/* Overlay متدرج */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {/* تأثير إضاءة عند hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* المحتوى */}
                <div className="relative p-4 sm:p-5 bg-white">
                  {/* أيقونة صغيرة */}
                  <div className="absolute -top-3 right-4 w-8 h-8 bg-[#31BD9C] rounded-full flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                    <svg
                      className="w-4 h-4 text-white"
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

                  {/* اسم القسم */}
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 mb-2 pr-10 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight line-clamp-2">
                    {dept.name}
                  </h3>

                  {/* خط فاصل */}
                  <div className="w-10 h-0.5 bg-gradient-to-r from-[#31BD9C] to-transparent mb-2"></div>

                  {/* نص إضافي */}
                  <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
                    اكتشف المزيد عن برامج هذا القسم
                  </p>
                </div>

                {/* تأثير إضاءة خلفي */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
