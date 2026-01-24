"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.325 24h11.495v-9.294H9.691V11.08h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.626h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.52 3.48A11.76 11.76 0 0 0 12.01 0C5.39 0 .01 5.38.01 12c0 2.11.55 4.17 1.6 5.99L0 24l6.16-1.6A11.95 11.95 0 0 0 12.01 24C18.63 24 24 18.62 24 12c0-3.2-1.25-6.2-3.48-8.52ZM12.01 22.03c-1.87 0-3.7-.5-5.3-1.45l-.38-.22-3.65.95.98-3.56-.25-.39A9.98 9.98 0 0 1 2 12C2 6.48 6.49 2 12.01 2c2.66 0 5.16 1.04 7.04 2.93A9.87 9.87 0 0 1 22.03 12c0 5.53-4.49 10.03-10.02 10.03Zm5.82-7.52c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.71.16-.21.32-.81 1.05-.99 1.27-.18.21-.36.24-.68.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.15.32-.36.48-.54.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55-.18-.01-.39-.01-.6-.01-.21 0-.54.08-.82.4-.28.32-1.08 1.06-1.08 2.58 0 1.52 1.11 2.98 1.26 3.18.15.21 2.18 3.33 5.28 4.67.74.32 1.32.51 1.77.65.74.24 1.41.2 1.95.12.6-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.28-.21-.6-.37Z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0Zm5.82 7.22c-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.69.06-1.22-.46-1.9-.9-1.06-.69-1.65-1.12-2.68-1.8-1.19-.78-.42-1.21.26-1.91.18-.18 3.25-2.98 3.31-3.23.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.25-.02-.11.02-1.79 1.14-5.06 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.87-.44-.75-.25-1.35-.37-1.3-.79.03-.22.33-.44.89-.66 3.5-1.52 5.83-2.53 7-3.01 3.33-1.39 4.03-1.63 4.48-1.56.1 0 .32.02.46.14.12.1.16.24.17.33.02.09.04.31.02.47Z" />
    </svg>
  );
}

type Props = {
  title: string;
  className?: string;
};

export default function SocialShare({ title, className }: Props) {
  // لتجنب hydration mismatch: أول render يكون نفس السيرفر (بدون window)
  // ثم بعد mount نقرأ الرابط الحقيقي من المتصفح.
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHref(window.location.href);
  }, []);

  const copyLink = useCallback(() => {
    if (!href) return;
    navigator.clipboard.writeText(href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  }, [href]);

  const links = useMemo(() => {
    const url = href ? encodeURIComponent(href) : "";
    const text = encodeURIComponent(title);

    return [
      {
        key: "facebook",
        label: "Facebook",
        href: href ? `https://www.facebook.com/sharer/sharer.php?u=${url}` : "",
        icon: <FacebookIcon />,
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        href: href ? `https://wa.me/?text=${encodeURIComponent(`${title} - ${href}`)}` : "",
        icon: <WhatsAppIcon />,
      },
      {
        key: "telegram",
        label: "Telegram",
        href: href ? `https://t.me/share/url?url=${url}&text=${text}` : "",
        icon: <TelegramIcon />,
      },
    ];
  }, [href, title]);

  const copyBtnClass =
    "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 transition-all duration-300 shadow-sm " +
    (href
      ? copied
        ? "text-white bg-[#31BD9C] border-[#31BD9C]"
        : "hover:text-white hover:bg-[#31BD9C] hover:border-[#31BD9C] hover:shadow-md"
      : "opacity-60 pointer-events-none");

  return (
    <div className={className ?? ""}>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!l.href}
            className={[
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-700 transition-all duration-300 shadow-sm",
              l.href
                ? "hover:text-white hover:bg-[#31BD9C] hover:border-[#31BD9C] hover:shadow-md"
                : "opacity-60 pointer-events-none",
            ].join(" ")}
            aria-label={`مشاركة عبر ${l.label}`}
          >
            <span className="w-5 h-5">{l.icon}</span>
            <span className="text-sm font-semibold">{l.label}</span>
          </a>
        ))}
        <button
          type="button"
          onClick={copyLink}
          disabled={!href}
          className={copyBtnClass}
          aria-label="نسخ رابط الخبر"
        >
          <span className="w-5 h-5">
            <CopyIcon />
          </span>
          <span className="text-sm font-semibold">{copied ? "تم النسخ!" : "نسخ الرابط"}</span>
        </button>
      </div>
    </div>
  );
}

