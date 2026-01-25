"use client";

import { useState } from "react";
import type { setTuitionPdf } from "./actions";

type SetTuitionPdf = typeof setTuitionPdf;

export default function TuitionPdfForm({ setTuitionPdfAction }: { setTuitionPdfAction: SetTuitionPdf }) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("اختر ملف PDF أولاً");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("يُقبل ملفات PDF فقط");
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/media", { method: "POST", body: fd, credentials: "include" });
      const upJson = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(upJson?.error || "فشل رفع الملف");
      const mediaId = String(upJson.id);
      await setTuitionPdfAction(mediaId);
      setSuccess("تم تعيين ملف PDF بنجاح. سيظهر زر التحميل في قسم الرسوم الدراسية بالهوم.");
      setFile(null);
      // Reset file input
      const input = document.getElementById("tuition-pdf-file") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-green-700 text-sm bg-green-50 px-4 py-2 rounded-lg">{success}</p>}
      <div>
        <label htmlFor="tuition-pdf-file" className="block text-sm font-medium text-neutral-700 mb-2">
          اختر ملف PDF (دليل الرسوم الدراسية)
        </label>
        <input
          id="tuition-pdf-file"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#31BD9C] file:text-white file:font-semibold hover:file:bg-[#2aa88a]"
        />
      </div>
      <button
        type="submit"
        disabled={!file || isSubmitting}
        className="inline-flex px-6 py-2.5 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "جاري الرفع…" : "رفع وتعيين كمرجع للتحميل"}
      </button>
    </form>
  );
}
