"use client";

import { useState } from "react";
import Link from "next/link";

export default function StudentIdRowActions({ serial }: { serial: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف الهوية؟")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student-id/${encodeURIComponent(serial)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "فشل حذف الهوية");
      }
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={`/admin/student-id?serial=${encodeURIComponent(serial)}`}
        className="text-[#31BD9C] hover:underline"
      >
        تعديل
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        حذف
      </button>
    </div>
  );
}
