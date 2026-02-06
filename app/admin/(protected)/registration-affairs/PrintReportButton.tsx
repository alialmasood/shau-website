"use client";

export default function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-[#31BD9C] px-4 py-2 text-xs font-bold text-white hover:bg-[#2aa88a] transition-colors"
    >
      تصدير تقرير تفصيلي
    </button>
  );
}
