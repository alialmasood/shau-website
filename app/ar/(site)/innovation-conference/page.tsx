import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { normalizeYouTubeId, youtubeEmbedSrc } from "@/lib/youtubeEmbed";
import ConferenceCountdown from "./ConferenceCountdown";
import ConferenceHeroBrand from "./ConferenceHeroBrand";
import ConferenceHeroCaption from "./ConferenceHeroCaption";
import YouthAwardButton from "./YouthAwardButton";

export const metadata: Metadata = {
  title: "مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026",
  description:
    "نبتكر اليوم... لنصنع حلول الغد. مؤتمر ومعرض ابتكارات ومسابقة في رحاب كلية الشرق التقنية الطبية الأهلية، البصرة، يوم 25 تشرين الأول 2026.",
  alternates: { canonical: "/ar/innovation-conference" },
};

/** رابط فيديو يوتيوب لقسم «عن المؤتمر» */
const IC_ABOUT_VIDEO_URL = "https://www.youtube.com/watch?v=VjeDWhwPdvE";

/** تواصل إدارة المؤتمر */
const IC_CONTACT_EMAIL = "sicic@shau.edu.iq";
/** رقم واتساب دولي بدون + أو أصفار زائدة */
const IC_CONTACT_WHATSAPP = "9647705625811";

const IC_MAILTO_HREF = `mailto:${IC_CONTACT_EMAIL}?subject=${encodeURIComponent("استفسار — مؤتمر SICIC 2026")}`;
const IC_WHATSAPP_HREF = IC_CONTACT_WHATSAPP
  ? `https://wa.me/${IC_CONTACT_WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent("مرحباً، أود التواصل مع إدارة مؤتمر الشرق للابتكار والإبداع SICIC 2026")}`
  : null;

const fields = [
  {
    title: "الابتكار الطبي والصحي",
    description: "حلول وتقنيات تسهم في تطوير الرعاية الصحية والتشخيص والخدمات الطبية.",
    icon: "health",
  },
  {
    title: "الذكاء الاصطناعي والتحول الرقمي",
    description: "تطبيقات وأنظمة ذكية توظف التقنية والبيانات لصناعة حلول أكثر كفاءة.",
    icon: "digital",
  },
  {
    title: "الهندسة والروبوتات والأتمتة",
    description: "ابتكارات هندسية وروبوتية وأنظمة تحكم وأتمتة قابلة للتطوير والتطبيق.",
    icon: "engineering",
  },
  {
    title: "الطاقة والنفط والغاز",
    description: "حلول مبتكرة للطاقة والصناعة النفطية وكفاءة التشغيل والاستدامة.",
    icon: "energy",
  },
  {
    title: "البيئة والاستدامة",
    description: "أفكار لمعالجة التحديات البيئية والمياه والنفايات وبناء مستقبل أكثر استدامة.",
    icon: "leaf",
  },
  {
    title: "الابتكارات المجتمعية والخدمية",
    description: "حلول مبتكرة لتحسين التعليم والخدمات وجودة الحياة ومعالجة تحديات المجتمع.",
    icon: "people",
  },
  {
    title: "الابتكار وريادة الأعمال",
    description: "مشاريع ومنتجات وخدمات مبتكرة تمتلك فرصاً للنمو والتحول إلى أعمال ناجحة.",
    icon: "business",
  },
  {
    title: "الاختراعات وبراءات الاختراع",
    description: "اختراعات ونماذج أولية ومشاريع تمتلك قيمة تقنية وإمكانات للتطوير.",
    icon: "patent",
  },
  {
    title: "مجال مفتوح للابتكار والإبداع",
    description:
      "لديك فكرة مبتكرة لا تنتمي إلى مجال محدد؟ هذا المسار مفتوح للأفكار المختلفة التي تستحق أن ترى النور.",
    icon: "spark",
  },
] as const;

const fieldCardStyles = [
  "bg-[#eef8f5] border-[#31BD9C]/15 hover:border-[#31BD9C]/35 hover:bg-[#e6f6f1]",
  "bg-[#eef2f8] border-[#163364]/10 hover:border-[#163364]/25 hover:bg-[#e6ecf6]",
  "bg-[#f3faf7] border-[#31BD9C]/12 hover:border-[#31BD9C]/30 hover:bg-[#ebf7f2]",
  "bg-[#f7f5f2] border-neutral-200/80 hover:border-neutral-300 hover:bg-[#f3f0eb]",
  "bg-[#eef8f5] border-[#31BD9C]/15 hover:border-[#31BD9C]/35 hover:bg-[#e6f6f1]",
  "bg-[#eef2f8] border-[#163364]/10 hover:border-[#163364]/25 hover:bg-[#e6ecf6]",
  "bg-[#f3faf7] border-[#31BD9C]/12 hover:border-[#31BD9C]/30 hover:bg-[#ebf7f2]",
  "bg-[#f7f5f2] border-neutral-200/80 hover:border-neutral-300 hover:bg-[#f3f0eb]",
] as const;

type IconName =
  | (typeof fields)[number]["icon"]
  | "calendar"
  | "pin"
  | "award"
  | "users"
  | "check"
  | "clock"
  | "help";

function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    health: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" />,
    digital: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="3" />
        <path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5M10 10h4v4h-4z" />
      </>
    ),
    engineering: (
      <>
        <rect x="4" y="7" width="16" height="13" rx="3" />
        <path d="M12 3v4M9 12h.01M15 12h.01M8 16h8M1 11v5m22-5v5" />
      </>
    ),
    energy: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    leaf: (
      <>
        <path d="M20 3C9 2 3 6 4 13c1 8 15 9 16-10Z" />
        <path d="M3 22 15 10" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" />
      </>
    ),
    business: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V3h8v4M3 12a22 22 0 0 0 18 0M12 11v4" />
      </>
    ),
    patent: (
      <>
        <path d="M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 11h8M8 15h5" />
        <path d="m14 19 2 1 3-3" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
        <path d="m20 2 2 2M2 20l2 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18M7 15h3m4 0h3" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    award: (
      <>
        <path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H3v3a5 5 0 0 0 5 5m8-8h5v3a5 5 0 0 1-5 5M12 14v6M7 21h10" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21v-2a5 5 0 0 1 10 0v2" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M14 21v-1.5a4 4 0 0 1 6 0V21" />
      </>
    ),
    check: <path d="M5 13.5 9.5 18 19 7" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l3.5 2" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17h.01" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-4";

const participants = [
  {
    title: "طلبة المدارس الإعدادية",
    description: "للطلبة الذين يمتلكون أفكاراً أو مشاريع إبداعية قابلة للتطوير.",
    icon: "spark",
  },
  {
    title: "طلبة الجامعات والكليات والمعاهد",
    description: "للمشاريع الطلابية والابتكارات الأكاديمية والتقنية.",
    icon: "engineering",
  },
  {
    title: "الخريجون والشباب",
    description: "لأصحاب الأفكار والمبادرات والمشاريع الواعدة.",
    icon: "people",
  },
  {
    title: "المبتكرون والمخترعون المستقلون",
    description: "لأصحاب الاختراعات والنماذج الأولية والحلول التقنية.",
    icon: "digital",
  },
  {
    title: "الباحثون",
    description: "لمن يمتلك نتائج أو حلولاً بحثية قابلة للتحول إلى تطبيق عملي.",
    icon: "patent",
  },
  {
    title: "رواد الأعمال وأصحاب المبادرات",
    description: "للمشاريع التي تجمع بين الابتكار والقابلية للنمو والتطبيق.",
    icon: "business",
  },
] as const;

const journey = [
  {
    title: "التسجيل الإلكتروني",
    description: "تعبئة استمارة المشاركة وإدخال بيانات المشروع والفريق ورفع المرفقات المطلوبة.",
    icon: "patent" as const,
  },
  {
    title: "المراجعة الأولية",
    description: "تدقيق الطلب والتأكد من استيفاء شروط المشاركة واكتمال المعلومات الأساسية.",
    icon: "check" as const,
  },
  {
    title: "التقييم العلمي",
    description: "تقييم المشروع وفق معايير الابتكار والأثر وإمكانية التطبيق من قبل مختصين.",
    icon: "digital" as const,
  },
  {
    title: "القبول للعرض",
    description: "إبلاغ المشاريع المتأهلة واستكمال متطلبات المشاركة وتجهيز مساحة العرض.",
    icon: "award" as const,
  },
  {
    title: "العرض في المؤتمر",
    description: "عرض الابتكار أمام المحكمين والجهات المشاركة والجمهور ضمن فعاليات يوم المؤتمر.",
    icon: "spark" as const,
  },
] as const;

const questions = [
  [
    "من يمكنه المشاركة في المؤتمر؟",
    "المشاركة مفتوحة لطلبة المدارس والجامعات والخريجين والشباب والمبتكرين والمخترعين والباحثين ورواد الأعمال، بصورة فردية أو ضمن فريق.",
  ],
  [
    "هل توجد رسوم للمشاركة؟",
    "سيتم الإعلان عن جميع تفاصيل التسجيل وشروط المشاركة عند فتح باب التقديم رسمياً.",
  ],
  [
    "هل يمكن المشاركة ضمن فريق؟",
    "نعم، يمكن المشاركة بصورة فردية أو ضمن فريق يتكون من 2 إلى 4 أعضاء.",
  ],
  [
    "هل يشترط امتلاك براءة اختراع؟",
    "لا. يقبل المؤتمر الأفكار الابتكارية المتقدمة والنماذج الأولية والمشاريع القابلة للتطبيق، إضافة إلى الاختراعات المسجلة أو قيد التسجيل.",
  ],
  [
    "متى يغلق باب التسجيل؟",
    "سيعلن موعد فتح وغلق التسجيل رسمياً عند إطلاق منصة التقديم.",
  ],
  [
    "هل يحصل المشاركون على شهادات؟",
    "يحصل أصحاب المشاريع المقبولة الذين يشاركون فعلياً في فعاليات المؤتمر على شهادات مشاركة رسمية.",
  ],
] as const;

const partnerOrganizations = [
  { name: "المصرف الأهلي العراقي", src: "/ahli.png" },
  { name: "شركة سويج للدفع الإلكتروني", src: "/swech.png" },
  { name: "شركة نفط البصرة", src: "/poc.png" },
  { name: "زين العراق", src: "/zain.png" },
  { name: "جامعة البصرة", src: "/uob-logo.png" },
  { name: "منظمة العلوم الكندية", src: "/cso.png" },
  { name: "وزارة التعليم العالي والبحث العلمي", src: "/mohesr.png" },
  { name: "المجموعة الأمريكية للاستشارات والمؤتمرات والتدريب", src: "/imno.png" },
] as const;

export default function InnovationConferencePage() {
  const aboutVideoId = normalizeYouTubeId(IC_ABOUT_VIDEO_URL);
  const aboutVideoEmbed = aboutVideoId
    ? youtubeEmbedSrc(aboutVideoId, { autoplay: true, mute: true })
    : null;

  return (
    <div dir="rtl" className="overflow-x-hidden bg-white text-neutral-800">
      <section
        aria-labelledby="conference-title"
        className="relative isolate flex min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-[#061528] text-white sm:min-h-[680px] lg:min-h-[680px]"
      >
        <Image
          src="/conf.png"
          alt="مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026 — SICIC 2026"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[18%_center] sm:object-[22%_center] lg:object-[28%_center]"
        />
        {/* Overlay أخف لإظهار conf.png مع الإبقاء على وضوح النص */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#061528]/25" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-l from-[#061528]/92 via-[#061528]/55 to-[#061528]/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#061528]/75 via-transparent to-[#061528]/20"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-16 pb-10 sm:px-6 sm:py-20 sm:pb-12 lg:px-8 lg:py-24 lg:pb-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 xl:gap-16">
            {/* جهة النص — اليمين في RTL */}
            <div className="min-w-0 max-w-3xl">
              <h1
                id="conference-title"
                className="font-extrabold leading-[1.35] xl:leading-[1.25]"
              >
                <span className="block text-[1.55rem] leading-snug sm:whitespace-nowrap sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl">
                  مؤتمر الشرق الدولي الأول
                </span>
                <span className="mt-3 block text-[1.2rem] leading-snug sm:mt-5 sm:whitespace-nowrap sm:text-3xl md:text-4xl lg:text-[2.5rem] xl:text-5xl">
                  <span className="text-[#31BD9C]">للابتكار والإبداع</span>
                  <span className="text-white"> 2026</span>
                  <span className="ms-2 text-[#31BD9C] tracking-[0.08em]" dir="ltr">
                    SICIC
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg font-medium leading-9 text-white/90 sm:mt-6 sm:text-xl md:text-2xl md:leading-10">
                نبتكر اليوم... لنصنع حلول الغد
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 text-sm leading-7 text-white/90 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
                <li className="flex items-center gap-2">
                  <Icon name="calendar" className="h-5 w-5 shrink-0 text-[#31BD9C]" />
                  <time dateTime="2026-10-25">25 تشرين الأول 2026</time>
                </li>
                <li className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden="true" />
                <li className="flex items-start gap-2 sm:items-center">
                  <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-[#31BD9C] sm:mt-0" />
                  <span>رحاب كلية الشرق التقنية الطبية الأهلية</span>
                </li>
                <li className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden="true" />
                <li className="flex items-center gap-2 ps-7 sm:ps-0">البصرة / العراق</li>
              </ul>

              <div className="mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:max-w-xl sm:flex-row">
                <a
                  href="/ar/innovation-conference/register"
                  className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#31BD9C] px-7 py-3.5 text-base font-bold text-[#061528] transition hover:brightness-105 sm:w-auto ${focus}`}
                >
                  سجل ابتكارك
                </a>
                <a
                  href="#conference-about"
                  className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/35 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/12 sm:w-auto ${focus}`}
                >
                  تعرف على المؤتمر
                </a>
              </div>

              <div className="mt-8 max-w-xl rounded-2xl border border-white/15 bg-[#061528]/45 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-md sm:mt-10 sm:p-5">
                <ConferenceCountdown />
              </div>
            </div>

            {/* جهة الصورة — اليسار في RTL: مختصر بمحاذاة العنوان + تعليق */}
            <div className="relative hidden lg:block">
              <div className="pointer-events-none absolute top-0 left-0 -translate-x-20 xl:-translate-x-32 2xl:-translate-x-40">
                <ConferenceHeroBrand />
              </div>
              <ConferenceHeroCaption />
            </div>
          </div>
        </div>
      </section>

      <section
        id="conference-about"
        className="scroll-mt-32 bg-white pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-4 lg:ps-2 lg:pe-0 xl:gap-5 xl:ps-3">
          {/* الخانة 1: النص — يمتد حتى يظهر بثلاثة أسطر */}
          <div className="min-w-0 flex-1 lg:max-w-none">
            <p className="mb-3 text-sm font-bold text-[#31BD9C]">رؤية تبدأ من فكرة</p>
            <h2 className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]">
              عن المؤتمر
            </h2>
            <p className="mt-6 max-w-none text-base leading-8 text-neutral-700 sm:text-lg sm:leading-9 lg:text-[1.125rem] lg:leading-9 xl:text-lg xl:leading-9">
              يجمع مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026 العقول الشابة والمبدعين
              والخبراء والمؤسسات، لعرض المشاريع الواعدة وتحويلها إلى حلول تخدم المجتمع. نسعى
              لأن يكون منصة سنوية لاكتشاف الطاقات وربطها بالفرص والخبرات الداعمة.
            </p>
            <button
              type="button"
              className={`mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#163364] transition-colors hover:text-[#31BD9C] ${focus}`}
            >
              اكتشف رؤية المؤتمر
              <span aria-hidden="true">←</span>
            </button>
          </div>

          {/* الخانتان عند الطرف لإفساح عرض النص */}
          <div className="grid w-full shrink-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:w-[min(100%,38rem)] lg:-me-14 xl:w-[40rem] xl:-me-20">
            <div className="flex min-h-[16rem] flex-col justify-center rounded-2xl bg-[#0d2444] px-5 py-8 text-white sm:min-h-[17rem] sm:px-6 sm:py-9">
              <ul className="space-y-5 sm:space-y-6">
                {(
                  [
                    ["منصة للمبتكرين", "spark"],
                    ["شراكات واسعة", "people"],
                    ["مستقبل أفضل", "leaf"],
                  ] as const
                ).map(([label, icon]) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#31BD9C]">
                      <Icon name={icon} className="h-5 w-5" />
                    </span>
                    <span className="text-[0.95rem] font-semibold leading-6 sm:text-base">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#061528] shadow-[0_16px_40px_-24px_rgba(22,51,100,0.45)] sm:aspect-auto sm:min-h-0 sm:h-full">
              {aboutVideoEmbed ? (
                <iframe
                  src={aboutVideoEmbed}
                  title="فيديو عن مؤتمر الشرق الدولي للابتكار والإبداع"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-white/60 sm:text-sm">
                  أضف رابط فيديو يوتيوب لعرضه هنا
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="conference-goals" className="bg-[#F7FAF9] pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#F2FBF8] px-5 pt-6 pb-10 sm:px-8 sm:pt-7 sm:pb-12 lg:px-12 lg:pt-8 lg:pb-14">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 end-[-1.5rem] h-40 w-40 text-[#31BD9C]/15 sm:h-48 sm:w-48 lg:end-4 lg:h-56 lg:w-56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
            </svg>

            <div className="relative mb-8 max-w-2xl sm:mb-10">
              <p className="mb-3 text-sm font-bold text-[#31BD9C]">لماذا هذا المؤتمر؟</p>
              <h2
                id="conference-goals"
                className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]"
              >
                أهداف المؤتمر
              </h2>
              <p className="mt-4 text-sm leading-8 text-neutral-600 sm:text-base">
                نبني جسراً بين الفكرة والفرصة، وبين المبتكر والجهة القادرة على دعمه.
              </p>
            </div>

            <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {(
                [
                  [
                    "دعم الابتكار والإبداع",
                    "اكتشاف الطاقات الشبابية وتشجيع تطوير الأفكار الواعدة.",
                    "spark",
                  ],
                  [
                    "ربط المبتكرين بالمؤسسات والخبراء",
                    "فتح قنوات تواصل مع الجامعات والجهات الداعمة والقطاع الخاص.",
                    "people",
                  ],
                  [
                    "تقديم حلول لمشكلات المجتمع",
                    "تشجيع الابتكارات القابلة للتطبيق وذات الأثر الحقيقي.",
                    "leaf",
                  ],
                  [
                    "تعزيز التعاون العلمي",
                    "بناء شراكات محلية وعربية ودولية في مجالات الابتكار.",
                    "digital",
                  ],
                ] as const
              ).map(([title, description, icon]) => (
                <article
                  key={title}
                  className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_-18px_rgba(22,51,100,0.35)] transition-transform motion-safe:hover:-translate-y-1 sm:p-6"
                >
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31BD9C]/12 text-[#187c67]">
                    <Icon name={icon} />
                  </span>
                  <h3 className="text-base font-extrabold leading-7 text-[#163364]">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl sm:mb-12">
            <p className="mb-3 text-sm font-bold text-[#31BD9C]">مجالات واسعة... وفرص أكبر</p>
            <h2 className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]">
              مجالات الابتكار
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-600 sm:text-base sm:leading-8">
              نستقبل المشاريع والابتكارات ضمن مجالات متنوعة تفتح المجال أمام الأفكار التي تصنع فرقاً
              حقيقياً.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {fields.map((field, index) => {
              const isFeatured = index === 8;
              const number = String(index + 1).padStart(2, "0");

              if (isFeatured) {
                return (
                  <article
                    key={field.title}
                    className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-[1.5rem] bg-[#163364] p-7 text-white transition-all duration-300 motion-safe:hover:-translate-y-1 sm:col-span-2 sm:min-h-[220px] sm:p-8 lg:col-span-1 lg:min-h-[260px]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -end-8 -top-10 h-40 w-40 rounded-full bg-[#31BD9C]/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <div className="relative mb-6 flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#31BD9C] sm:h-[52px] sm:w-[52px]">
                        <Icon name={field.icon} className="h-7 w-7" />
                      </span>
                      <span className="text-xs font-semibold tracking-wider text-white/40">{number}</span>
                    </div>
                    <h3 className="relative text-lg font-extrabold leading-8 sm:text-xl">{field.title}</h3>
                    <p className="relative mt-3 flex-1 text-sm leading-7 text-slate-200">{field.description}</p>
                    <p className="relative mt-5 text-sm font-semibold text-[#31BD9C]">
                      فكرتك قد تكون المجال القادم.
                    </p>
                    <span
                      aria-hidden="true"
                      className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-white/55 transition-colors duration-300 group-hover:text-[#31BD9C]"
                    >
                      استكشف المجال
                      <span>←</span>
                    </span>
                  </article>
                );
              }

              return (
                <article
                  key={field.title}
                  className={`group flex min-h-[220px] flex-col rounded-[1.5rem] border p-6 transition-all duration-300 motion-safe:hover:-translate-y-1 sm:min-h-[240px] sm:p-7 ${fieldCardStyles[index] ?? fieldCardStyles[0]}`}
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#187c67] shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:h-[52px] sm:w-[52px]">
                      <Icon name={field.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
                    </span>
                    <span className="text-xs font-semibold tracking-wider text-neutral-400">{number}</span>
                  </div>
                  <h3 className="text-lg font-extrabold leading-8 text-[#163364]">{field.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-neutral-600">{field.description}</p>
                  <span
                    aria-hidden="true"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#187c67]/70 transition-colors duration-300 group-hover:text-[#187c67]"
                  >
                    استكشف
                    <span>←</span>
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="conference-participants"
        className="w-full bg-[#F7FAF9] py-8 sm:py-10 lg:py-12"
      >
        {/* بطاقتان بعرض الشاشة كاملاً — من حافة إلى حافة */}
        <div className="grid w-full overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.55fr)]">
          {/* البطاقة 1: عنوان القسم */}
          <div className="flex flex-col justify-center bg-[#1a3a5c] px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-16">
            <p className="mb-3 text-sm font-bold text-[#31BD9C]">من لديه فكرة... له مكان هنا</p>
            <h2
              id="conference-participants"
              className="text-3xl font-extrabold leading-snug sm:text-4xl lg:text-[2.75rem]"
            >
              من يمكنه المشاركة؟
            </h2>
            <p className="mt-5 max-w-md text-sm leading-8 text-white/80 sm:text-base sm:leading-8">
              المشاركة مفتوحة أمام مختلف الفئات من الشباب والطلبة والمبتكرين، سواء كانت الفكرة فردية أو
              ضمن فريق.
            </p>
            <div className="mt-8 flex items-start gap-3 border-t border-white/15 pt-6 sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#31BD9C]">
                <Icon name="users" className="h-5 w-5" />
              </span>
              <p className="text-sm leading-7 text-white/90 sm:text-base">
                يمكن المشاركة بصورة فردية أو ضمن فريق من 2–4 أعضاء.
              </p>
            </div>
          </div>

          {/* البطاقة 2: البطاقات الستة */}
          <div className="bg-[#eef4f1] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 xl:px-10">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
              {participants.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl bg-white p-5 transition-colors duration-300 hover:bg-[#eef8f5] sm:p-5"
                >
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7FAF9] text-[#187c67]">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-extrabold leading-7 text-[#163364] sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-7 text-neutral-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="conference-info"
        aria-labelledby="conference-info-title"
        className="w-full bg-white py-6 sm:py-8 lg:py-10"
      >
        <div className="grid w-full overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          {/* معلومات المؤتمر */}
          <div className="relative flex flex-col justify-center overflow-hidden bg-[#163364] px-5 py-8 text-white sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-6 -top-8 h-40 w-40 rounded-full bg-[#B8892D]/15 blur-2xl"
            />
            <p className="relative mb-2 text-xs font-bold text-[#31BD9C] sm:text-sm">موعدنا في البصرة</p>
            <h2
              id="conference-info-title"
              className="relative text-2xl font-extrabold leading-snug sm:text-3xl"
            >
              معلومات المؤتمر
            </h2>
            <p className="relative mt-3 text-sm leading-7 text-white/80 lg:whitespace-nowrap">
              يوم يجمع الأفكار والمبتكرين والخبراء في رحاب كلية الشرق التقنية الطبية الأهلية.
            </p>

            <dl className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:max-w-2xl">
              {(
                [
                  ["التاريخ", "25 تشرين الأول 2026", "calendar"],
                  ["المكان", "كلية الشرق التقنية الطبية", "pin"],
                  ["المدينة", "البصرة / العراق", "users"],
                  ["المدة", "يوم واحد", "clock"],
                ] as const
              ).map(([label, value, icon]) => (
                <div key={label} className="border-s border-white/15 ps-3">
                  <dt className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                    <Icon name={icon} className="h-3.5 w-3.5 text-[#31BD9C]" />
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-bold leading-6 text-white">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="relative mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <a
                href="/ar/innovation-conference/register"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#31BD9C] px-5 py-2.5 text-sm font-bold text-[#061528] transition hover:brightness-105 sm:w-auto ${focus}`}
              >
                سجّل ابتكارك
              </a>
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/75 sm:w-auto"
              >
                البرنامج التفصيلي
              </button>
            </div>
          </div>

          {/* صورة القسم — أصغر من عمود النص */}
          <figure className="relative order-first min-h-[220px] sm:min-h-[260px] lg:order-none lg:min-h-0">
            <Image
              src="/ebdaaa.png"
              alt="إبداع مؤتمر الشرق للابتكار والإبداع"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-center"
            />
          </figure>
        </div>
      </section>

      <section className="bg-[#FAFBFC] py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-bold text-[#31BD9C]">من الفكرة إلى منصة العرض</p>
              <h2 className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]">
                رحلة المشارك
              </h2>
              <p className="mt-4 text-sm leading-8 text-neutral-600 sm:text-base sm:leading-8">
                خمس مراحل واضحة تبدأ بتسجيل المشروع وتنتهي بعرض الابتكار أمام لجنة التحكيم والجمهور.
              </p>
            </div>
            <p className="inline-flex items-center rounded-full border border-[#31BD9C]/25 bg-white px-4 py-2 text-xs font-bold text-[#187c67] sm:text-sm">
              رحلة واحدة • خمس مراحل
            </p>
          </div>

          {/* Mobile / Tablet: Vertical timeline */}
          <ol className="relative space-y-6 lg:hidden">
            <div
              aria-hidden="true"
              className="absolute bottom-3 top-3 start-[1.35rem] w-px bg-[#31BD9C]/35"
            />
            {journey.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 ps-1">
                <span className="relative z-10 mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#163364] text-xs font-bold text-white ring-[6px] ring-[#FAFBFC]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <article className="min-w-0 flex-1 rounded-2xl bg-white p-5 shadow-[0_8px_30px_-22px_rgba(22,51,100,0.35)]">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef8f5] text-[#187c67]">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-extrabold text-[#163364]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{step.description}</p>
                </article>
              </li>
            ))}
          </ol>

          {/* Desktop: Horizontal timeline */}
          <div className="relative hidden lg:block">
            <div
              aria-hidden="true"
              className="absolute start-[10%] end-[10%] top-[2.75rem] h-0.5 bg-[#31BD9C]/35"
            />
            <ol className="relative grid grid-cols-5 gap-5">
              {journey.map((step, index) => (
                <li key={step.title} className="group relative flex flex-col items-center text-center">
                  <span className="relative z-10 mb-6 flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full bg-[#163364] text-sm font-bold text-white ring-8 ring-[#FAFBFC] transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <article className="w-full rounded-2xl bg-white/90 px-4 py-5 transition-all duration-300 motion-safe:group-hover:-translate-y-1">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8f5] text-[#187c67]">
                      <Icon name={step.icon} className="h-6 w-6" />
                    </span>
                    <h3 className="text-base font-extrabold leading-7 text-[#163364]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">{step.description}</p>
                  </article>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-center text-sm font-semibold text-[#187c67]">
              والخطوة التالية... منصة التتويج
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F7FAF9] py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="mb-3 text-sm font-bold text-[#31BD9C]">معاً نصنع الأثر</p>
            <h2 className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]">
              الرعاة والشركاء
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-600 sm:text-base sm:leading-8">
              يجري التنسيق مع مجموعة من المؤسسات الأكاديمية والاقتصادية والجهات الداعمة للمشاركة في
              دعم المؤتمر وفعالياته.
            </p>
          </div>

          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="mx-auto flex min-w-max items-center justify-center gap-2.5 sm:gap-4 lg:min-w-0 lg:w-full lg:gap-5">
              {partnerOrganizations.map((partner) => (
                <li
                  key={partner.name}
                  className="flex h-[4.5rem] w-[6.75rem] shrink-0 items-center justify-center rounded-xl border border-white bg-white/95 px-2.5 py-2 shadow-[0_8px_28px_-20px_rgba(22,51,100,0.35)] transition duration-300 motion-safe:hover:-translate-y-0.5 sm:h-28 sm:w-[11rem] sm:rounded-2xl sm:px-4 sm:py-3 lg:h-32 lg:w-auto lg:min-w-0 lg:flex-1"
                >
                  <div className="relative h-10 w-full sm:h-16 lg:h-[4.5rem]">
                    <Image
                      src={partner.src}
                      alt={partner.name}
                      fill
                      sizes="(min-width: 1024px) 160px, (min-width: 640px) 140px, 100px"
                      className="object-contain"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto mt-12 max-w-2xl sm:mt-14">
            <div className="rounded-[1.75rem] border border-[#31BD9C]/20 bg-white px-5 py-7 text-center shadow-[0_16px_40px_-28px_rgba(22,51,100,0.35)] sm:px-8 sm:py-8">
              <p className="text-sm font-bold text-[#163364] sm:text-base">
                مهتم برعاية المؤتمر أو الشراكة معنا؟
              </p>
              <p className="mt-2 text-xs leading-6 text-neutral-500 sm:text-sm">
                تواصل مع إدارة المؤتمر عبر واتساب أو البريد الإلكتروني
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
                {IC_WHATSAPP_HREF ? (
                  <a
                    href={IC_WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#163364] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a4470] ${focus}`}
                  >
                    <svg
                      className="h-5 w-5 shrink-0 text-[#25D366] transition group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.98.58 3.82 1.58 5.38L2 22l4.94-1.63a9.86 9.86 0 0 0 5.1 1.4h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2Zm5.75 14.13c-.24.67-1.4 1.23-1.93 1.3-.5.08-1.13.11-1.82-.11-.42-.14-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.4-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35h.55c.17 0 .41-.07.64.49.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.28.29-.12.56.17.28.74 1.22 1.59 1.97 1.09.97 2.01 1.27 2.29 1.41.28.14.45.12.61-.07.17-.19.7-.81.89-1.09.19-.28.38-.23.64-.14.26.1 1.66.78 1.95.93.28.14.47.21.54.33.07.12.07.69-.17 1.36Z" />
                    </svg>
                    واتساب
                  </a>
                ) : null}

                <a
                  href={IC_MAILTO_HREF}
                  className={`group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#163364]/15 bg-[#F7FAF9] px-5 py-3 text-sm font-bold text-[#163364] transition hover:border-[#31BD9C]/45 hover:bg-[#eef8f5] ${focus}`}
                >
                  <svg
                    className="h-5 w-5 shrink-0 text-[#31BD9C] transition group-hover:scale-105"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 7 9-7" />
                  </svg>
                  بريد إلكتروني
                </a>
              </div>

              <p className="mt-4 text-xs tracking-wide text-neutral-400" dir="ltr">
                {IC_CONTACT_EMAIL}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16 lg:px-8">
          <div className="max-w-md">
            <p className="mb-3 text-sm font-bold text-[#31BD9C]">إجابات على أهم استفساراتك</p>
            <h2 className="text-3xl font-extrabold leading-snug text-[#163364] sm:text-4xl lg:text-[2.75rem]">
              الأسئلة الشائعة
            </h2>
            <p className="mt-4 text-sm leading-8 text-neutral-600 sm:text-base sm:leading-8">
              معلومات سريعة حول المشاركة والتسجيل وشروط التقديم في المؤتمر.
            </p>
            <div className="mt-8 hidden h-28 w-28 items-center justify-center rounded-[1.75rem] bg-[#eef8f5] text-[#187c67] lg:flex">
              <Icon name="help" className="h-12 w-12" />
            </div>
          </div>

          <div className="space-y-3">
            {questions.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-2xl border border-neutral-200/70 bg-white px-4 py-1 transition-colors open:border-[#31BD9C]/25 open:bg-white sm:px-5"
              >
                <summary
                  className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold leading-7 text-[#163364] [&::-webkit-details-marker]:hidden ${focus}`}
                >
                  <span className="text-sm sm:text-base">{question}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef8f5] text-lg leading-none text-[#187c67] transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="border-t border-neutral-100 pb-4 pt-3 pe-2 text-sm leading-8 text-neutral-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="conference-registration"
        aria-labelledby="conference-registration-title"
        className="relative isolate scroll-mt-32 overflow-hidden bg-[#061528] text-white"
      >
        <Image
          src="/innovation-hub.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#061528]/88" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#061528] via-[#061528]/55 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(49,189,156,0.55) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -start-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#31BD9C]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-10 bottom-0 h-48 w-48 rounded-full bg-[#31BD9C]/15 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:min-h-[400px] lg:justify-center lg:py-24">
          <p className="text-sm font-bold text-[#31BD9C]">الفكرة تبدأ منك</p>
          <h2
            id="conference-registration-title"
            className="mt-4 text-3xl font-extrabold leading-snug sm:text-4xl lg:text-[2.75rem]"
          >
            كن جزءاً من مستقبل الابتكار
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-200 sm:text-base sm:leading-8">
            سجّل ابتكارك وشارك في مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026، وكن ضمن منصة تجمع
            المبدعين والخبراء والمؤسسات الداعمة.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:max-w-3xl sm:flex-row sm:flex-wrap">
            <a
              href="/ar/innovation-conference/register"
              aria-describedby="conference-registration-note"
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#31BD9C] px-8 py-3 text-sm font-bold text-[#061528] transition hover:brightness-105 sm:w-auto ${focus}`}
            >
              سجّل ابتكارك
            </a>
            <a
              href="#conference-about"
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/35 bg-white/5 px-7 py-3 text-sm font-semibold transition-colors hover:bg-white/10 sm:w-auto ${focus}`}
            >
              تعرف على المؤتمر
            </a>
            <YouthAwardButton
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#E8D4A4]/55 bg-[#B8892D]/15 px-7 py-3 text-sm font-semibold text-[#E8D4A4] transition-colors hover:bg-[#B8892D]/25 sm:w-auto ${focus}`}
            />
          </div>

          <p
            id="conference-registration-note"
            className="mt-6 text-xs leading-6 text-slate-300 sm:text-sm"
          >
            25 تشرين الأول 2026 • كلية الشرق التقنية الطبية الأهلية • البصرة
          </p>
        </div>
      </section>
    </div>
  );
}
