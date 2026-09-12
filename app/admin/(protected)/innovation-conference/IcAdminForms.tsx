"use client";

import { useActionState } from "react";
import {
  updateIcAdminNotesAction,
  updateIcApplicationStatusAction,
  type IcAdminActionState,
} from "./actions";
import type { IcApplicationStatus } from "@/lib/innovationConferenceTypes";
import { getStatusPublicCopy } from "@/lib/innovationConferenceStatus";

const initial: IcAdminActionState = { ok: false, message: "" };

export function StatusUpdateForm({
  applicationId,
  currentStatus,
  allowedNext,
}: {
  applicationId: string;
  currentStatus: IcApplicationStatus;
  allowedNext: IcApplicationStatus[];
}) {
  const [state, action, pending] = useActionState(updateIcApplicationStatusAction, initial);

  if (allowedNext.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        لا توجد انتقالات متاحة من الحالة الحالية ({getStatusPublicCopy(currentStatus).title}).
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <label className="mb-1 block text-xs font-bold text-neutral-600">الحالة الجديدة</label>
        <select
          name="toStatus"
          required
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            اختر الحالة
          </option>
          {allowedNext.map((s) => (
            <option key={s} value={s}>
              {getStatusPublicCopy(s).title} ({s})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-neutral-600">
          ملاحظة داخلية (اختياري)
        </label>
        <textarea
          name="note"
          rows={3}
          maxLength={2000}
          placeholder="تظهر للأدمن فقط في سجل الحالات"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#31BD9C] px-4 py-2 text-sm font-bold text-white hover:bg-[#2aa88a] disabled:opacity-60"
      >
        {pending ? "جاري التحديث..." : "تحديث الحالة"}
      </button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}

export function AdminNotesForm({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const [state, action, pending] = useActionState(updateIcAdminNotesAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <textarea
        name="adminNotes"
        rows={5}
        maxLength={10000}
        defaultValue={initialNotes}
        placeholder="ملاحظات داخلية للإدارة فقط"
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ الملاحظات"}
      </button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}
