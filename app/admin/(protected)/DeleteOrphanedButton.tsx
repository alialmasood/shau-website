"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  label: string;
  count: number;
  onDelete: () => Promise<{ success: boolean; deletedCount: number; error?: string }>;
  confirmMessage: string;
  pagePath?: string;
};

export default function DeleteOrphanedButton({
  label,
  count,
  onDelete,
  confirmMessage,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (count === 0) return null;

  async function handleClick() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const result = await onDelete();
      if (result.success) {
        router.refresh();
        alert(`تم حذف ${result.deletedCount} سجل بنجاح.`);
      } else {
        alert(result.error || "حدث خطأ أثناء الحذف");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={`حذف ${count} سجل قديم`}
    >
      {loading ? "جاري الحذف..." : label} ({count})
    </button>
  );
}
