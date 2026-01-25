"use client";

import { useState } from "react";

const ChevronDown = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export type FAQItem = { q: string; a: string };

type Props = {
  items: FAQItem[];
  isRtl?: boolean;
};

export default function FAQAccordion({ items, isRtl }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border-b border-neutral-200 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={`w-full flex items-center justify-between gap-3 px-4 md:px-5 py-4 text-left transition-colors hover:bg-neutral-50 ${isRtl ? "flex-row-reverse text-right" : ""}`}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              id={`faq-question-${i}`}
            >
              <span className="font-semibold text-neutral-900 text-sm md:text-base">
                {item.q}
              </span>
              <span
                className="text-[#31BD9C] transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <ChevronDown />
              </span>
            </button>
            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <p
                  className={`px-4 md:px-5 pb-4 text-neutral-600 text-sm md:text-base ${isRtl ? "text-right" : "text-left"}`}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
