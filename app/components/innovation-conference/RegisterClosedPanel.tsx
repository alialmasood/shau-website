import Link from "next/link";

type Props = {
  eventDate: string;
  title: string;
  locale?: "ar" | "en";
};

const COPY = {
  ar: {
    eyebrow: "تسجيل المشاركين",
    heading: "التسجيل لم يُفتح بعد",
    body: (title: string) =>
      `باب التسجيل في ${title} غير متاح حالياً. تابع صفحة المؤتمر لمعرفة موعد الفتح.`,
    date: (eventDate: string) => `تاريخ المؤتمر: ${eventDate}`,
    back: "العودة إلى صفحة المؤتمر",
  },
  en: {
    eyebrow: "Participant registration",
    heading: "Registration is not open yet",
    body: (title: string) =>
      `Registration for ${title} is not available at the moment. Follow the conference page to find out when it opens.`,
    date: (eventDate: string) => `Conference date: ${eventDate}`,
    back: "Back to the conference page",
  },
} as const;

export default function RegisterClosedPanel({ eventDate, title, locale = "ar" }: Props) {
  const t = COPY[locale];

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="overflow-x-hidden bg-white">
      <div className="bg-[#061528] px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold text-[#31BD9C]">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t.heading}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {t.body(title)}
          </p>
          <p className="mt-6 text-sm text-[#31BD9C]">{t.date(eventDate)}</p>
          <Link
            href={`/${locale}/innovation-conference`}
            className="mt-8 inline-flex rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-2"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
