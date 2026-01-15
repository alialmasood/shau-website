"use client";

import Image from "next/image";

// بيانات الأقسام مع الرسوم
const departments = [
  {
    id: 1,
    name: "قسم تقنيات صناعة الاسنان",
    image: "/hero-image-1.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,500,000",
    eveningPrice: "1,800,000",
    morningMinGPA: "75%",
    eveningMinGPA: "70%",
  },
  {
    id: 2,
    name: "قسم تقنيات التخدير",
    image: "/hero-image-2.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,400,000",
    eveningPrice: "1,750,000",
    morningMinGPA: "74%",
    eveningMinGPA: "69%",
  },
  {
    id: 3,
    name: "قسم تقنيات الاشعة",
    image: "/hero-image-3.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,600,000",
    eveningPrice: "1,900,000",
    morningMinGPA: "76%",
    eveningMinGPA: "71%",
  },
  {
    id: 4,
    name: "قسم تقنيات البصريات",
    image: "/hero-image-1.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,300,000",
    eveningPrice: "1,700,000",
    morningMinGPA: "73%",
    eveningMinGPA: "68%",
  },
  {
    id: 5,
    name: "قسم تقنيات طب الطوارئ والاسعافات الاولية",
    image: "/hero-image-2.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,550,000",
    eveningPrice: "1,850,000",
    morningMinGPA: "75%",
    eveningMinGPA: "70%",
  },
  {
    id: 6,
    name: "قسم تقنيات العلاج الطبيعي",
    image: "/hero-image-3.jpg",
    admissionType: "أحيائي",
    morningPrice: "2,450,000",
    eveningPrice: "1,800,000",
    morningMinGPA: "74%",
    eveningMinGPA: "69%",
  },
  {
    id: 7,
    name: "قسم هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي",
    image: "/hero-image-1.jpg",
    admissionType: "تطبيقي",
    morningPrice: "2,700,000",
    eveningPrice: "1,950,000",
    morningMinGPA: "77%",
    eveningMinGPA: "72%",
  },
  {
    id: 8,
    name: "قسم هندسة تقنيات النفط والغاز",
    image: "/hero-image-2.jpg",
    admissionType: "تطبيقي",
    morningPrice: "2,800,000",
    eveningPrice: "2,000,000",
    morningMinGPA: "78%",
    eveningMinGPA: "73%",
  },
  {
    id: 9,
    name: "قسم هندسة تقنيات الامن السيبراني والحوسبة السحابية",
    image: "/hero-image-3.jpg",
    admissionType: "علمي",
    morningPrice: "2,900,000",
    eveningPrice: "2,100,000",
    morningMinGPA: "80%",
    eveningMinGPA: "75%",
  },
  {
    id: 10,
    name: "قسم هندسة تقنيات البناء والانشاءات",
    image: "/hero-image-1.jpg",
    admissionType: "إعدادية صناعة",
    morningPrice: "2,600,000",
    eveningPrice: "1,900,000",
    morningMinGPA: "76%",
    eveningMinGPA: "71%",
  },
];

export default function TuitionFeesSection() {
  // تكرار البطاقات مرتين لضمان loop مستمر بدون فراغ
  // مهم: يجب أن تكون مكررة مرتين بالضبط للحركة الدائرية
  const duplicatedDepartments = [...departments, ...departments];

  return (
    <section className="relative w-full bg-[#04025E] py-4 sm:py-6 md:py-8 lg:py-10 overflow-hidden">
      {/* خطوط هندسية بيضاء */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {/* خطوط متقاطعة */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(255, 255, 255, 0.15) 80px, rgba(255, 255, 255, 0.15) 160px),
              repeating-linear-gradient(-45deg, transparent, transparent 80px, rgba(255, 255, 255, 0.15) 80px, rgba(255, 255, 255, 0.15) 160px)
            `,
          }}
        ></div>
        
        {/* خطوط أفقية */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-y-1/2"></div>
        
        {/* خطوط عمودية */}
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute top-0 right-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
        
        {/* دوائر هندسية */}
        <div className="absolute top-20 right-20 w-40 h-40 border border-white/15 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 border border-white/15 rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-28 h-28 border border-white/15 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* مربعات هندسية */}
        <div className="absolute top-16 right-16 w-24 h-24 border border-white/15 rotate-45"></div>
        <div className="absolute bottom-24 left-24 w-20 h-20 border border-white/15 rotate-45"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            الرسوم الدراسية
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#31BD9C] to-[#2aa88a] mx-auto rounded-full"></div>
        </div>

        {/* زر CTA */}
        <div className="text-center mb-6 sm:mb-8">
          <a
            href="/tuition-fees-guide"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm sm:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="تحميل دليل الرسوم"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>تحميل دليل الرسوم PDF</span>
          </a>
        </div>
      </div>

      {/* Cards Container - Infinite Marquee Loop */}
      <div className="relative z-10 w-full overflow-hidden" style={{ direction: 'ltr' }}>
        {/* Mask Gradient على الأطراف */}
        <div className="absolute inset-y-0 right-0 w-32 sm:w-48 md:w-64 bg-gradient-to-l from-[#04025E] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-y-0 left-0 w-32 sm:w-48 md:w-64 bg-gradient-to-r from-[#04025E] to-transparent z-20 pointer-events-none"></div>

        {/* Track - Infinite Loop */}
        <div 
          className="flex gap-4 sm:gap-6 animate-marquee-infinite"
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
        >
          {duplicatedDepartments.map((dept, index) => (
            <div
              key={`${dept.id}-${index}`}
              className="flex-shrink-0 w-64 sm:w-72 md:w-80"
              style={{ flexShrink: 0, direction: 'rtl' }}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-neutral-100 h-full flex flex-col">
                {/* الصورة - ارتفاع ثابت */}
                <div className="relative w-full h-24 sm:h-28 overflow-hidden">
                  <Image
                    src={dept.image}
                    alt={dept.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* المحتوى */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {/* اسم القسم */}
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-2.5 leading-tight line-clamp-2 min-h-[3rem]">
                    {dept.name}
                  </h3>

                  {/* نوع القبول - Pill صغير */}
                  <div className="mb-3">
                    <span className="inline-block px-2.5 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full">
                      {dept.admissionType}
                    </span>
                  </div>

                  {/* السعر */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                      <span className="text-xs font-medium text-neutral-700">صباحي</span>
                      <span className="text-sm font-bold text-[#31BD9C]">{dept.morningPrice} د.ع</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                      <span className="text-xs font-medium text-neutral-700">مسائي</span>
                      <span className="text-sm font-bold text-[#31BD9C]">{dept.eveningPrice} د.ع</span>
                    </div>
                  </div>

                  {/* الحد الأدنى للمعدل */}
                  <div className="mt-auto pt-3 border-t border-neutral-200">
                    <p className="text-[10px] text-neutral-600 mb-1.5">الحد الأدنى لمعدل القبول:</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">صباحي:</span>
                      <span className="font-bold text-neutral-900">{dept.morningMinGPA}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-neutral-600">مسائي:</span>
                      <span className="font-bold text-neutral-900">{dept.eveningMinGPA}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
