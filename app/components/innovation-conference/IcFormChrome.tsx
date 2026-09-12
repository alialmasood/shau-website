"use client";

import type { ReactNode, KeyboardEvent, ClipboardEvent, DragEvent, FormEvent, MouseEvent } from "react";

export const icFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-2";

export const icInputClass =
  `w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition hover:border-neutral-300 focus:border-[#31BD9C] ${icFocus}`;

/** يمنع الكتابة/اللصق اليدوي مع الإبقاء على فتح التقويم الأصلي لـ type=date */
export function icDatePickerGuardProps() {
  return {
    inputMode: "none" as const,
    autoComplete: "off" as const,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      const allowed = new Set([
        "Tab",
        "Escape",
        "Enter",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ]);
      if (allowed.has(e.key)) return;
      if ((e.ctrlKey || e.metaKey) && ["a", "c"].includes(e.key.toLowerCase())) return;
      e.preventDefault();
    },
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
    },
    onDrop: (e: DragEvent<HTMLInputElement>) => {
      e.preventDefault();
    },
    onBeforeInput: (e: FormEvent<HTMLInputElement>) => {
      const ne = e.nativeEvent as InputEvent;
      const t = ne.inputType || "";
      if (t.startsWith("insert") || t.startsWith("delete") || t === "historyUndo" || t === "historyRedo") {
        e.preventDefault();
      }
    },
    onClick: (e: MouseEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      const maybePicker = el as HTMLInputElement & { showPicker?: () => void };
      if (typeof maybePicker.showPicker === "function") {
        try {
          maybePicker.showPicker();
        } catch {
          /* بعض المتصفحات ترفض showPicker دون gesture مناسب */
        }
      }
    },
  };
}

export const icLabelClass = "mb-1.5 block text-sm font-semibold text-[#163364]";

export const icHintClass = "mt-1.5 text-xs text-neutral-500";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

export function CharCounter({
  value,
  min,
  max,
  locale = "ar",
}: {
  value: string;
  min: number;
  max: number;
  locale?: "ar" | "en";
}) {
  const n = value.length;
  const ok = n >= min && n <= max;
  const under = n > 0 && n < min;
  const minLabel = locale === "en" ? `minimum ${min}` : `الحد الأدنى ${min}`;
  return (
    <p
      className={`mt-1.5 text-xs tabular-nums ${
        n > max ? "text-red-600" : under ? "text-amber-700" : ok ? "text-[#187c67]" : "text-neutral-500"
      }`}
    >
      {n} / {max}
      {under ? ` · ${minLabel}` : ""}
    </p>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-extrabold text-[#163364] sm:text-2xl">{children}</h2>;
}

export function SectionLead({ children }: { children: ReactNode }) {
  return <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-[15px]">{children}</p>;
}

type IconName =
  | "health"
  | "digital"
  | "engineering"
  | "energy"
  | "leaf"
  | "people"
  | "business"
  | "patent"
  | "spark"
  | "check"
  | "user"
  | "upload"
  | "file"
  | "trash"
  | "plus";

export function IcIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
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
        <path d="M12 3v4M9 12h.01M15 12h.01M8 16h8" />
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
        <path d="M8 7V3h8v4M3 12a22 22 0 0 0 18 0" />
      </>
    ),
    patent: (
      <>
        <path d="M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 11h8M8 15h5" />
      </>
    ),
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />,
    check: <path d="M5 13.5 9.5 18 19 7" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V6m0 0 4 4m-4-4-4 4" />
        <path d="M4 18h16" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
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

export function focusFieldByKey(key: string) {
  const el =
    document.querySelector<HTMLElement>(`[data-field="${key}"]`) ||
    document.querySelector<HTMLElement>(`[name="${key}"]`) ||
    document.querySelector<HTMLElement>(`#${CSS.escape(key.replace(/\./g, "-"))}`);
  el?.focus();
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}
