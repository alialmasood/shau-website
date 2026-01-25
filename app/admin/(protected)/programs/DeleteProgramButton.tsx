"use client";

import { deleteProgramAction } from "./actions";

type Props = { id: string };

export function DeleteProgramButton({ id }: Props) {
  return (
    <form action={async (fd) => { await deleteProgramAction(fd); }} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50"
        onClick={(e) => {
          if (!confirm("حذف هذا البرنامج؟")) e.preventDefault();
        }}
      >
        حذف
      </button>
    </form>
  );
}
