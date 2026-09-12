import Link from "next/link";

type Props = {
  eventDate: string;
  titleAr: string;
};

export default function RegisterClosedPanel({ eventDate, titleAr }: Props) {
  return (
    <div dir="rtl" className="overflow-x-hidden bg-white">
      <div className="bg-[#061528] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold text-[#31BD9C]">تسجيل المشاركين</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">التسجيل لم يُفتح بعد</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            باب التسجيل في {titleAr} غير متاح حالياً. تابع صفحة المؤتمر لمعرفة موعد الفتح.
          </p>
          <p className="mt-6 text-sm text-[#31BD9C]">تاريخ المؤتمر: {eventDate}</p>
          <Link
            href="/ar/innovation-conference"
            className="mt-8 inline-flex rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-2"
          >
            العودة إلى صفحة المؤتمر
          </Link>
        </div>
      </div>
    </div>
  );
}
