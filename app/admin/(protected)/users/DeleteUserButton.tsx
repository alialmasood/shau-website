"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminUserAction } from "./actions";

export default function DeleteUserButton({ userId, userEmail }: { userId: string; userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userEmail}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteAdminUserAction(userId);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حذف المستخدم");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      title="حذف المستخدم"
    >
      {loading ? "جاري الحذف..." : "حذف"}
    </button>
  );
}
