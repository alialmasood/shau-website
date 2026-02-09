"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function PreviewActions() {
  const [serial, setSerial] = useState("");

  const trimmed = serial.trim();
  const canUse = useMemo(() => trimmed.length > 0, [trimmed]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900 mb-3">المعاينة والتحميل</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="أدخل السيريال للمعاينة..."
          className="w-full sm:max-w-sm px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
        />
        <Link
          href={canUse ? `/admin/student-id/preview/${encodeURIComponent(trimmed)}` : "#"}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-[#31BD9C] text-white hover:bg-[#2aa88a]"
              : "bg-neutral-100 text-neutral-400 pointer-events-none"
          }`}
        >
          معاينة الهوية
        </Link>
        <a
          href={canUse ? `/api/id/render?serial=${encodeURIComponent(trimmed)}&side=ar` : "#"}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-100 text-neutral-400 pointer-events-none"
          }`}
        >
          تحميل الواجهة PNG
        </a>
        <a
          href={canUse ? `/api/id/render?serial=${encodeURIComponent(trimmed)}&side=en` : "#"}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-100 text-neutral-400 pointer-events-none"
          }`}
        >
          تحميل الخلفية PNG
        </a>
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        أدخل السيريال ليظهر زر المعاينة والتنزيل.
      </p>
    </div>
  );
}
