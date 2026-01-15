"use client";

import Link from "next/link";

export default function InnovationSection() {
  return (
    <section 
      className="relative w-full min-h-[70vh] overflow-hidden bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/innovation-hub.jpg)',
      }}
    >
      {/* Overlay شفاف لتحسين قراءة النص */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* المحتوى */}
      <div className="relative z-10 w-full min-h-[70vh] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* العنوان */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
            نبني مستقبلاً
            <br />
            يتخطى حدود الابتكار
          </h2>

          {/* النص */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 leading-relaxed max-w-3xl mx-auto">
            في كلية الشرق، نؤمن بأن التعليم هو محرك التغيير وبوابة الابتكار. نصنع قادة المستقبل ونلهم العقول الطموحة
          </p>

          {/* الزر */}
          <Link
            href="/innovation-hub"
            className="inline-block px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm sm:text-base md:text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            اكتشف مركز الابتكار
          </Link>
        </div>
      </div>
    </section>
  );
}
