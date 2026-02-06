"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSubjectAction, deleteSubjectAction, updateSubjectScoreAction } from "./actions";

type SubjectRow = {
  name?: string;
  score?: number | string | null;
  units?: number | string | null;
};

type Props = {
  resultId: string;
  subjects: SubjectRow[];
};

function isUnitsSubject(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.includes("وحدات") || n.includes("units") || n === "عدد الوحدات";
}

export default function GradesEditor({ resultId, subjects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    score: "",
    units: "",
  });

  const rows = useMemo(
    () =>
      (subjects || [])
        .filter((s) => !isUnitsSubject(String(s.name || "")))
        .map((s) => ({
          name: String(s.name || "").trim(),
          score: s.score ?? "",
          units: s.units ?? "",
        })),
    [subjects]
  );

  async function handleUpdate(name: string, score: string, units: string) {
    setError(null);
    setSuccess(null);
    const scoreNum = Number(score);
    if (!name.trim()) {
      setError("اسم المادة مطلوب");
      return;
    }
    if (!Number.isFinite(scoreNum)) {
      setError("الدرجة يجب أن تكون رقمًا");
      return;
    }
    const unitsNum = units.trim() === "" ? null : Number(units);
    if (units.trim() !== "" && !Number.isFinite(unitsNum)) {
      setError("عدد الوحدات يجب أن يكون رقمًا");
      return;
    }

    startTransition(async () => {
      try {
        await updateSubjectScoreAction({
          resultId,
          subjectName: name,
          score: scoreNum,
          units: unitsNum,
        });
        setSuccess("تم تحديث الدرجة بنجاح");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ أثناء التحديث");
      }
    });
  }

  async function handleDelete(name: string) {
    setError(null);
    setSuccess(null);
    if (!confirm(`هل أنت متأكد من حذف مادة "${name}"؟`)) return;

    startTransition(async () => {
      try {
        await deleteSubjectAction({ resultId, subjectName: name });
        setSuccess("تم حذف المادة بنجاح");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ أثناء الحذف");
      }
    });
  }

  async function handleAdd() {
    setError(null);
    setSuccess(null);
    const name = addForm.name.trim();
    const scoreNum = Number(addForm.score);
    if (!name) {
      setError("اسم المادة مطلوب");
      return;
    }
    if (!Number.isFinite(scoreNum)) {
      setError("الدرجة يجب أن تكون رقمًا");
      return;
    }
    const unitsNum = addForm.units.trim() === "" ? null : Number(addForm.units);
    if (addForm.units.trim() !== "" && !Number.isFinite(unitsNum)) {
      setError("عدد الوحدات يجب أن يكون رقمًا");
      return;
    }

    startTransition(async () => {
      try {
        await addSubjectAction({
          resultId,
          subjectName: name,
          score: scoreNum,
          units: unitsNum,
        });
        setSuccess("تمت إضافة المادة بنجاح");
        setAddForm({ name: "", score: "", units: "" });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "حدث خطأ أثناء الإضافة");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-base font-bold text-neutral-900 mb-3">إضافة مادة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="h-10 px-3 rounded-lg border border-neutral-300"
            placeholder="اسم المادة"
            value={addForm.name}
            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="h-10 px-3 rounded-lg border border-neutral-300"
            placeholder="الدرجة"
            value={addForm.score}
            onChange={(e) => setAddForm((p) => ({ ...p, score: e.target.value }))}
          />
          <input
            className="h-10 px-3 rounded-lg border border-neutral-300"
            placeholder="الوحدات (اختياري)"
            value={addForm.units}
            onChange={(e) => setAddForm((p) => ({ ...p, units: e.target.value }))}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleAdd}
            className="h-10 px-4 rounded-lg bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] disabled:opacity-60"
          >
            إضافة
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-2 text-right">المادة</th>
              <th className="p-2 text-right">الدرجة</th>
              <th className="p-2 text-right">الوحدات</th>
              <th className="p-2 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-neutral-500">
                  لا توجد مواد
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="p-2 min-w-[180px]">{row.name}</td>
                  <td className="p-2">
                    <input
                      className="h-9 px-3 rounded-lg border border-neutral-300 w-full"
                      defaultValue={String(row.score ?? "")}
                      onBlur={(e) => {
                        const score = e.target.value;
                        const unitsInput = e.currentTarget
                          .closest("tr")
                          ?.querySelector<HTMLInputElement>('input[data-units="1"]');
                        const units = unitsInput?.value ?? "";
                        handleUpdate(row.name, score, units);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      data-units="1"
                      className="h-9 px-3 rounded-lg border border-neutral-300 w-full"
                      defaultValue={String(row.units ?? "")}
                      onBlur={(e) => {
                        const units = e.target.value;
                        const scoreInput = e.currentTarget
                          .closest("tr")
                          ?.querySelector<HTMLInputElement>('input:not([data-units="1"])');
                        const score = scoreInput?.value ?? "";
                        handleUpdate(row.name, score, units);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(row.name)}
                      className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
