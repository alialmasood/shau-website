"use client";

import { useState } from "react";
import { importStudentDirectory } from "./directoryActions";

export default function StudentDirectoryImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function handleImport() {
    if (!file) {
      setError("الرجاء اختيار ملف Excel");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      const res = await importStudentDirectory(base64);
      if (!res.success) {
        setError(res.errors?.[0]?.error || "فشل استيراد الملف");
        return;
      }
      setSuccess("تم استيراد دليل الطلبة بنجاح.");
      setResult({ imported: res.imported, skipped: res.skipped });
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">استيراد قوائم الطلبة</h2>
      <div className="space-y-3">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}
        {result && (
          <div className="text-xs text-neutral-600">
            تم إدراج {result.imported} • تم تخطي {result.skipped}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">ملف Excel</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
          />
          <p className="mt-2 text-xs text-neutral-500">
            الأعمدة المطلوبة: name_ar, name_en, dob, address, blood_type, department, stage
          </p>
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !file}
          className="px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الاستيراد..." : "استيراد"}
        </button>
      </div>
    </div>
  );
}
