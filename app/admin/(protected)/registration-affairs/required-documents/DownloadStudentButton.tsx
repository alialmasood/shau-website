"use client";

import { useState } from "react";

export default function DownloadStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registration-documents/${studentId}/download`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "فشل التحميل. تأكد من تسجيل الدخول.");
        return;
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${studentName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "_") || "طالب"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("فشل التحميل.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      title="تحميل بيانات الطالب وملفاته"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? "جاري التحميل..." : "تحميل"}
    </button>
  );
}
