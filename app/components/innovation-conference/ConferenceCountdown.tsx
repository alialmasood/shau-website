"use client";

import { useEffect, useState } from "react";

// Count down to the start of the conference day in Iraq, not an unannounced opening time.
const CONFERENCE_DAY = Date.parse("2026-10-25T00:00:00+03:00");

const COPY = {
  ar: {
    arrived: "حلّ موعد مؤتمر الابتكار 2026",
    lead: "نلتقي بعد",
    timerLabel: "الوقت المتبقي حتى يوم المؤتمر بتوقيت العراق",
    units: ["يوم", "ساعة", "دقيقة", "ثانية"],
    note: "حتى بداية يوم 25 تشرين الأول 2026، بتوقيت العراق.",
  },
  en: {
    arrived: "Innovation Conference 2026 starts today",
    lead: "Starting in",
    timerLabel: "Time remaining until the conference day, Iraq time",
    units: ["Days", "Hours", "Minutes", "Seconds"],
    note: "Until the start of 25 October 2026, Iraq time.",
  },
} as const;

export default function ConferenceCountdown({ locale = "ar" }: { locale?: "ar" | "en" }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const t = COPY[locale];

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, CONFERENCE_DAY - Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const seconds = remaining === null ? null : Math.floor(remaining / 1000);
  const units = [
    { label: t.units[0], value: seconds === null ? null : Math.floor(seconds / 86400) },
    { label: t.units[1], value: seconds === null ? null : Math.floor(seconds / 3600) % 24 },
    { label: t.units[2], value: seconds === null ? null : Math.floor(seconds / 60) % 60 },
    { label: t.units[3], value: seconds === null ? null : seconds % 60 },
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-200">
        {remaining === 0 ? t.arrived : t.lead}
      </p>
      <div role="timer" aria-label={t.timerLabel} aria-live="off" className="grid grid-cols-4 gap-2 sm:gap-4">
        {units.map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white/5 px-2 py-3 text-center sm:px-4">
            <span className="block text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
              {value === null ? "—" : String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 block text-xs text-slate-200 sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-300">{t.note}</p>
    </div>
  );
}
