"use client";

import { useEffect, useState } from "react";
import { DEPARTMENT_OPTIONS, STAGE_OPTIONS } from "./constants";

type Row = {
  id: string;
  code: string;
  nameAr: string;
  department: string;
  stage: string;
};

type Stats = {
  total: number;
  departmentsCount: number;
  byDepartment: { department: string; total: number }[];
};

const baseUrl = typeof window !== "undefined" ? "" : "";

export default function StudentCodeClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [department, setDepartment] = useState("");
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Row>>({});

  const limit = 20;

  function fetchStats() {
    fetch(`${baseUrl}/api/student-exam-codes/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }

  function fetchList() {
    setLoading(true);
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (stage) params.set("stage", stage);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));
    fetch(`${baseUrl}/api/student-exam-codes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(data.list ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [department, stage, search]);

  useEffect(() => {
    fetchList();
  }, [page, department, stage, search]);

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setImportResult("اختر ملف Excel");
      return;
    }
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${baseUrl}/api/student-exam-codes/import`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImportResult(json.error || "فشل الاستيراد");
        return;
      }
      setImportResult(`تم استيراد ${json.imported ?? 0} طالب بنجاح.`);
      fileInput.value = "";
      fetchStats();
      fetchList();
    } catch {
      setImportResult("خطأ في الاتصال");
    } finally {
      setImporting(false);
    }
  }

  function exportExcel() {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (stage) params.set("stage", stage);
    window.open(`${baseUrl}/api/student-exam-codes/export-excel?${params}`, "_blank");
  }

  async function deleteOne(id: string) {
    if (!confirm("حذف هذا الطالب من الكودات؟")) return;
    const res = await fetch(`${baseUrl}/api/student-exam-codes/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchStats();
      fetchList();
    }
  }

  async function saveEdit() {
    if (!editId) return;
    const res = await fetch(`${baseUrl}/api/student-exam-codes/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditId(null);
      setEditForm({});
      fetchList();
    }
  }

  async function bulkDeleteByDepartment() {
    if (!department) {
      alert("اختر القسم أولاً");
      return;
    }
    if (!confirm(`حذف كل طلبة قسم "${department}"؟`)) return;
    const res = await fetch(`${baseUrl}/api/student-exam-codes/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(`تم حذف ${json.deleted ?? 0} طالب`);
      setDepartment("");
      fetchStats();
      fetchList();
    }
  }

  async function bulkDeleteAll() {
    if (!confirm("حذف كل الكودات؟ لا يمكن التراجع.")) return;
    const res = await fetch(`${baseUrl}/api/student-exam-codes/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteAll: true }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(`تم حذف ${json.deleted ?? 0} طالب`);
      fetchStats();
      fetchList();
    }
  }

  function copyVerifyLink(code: string) {
    const url = `${window.location.origin}/student-code/verify?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    alert("تم نسخ رابط التحقق");
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* بطاقات إحصائية */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">الطلبة المضافون</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">الكودات المُولَّدة</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">عدد الأقسام</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.departmentsCount}</p>
            </div>
          </div>
          {/* طلبة لكل قسم — بطاقة مستقلة أوضح */}
          {stats.byDepartment.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-neutral-900 mb-3">طلبة لكل قسم</h3>
              <p className="text-xs text-neutral-500 mb-4">توزيع عدد الطلبة حسب القسم</p>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 text-right">
                      <th className="py-2 px-2 font-semibold">القسم</th>
                      <th className="py-2 px-2 font-semibold w-20">عدد الطلبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byDepartment.map((d) => (
                      <tr key={d.department} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                        <td className="py-2.5 px-2 text-neutral-800">{d.department}</td>
                        <td className="py-2.5 px-2 font-bold text-neutral-900">{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* استيراد Excel */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-3">استيراد من Excel</h2>
        <p className="text-sm text-neutral-600 mb-3">
          الأعمدة المطلوبة: Student name, department, stage
        </p>
        <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="block w-full max-w-xs text-sm text-neutral-600 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#31BD9C] file:text-white file:font-semibold"
          />
          <button
            type="submit"
            disabled={importing}
            className="px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold text-sm hover:bg-[#2aa88a] disabled:opacity-50"
          >
            {importing ? "جاري الاستيراد..." : "استيراد وتوليد الكودات"}
          </button>
        </form>
        {importResult && (
          <p className="mt-3 text-sm text-neutral-700 bg-neutral-100 px-3 py-2 rounded-lg">
            {importResult}
          </p>
        )}
      </div>

      {/* تصدير وحذف جماعي — التصدير يعتمد على الفلتر الحالي */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exportExcel}
          className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-sm font-bold hover:bg-neutral-700"
          title={department || stage ? "تصدير النتائج المطابقة للفلتر الحالي" : "تصدير كل السجلات"}
        >
          تصدير Excel {department || stage ? "(حسب الفلتر)" : "(الكل)"}
        </button>
        <button
          type="button"
          onClick={bulkDeleteByDepartment}
          disabled={!department}
          className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          حذف حسب القسم
        </button>
        <button
          type="button"
          onClick={bulkDeleteAll}
          className="px-4 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
        >
          حذف الكل
        </button>
      </div>

      {/* فلاتر وجدول — القائمة والتصدير يعتمدان على الفلاتر أدناه */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-1">قائمة الطلبة والكودات</h2>
        <p className="text-xs text-neutral-500 mb-4">الجدول والتصدير يطبقان الفلاتر التالية</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 text-sm w-48"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل الأقسام</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل المراحل</option>
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-neutral-500 py-8">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="text-neutral-500 py-8">لا توجد سجلات</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-neutral-500 border-b border-neutral-200">
                    <th className="text-start py-2">الاسم</th>
                    <th className="text-start py-2">القسم</th>
                    <th className="text-start py-2">المرحلة</th>
                    <th className="text-start py-2">الكود</th>
                    <th className="text-start py-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id} className="border-b border-neutral-100">
                      {editId === row.id ? (
                        <>
                          <td>
                            <input
                              value={editForm.nameAr ?? row.nameAr}
                              onChange={(e) => setEditForm((f) => ({ ...f, nameAr: e.target.value }))}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </td>
                          <td>
                            <select
                              value={editForm.department ?? row.department}
                              onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              {DEPARTMENT_OPTIONS.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={editForm.stage ?? row.stage}
                              onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value }))}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              {STAGE_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="font-mono">{row.code}</td>
                          <td>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="text-[#31BD9C] hover:underline ml-2"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditId(null); setEditForm({}); }}
                              className="text-neutral-500 hover:underline"
                            >
                              إلغاء
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 font-semibold text-neutral-900">{row.nameAr}</td>
                          <td className="py-2 text-neutral-700">{row.department}</td>
                          <td className="py-2 text-neutral-700">{row.stage}</td>
                          <td className="py-2 font-mono font-bold">{row.code}</td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => { setEditId(row.id); setEditForm({}); }}
                              className="text-[#31BD9C] hover:underline ml-2"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => copyVerifyLink(row.code)}
                              className="text-neutral-700 hover:underline ml-2"
                            >
                              مشاركة
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteOne(row.id)}
                              className="text-red-600 hover:underline ml-2"
                            >
                              حذف
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-neutral-200 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="px-3 py-1">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-neutral-200 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
