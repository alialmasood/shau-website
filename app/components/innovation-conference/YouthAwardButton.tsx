"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061528]";

const COPY = {
  ar: {
    trigger: "جائزة الشرق للمبتكر الشاب",
    eyebrow: "لأن الإبداع يبدأ مبكراً",
    title: "جائزة الشرق للمبتكر الشاب",
    body: "جائزة خاصة بطلبة المدارس لاكتشاف الطاقات الإبداعية وتحويل الأفكار إلى مشاريع قابلة للتطبيق، مع عرضها أمام خبراء ومؤسسات داعمة.",
    points: ["مخصصة لطلبة المدارس", "تقييم علمي متخصص", "تكريم وجوائز"],
    close: "إغلاق",
    closeDialog: "إغلاق النافذة",
  },
  en: {
    trigger: "Al-Sharq Young Innovator Award",
    eyebrow: "Because creativity starts early",
    title: "Al-Sharq Young Innovator Award",
    body: "A dedicated award for school students that uncovers creative talent and turns ideas into applicable projects, presented before experts and supporting institutions.",
    points: ["Dedicated to school students", "Specialized scientific review", "Recognition and prizes"],
    close: "Close",
    closeDialog: "Close dialog",
  },
} as const;

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M5 13.5 9.5 18 19 7" />
    </svg>
  );
}

type Props = {
  className?: string;
  children?: ReactNode;
  locale?: "ar" | "en";
};

/**
 * زر يفتح تفاصيل جائزة الشرق للمبتكر الشاب في نافذة منبثقة.
 */
export default function YouthAwardButton({ className = "", children, locale = "ar" }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = COPY[locale];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        id="youth-award"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children ?? t.trigger}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            aria-label={t.close}
            className="absolute inset-0 bg-[#061528]/65 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#E8D4A4]/50 bg-[#FFF9F0] shadow-[0_24px_80px_-24px_rgba(6,21,40,0.55)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E8D4A4]/40 px-5 py-4 sm:px-6">
              <div className="min-w-0 text-start">
                <p className="text-xs font-bold tracking-wide text-[#B8892D] sm:text-sm">
                  {t.eyebrow}
                </p>
                <h2
                  id={titleId}
                  className="mt-1 text-xl font-extrabold leading-snug text-[#163364] sm:text-2xl"
                >
                  {t.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#163364]/70 transition hover:bg-white/80 hover:text-[#163364] ${focus}`}
                aria-label={t.closeDialog}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  ×
                </span>
              </button>
            </div>

            <div className="px-5 py-5 text-start sm:px-6 sm:py-6">
              <p className="text-sm leading-7 text-neutral-700">{t.body}</p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {t.points.map((point) => (
                  <li
                    key={point}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E8D4A4]/80 bg-white px-3 py-1.5 text-xs font-semibold text-[#163364]"
                  >
                    <CheckIcon className="h-3.5 w-3.5 text-[#B8892D]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
