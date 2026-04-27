"use client";

import { deleteCeActivity } from "./actions";

export default function DeleteCeForm({ id }: { id: string }) {
  return (
    <form
      action={deleteCeActivity}
      onSubmit={(e) => {
        if (!confirm("حذف هذا النشاط وجميع الشهادات والصور المرتبطة؟")) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs font-bold text-red-600 hover:underline">
        حذف
      </button>
    </form>
  );
}
