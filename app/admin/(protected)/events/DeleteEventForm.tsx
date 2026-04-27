"use client";

import { deleteEvent } from "./actions";

export default function DeleteEventForm({ id }: { id: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (!confirm("حذف هذا الحدث نهائياً؟")) e.preventDefault();
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
