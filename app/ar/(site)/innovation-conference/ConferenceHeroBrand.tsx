"use client";

import { useEffect, useState } from "react";

const BRAND = "2026-SICIC";
const CHAR_DELAY_MS = 110;
const HOLD_MS = 5000;
const RESET_MS = 450;

/**
 * عرض عمودي متحرك لمختصر المؤتمر على الجانب الفارغ من الـHero.
 * الحروف تصعد واحداً تلو الآخر من الأسفل وتستقر، ثم تعيد الدورة بعد انتظار.
 */
export default function ConferenceHeroBrand() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const letters = BRAND.length;

    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    setVisibleCount(0);

    for (let i = 0; i < letters; i++) {
      schedule(() => {
        if (!cancelled) setVisibleCount(i + 1);
      }, CHAR_DELAY_MS * (i + 1));
    }

    const revealDone = CHAR_DELAY_MS * letters + 520;
    schedule(() => {
      if (cancelled) return;
      setVisibleCount(0);
      schedule(() => {
        if (!cancelled) setCycle((c) => c + 1);
      }, RESET_MS);
    }, revealDone + HOLD_MS);

    return () => {
      cancelled = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [cycle]);

  return (
    <div
      className="pointer-events-none flex select-none flex-col items-center justify-center gap-1.5"
      dir="ltr"
      aria-label="2026-SICIC"
    >
      {BRAND.split("").map((ch, idx) => {
        const isHyphen = ch === "-";
        const isDigit = /\d/.test(ch);
        const visible = idx < visibleCount;
        return (
          <span
            key={`${cycle}-${ch}-${idx}`}
            className={`inline-flex h-12 w-12 items-center justify-center font-extrabold leading-none tracking-wide transition-all duration-500 ease-out xl:h-[3.25rem] xl:w-[3.25rem] ${
              isHyphen
                ? "text-[1.65rem] text-white/40 xl:text-[1.85rem]"
                : isDigit
                  ? "text-[2rem] text-white xl:text-[2.35rem]"
                  : "text-[2rem] text-[#31BD9C] xl:text-[2.35rem]"
            } ${visible ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"}`}
          >
            {isHyphen ? "—" : ch}
          </span>
        );
      })}
    </div>
  );
}
