"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registration-documents/${studentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        alert(json?.error || "فشل حذف البيانات. تأكد من تسجيل الدخول.");
        return;
      }

      // إعادة تحميل الصفحة لعرض التحديثات
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("فشل حذف البيانات.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الحذف..." : "تأكيد الحذف"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      title={`حذف بيانات ${studentName}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      حذف
    </button>
  );
}
