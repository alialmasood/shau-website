"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteBatchAction } from "./actions";
import type { ResultsBatchRow } from "@/lib/resultsRepo";

export default function BatchCard({
  batch,
  isSelected,
  userRole,
}: {
  batch: ResultsBatchRow;
  isSelected: boolean;
  userRole: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const batchDate = new Date(batch.createdAt).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const canDelete = userRole === "ADMIN";

  async function handleDelete() {
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا الاستيراد؟\n\nسيتم حذف سجل الاستيراد فقط، ولن يتم حذف بيانات الطلاب أو النتائج.")) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteBatchAction(batch.id);
        if (result.success) {
          router.refresh();
          // If this batch was selected, redirect to accounts page without batch filter
          if (isSelected) {
            router.push("/admin/accounts?page=1");
          }
        } else {
          alert(result.error || "حدث خطأ أثناء حذف الاستيراد");
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
      }
    });
  }

  return (
    <div
      className={`relative p-3 rounded-lg border-2 transition-colors ${
        isSelected
          ? "border-[#31BD9C] bg-[#31BD9C]/10"
          : "border-neutral-200 hover:border-[#31BD9C]/50 hover:bg-neutral-50"
      }`}
    >
      <Link
        href={`/admin/accounts?batchId=${batch.id}&page=1`}
        prefetch={false}
        className="block"
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-700">
            {batch.stage} - {batch.studyType || "—"} - {batch.attempt}
          </span>
          {isSelected && (
            <span className="text-xs text-[#31BD9C] font-bold">✓ محدث</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mb-1">{batchDate}</p>
        <p className="text-xs text-neutral-600 mb-1 truncate" title={batch.fileName}>
          الملف: {batch.fileName}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-green-600">✓ {batch.importedCount} مستورد</span>
          {batch.skippedCount > 0 && (
            <span className="text-orange-600">⚠ {batch.skippedCount} متخطى</span>
          )}
        </div>
      </Link>

      {canDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isPending}
          className="absolute top-2 left-2 p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="حذف الاستيراد"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
