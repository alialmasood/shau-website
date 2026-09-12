"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  {
    lead: "من هنا...",
    body: "تنطلق الأفكار التي تصنع الفرق",
  },
  {
    lead: "من هنا...",
    body: "تتحول الأفكار إلى حلول تُحدث أثراً",
  },
  {
    lead: "من هنا...",
    body: "يلتقي الإبداع بالعقول التي تصنع الغد",
  },
] as const;

const INTERVAL_MS = 4500;
const FADE_MS = 400;

/**
 * عبارة جانبية في الـHero تتناوب تلقائياً بين ثلاث صياغات بنفس الشكل والمكان.
 */
export default function ConferenceHeroCaption() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimer: number | undefined;
    const swapTimer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(swapTimer);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
    };
  }, []);

  const phrase = PHRASES[index];

  return (
    <p
      className={`absolute bottom-2 end-0 max-w-[14rem] border-s-2 border-[#31BD9C] ps-4 text-start transition-opacity duration-500 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      <span className="block text-sm font-bold text-[#31BD9C]">{phrase.lead}</span>
      <span className="mt-1 block text-lg font-semibold leading-8 text-white/90">
        {phrase.body}
      </span>
    </p>
  );
}
