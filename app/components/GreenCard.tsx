"use client";

import Image from "next/image";

export default function GreenCard() {
  return (
    <section className="w-full bg-[#31BD9C] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] relative overflow-hidden">
      <div className="w-full h-full flex flex-row-reverse items-stretch">
               {/* صورة العميد على أقصى اليمين */}
               <div className="relative w-full sm:w-80 md:w-96 lg:w-[500px] h-full flex-shrink-0">
                 <Image
                   src="/2025.jpg"
                   alt="عميد كلية الشرق للعلوم التقنية التخصصية"
                   fill
                   className="object-cover object-center"
                   priority
                   unoptimized
                 />
                 {/* النص على الصورة */}
                 <div className="absolute inset-0 flex flex-col items-center justify-end bg-black/40 z-10 p-4 sm:p-6 pb-4 sm:pb-6">
                   <div className="text-center text-white space-y-1 sm:space-y-2">
                     <p className="text-xs sm:text-sm md:text-base font-semibold">
                       الاستاذ الدكتور
                     </p>
                     <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">
                       احمد عبد الكاظم العامري
                     </p>
                     <p className="text-xs sm:text-sm md:text-base font-medium">
                       عميد كلية الشرق للعلوم التقنية التخصصية
                     </p>
                   </div>
                 </div>
               </div>

        {/* النص على الجانب المقابل */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 xl:py-8">
          <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5 lg:space-y-2 text-white leading-[1.3] sm:leading-[1.4] md:leading-[1.5] lg:leading-[1.6] w-full">
            <h2 className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-bold mb-0.5 sm:mb-1 md:mb-1.5">
              كلمة عميد كلية الشرق للعلوم التقنية التخصصية
            </h2>
            
            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium">
              أبناءنا الأعزاء، زوار موقعنا الكريم ...
            </p>
            
            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              إنه لمن دواعي سروري واعتزازي أن أرحب بكم في <span className="font-semibold">كلية الشرق للعلوم التقنية التخصصية</span>، حيث نبذل جهدنا المستمر لتقديم تعليم تقني متطور يواكب احتياجات السوق المحلي والعالمي، ويعزز من قدرات طلابنا ليكونوا قادة في مجالاتهم.
            </p>

            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              تسعى الكلية منذ تأسيسها إلى تزويد الطلبة بأحدث المعارف والمهارات التقنية التي تمكّنهم من التكيف مع التغيرات السريعة في عالم التكنولوجيا، وذلك عبر برامج أكاديمية متطورة تهدف إلى تحقيق التميز في التعليم والبحث العلمي. نحن نؤمن بأهمية الدمج بين الجوانب النظرية والتطبيقية لتوفير بيئة تعليمية تشجع على الابتكار والابداع.
            </p>

            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              ضمن خطتنا الاستراتيجية، نركز على تعزيز الشراكات مع المؤسسات التعليمية والصناعية لتوفير فرص التدريب والتوظيف، بالإضافة إلى تطوير البنية التحتية لتكنولوجيا التعليم ودعمه بأنظمة تعليمية حديثة تواكب أفضل الممارسات العالمية.
            </p>

            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm">
              نحن نعمل جاهدين لتحقيق أهدافنا الاستراتيجية في تقديم تعليم رفيع المستوى، مع التركيز على القيم الإنسانية والمهنية التي تساهم في إعداد جيل قادر على مواجهة التحديات المستقبلية والمساهمة الفعالة في تطور المجتمع.
            </p>

            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium">
              إننا ندعوكم لاستكشاف موقعنا الإلكتروني لمزيد من المعلومات حول البرامج الأكاديمية، الأنشطة، والفرص التي تقدمها الكلية.
            </p>

            <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-semibold pt-0.5 sm:pt-1">
              معاً، نعمل لبناء مستقبل مشرق.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
