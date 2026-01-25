"use client";

type Props = {
  id: string;
  deleteAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export function DeleteDeptFeeButton({ id, deleteAction }: Props) {
  return (
    <form action={deleteAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50"
        onClick={(e) => {
          if (!confirm("حذف هذا السجل؟")) e.preventDefault();
        }}
      >
        حذف
      </button>
    </form>
  );
}
