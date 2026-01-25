import { getTranslations, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { Fragment } from "react";
import FAQAccordion from "./FAQAccordion";

const ICONS = {
  apply: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  programs: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  tuition: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  contact: (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
};

export default async function StartPageContent({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const s = t.start as Record<string, string>;
  const base = locale === "ar" ? "/ar" : "/en";
  const isRtl = locale === "ar";

  const waNum = s.contactWhatsappNum?.trim() || "9647700000000";
  const waHref = `https://wa.me/${waNum.replace(/\D/g, "") || "9647700000000"}`;
  const phone = s.contactPhone?.trim() || "";
  const telHref = phone ? `tel:${phone}` : "#";
  const mapsHref = s.contactMapsUrl?.trim() || "https://www.google.com/maps";

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 md:px-10 py-10 md:py-14 ${isRtl ? "text-right" : "text-left"}`}>
      {/* العنوان والوصف */}
      <header className="mb-10 md:mb-14">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3">
          {s.title}
        </h1>
        <p className="text-neutral-600 text-base md:text-lg max-w-2xl">
          {s.subtitle}
        </p>
      </header>

      {/* شبكة البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. قدّم الآن */}
        <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
          <div className="w-14 h-14 rounded-xl bg-[#31BD9C]/10 text-[#31BD9C] flex items-center justify-center mb-4">
            {ICONS.apply}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-2">
            {s.card1Title}
          </h2>
          <p className="text-neutral-600 text-sm md:text-base mb-5 line-clamp-2 flex-1">
            {s.card1Desc}
          </p>
          <Link
            href={`${base}/apply`}
            className="inline-flex justify-center md:justify-start items-center px-5 py-2.5 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm md:text-base transition-colors w-fit"
          >
            {s.card1Btn}
          </Link>
        </article>

        {/* 2. استكشف البرامج */}
        <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
          <div className="w-14 h-14 rounded-xl bg-[#31BD9C]/10 text-[#31BD9C] flex items-center justify-center mb-4">
            {ICONS.programs}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-2">
            {s.card2Title}
          </h2>
          <p className="text-neutral-600 text-sm md:text-base mb-5 line-clamp-2 flex-1">
            {s.card2Desc}
          </p>
          <Link
            href={`${base}/programs`}
            className="inline-flex justify-center md:justify-start items-center px-5 py-2.5 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm md:text-base transition-colors w-fit"
          >
            {s.card2Btn}
          </Link>
        </article>

        {/* 3. الرسوم الدراسية */}
        <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
          <div className="w-14 h-14 rounded-xl bg-[#31BD9C]/10 text-[#31BD9C] flex items-center justify-center mb-4">
            {ICONS.tuition}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-2">
            {s.card3Title}
          </h2>
          <p className="text-neutral-600 text-sm md:text-base mb-5 line-clamp-2 flex-1">
            {s.card3Desc}
          </p>
          <Link
            href={`${base}#tuition-fees`}
            className="inline-flex justify-center md:justify-start items-center px-5 py-2.5 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-sm md:text-base transition-colors w-fit"
          >
            {s.card3Btn}
          </Link>
        </article>

        {/* 4. تواصل سريع */}
        <article className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
          <div className="w-14 h-14 rounded-xl bg-[#31BD9C]/10 text-[#31BD9C] flex items-center justify-center mb-4">
            {ICONS.contact}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-2">
            {s.card4Title}
          </h2>
          <p className="text-neutral-600 text-sm md:text-base mb-5 line-clamp-2 flex-1">
            {s.card4Desc}
          </p>
          <div className={`flex flex-wrap gap-2 ${isRtl ? "justify-end" : "justify-start"}`}>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              {s.contactWhatsapp}
            </a>
            <a
              href={telHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {s.contactCall}
            </a>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {s.contactMaps}
            </a>
          </div>
        </article>
      </div>

      {/* خطوات التقديم — Stepper */}
      <section className="mt-12 md:mt-16" aria-labelledby="stepper-heading">
        <h2
          id="stepper-heading"
          className="text-xl md:text-2xl font-bold text-neutral-900 mb-8 md:mb-10"
        >
          {s.stepperTitle}
        </h2>

        {/* موبايل: عمودي (Timeline) */}
        <div className="flex flex-col md:hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""} ${i < 4 ? "mb-1" : ""}`}
            >
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-neutral-700 text-sm md:text-base">{s[`step${i}`]}</p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-full bg-[#31BD9C] text-white flex items-center justify-center font-bold text-sm"
                  aria-hidden
                >
                  {i}
                </div>
                {i < 4 && (
                  <div
                    className="w-0.5 flex-1 min-h-[20px] bg-[#31BD9C]/40"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ديسكتوب: أفقي */}
        <div className="hidden md:flex flex-col">
          <div className="flex items-center w-full">
            {[1, 2, 3, 4].map((i) => (
              <Fragment key={i}>
                <div
                  className="w-10 h-10 rounded-full bg-[#31BD9C] text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
                  aria-hidden
                >
                  {i}
                </div>
                {i < 4 && (
                  <div
                    className="flex-1 h-0.5 bg-[#31BD9C]/40 mx-1 min-w-[24px]"
                    aria-hidden
                  />
                )}
              </Fragment>
            ))}
          </div>
          <div className="flex mt-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-0 text-center text-neutral-700 text-sm"
              >
                {s[`step${i}`]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الأسئلة الشائعة — FAQ Accordion */}
      <section className="mt-12 md:mt-16" aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="text-xl md:text-2xl font-bold text-neutral-900 mb-6 md:mb-8"
        >
          {s.faqTitle}
        </h2>
        <FAQAccordion
          items={[
            { q: s.faq1Q, a: s.faq1A },
            { q: s.faq2Q, a: s.faq2A },
            { q: s.faq3Q, a: s.faq3A },
            { q: s.faq4Q, a: s.faq4A },
            { q: s.faq5Q, a: s.faq5A },
            { q: s.faq6Q, a: s.faq6A },
          ]}
          isRtl={isRtl}
        />
      </section>
    </div>
  );
}
