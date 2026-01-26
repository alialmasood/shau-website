"use client";

import { useState } from "react";

export default function ExportDocumentsButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registration-documents/export", { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "فشل التصدير. تأكد من تسجيل الدخول.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "المستمسكات_المطلوبة.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("فشل التصدير.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? "جاري التصدير..." : "تصدير Excel"}
    </button>
  );
}
