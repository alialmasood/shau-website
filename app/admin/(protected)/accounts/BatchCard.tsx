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
  departmentName,
}: {
  batch: ResultsBatchRow;
  isSelected: boolean;
  userRole: string;
  departmentName: string;
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
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا الاستيراد؟\n\nسيتم حذف سجل الاستيراد وسجلات النتائج المرتبطة به.\nلا يمكن التراجع عن هذا الإجراء.")) {
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
      className={`relative p-4 min-h-[112px] w-[200px] flex-none rounded-lg border-2 transition-colors ${
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-neutral-800 truncate">
              {departmentName}
            </div>
            <div className="text-[11px] text-neutral-600 mt-1">
              {batch.stage} • {batch.attempt}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {batchDate}
            </div>
          </div>

          {isSelected && (
            <span className="text-[11px] text-[#31BD9C] font-bold">✓ محدث</span>
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
