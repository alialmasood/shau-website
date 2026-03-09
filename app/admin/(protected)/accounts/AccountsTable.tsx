"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFinancialClearance } from "./actions";
import { getDepartmentDisplayName } from "@/lib/departmentNames";
import type { StudentRow } from "@/lib/studentsRepo";

type Department = { code: string; name: string };

export default function AccountsTable({
  students,
  total,
  page,
  pageSize,
  departments,
  stages,
  studyTypes,
  currentFilters,
  selectedBatchId,
}: {
  students: StudentRow[];
  total: number;
  page: number;
  pageSize: number;
  departments: Department[];
  stages: string[];
  studyTypes: string[];
  currentFilters: {
    departmentCode?: string;
    stage?: string;
    studyType?: string;
    financialClearance?: boolean;
    search?: string;
    batchId?: string;
  };
  selectedBatchId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(currentFilters.search || "");
  const [departmentFilter, setDepartmentFilter] = useState(currentFilters.departmentCode || "");
  const [stageFilter, setStageFilter] = useState(currentFilters.stage || "");
  const [studyTypeFilter, setStudyTypeFilter] = useState(currentFilters.studyType || "");
  const [paidFilter, setPaidFilter] = useState<string>(
    currentFilters.financialClearance === true ? "true" : currentFilters.financialClearance === false ? "false" : ""
  );
  const [isPending, startTransition] = useTransition();

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (departmentFilter) params.set("department", departmentFilter);
    if (stageFilter) params.set("stage", stageFilter);
    if (studyTypeFilter) params.set("studyType", studyTypeFilter);
    if (paidFilter) params.set("paid", paidFilter);
    if (search) params.set("search", search);
    // Preserve batchId if it exists
    if (selectedBatchId) params.set("batchId", selectedBatchId);
    params.set("page", String(newPage));
    params.set("pageSize", String(pageSize));
    router.push(`/admin/accounts?${params.toString()}`);
  }

  async function handleToggle(studentId: string, currentValue: boolean) {
    startTransition(async () => {
      try {
        await toggleFinancialClearance(studentId, !currentValue);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "حدث خطأ");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">البحث</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="اسم الطالب أو رقم الطالب"
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">القسم</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          >
            <option value="">الكل</option>
            {departments.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">المرحلة</label>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          >
            <option value="">الكل</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">نوع الدراسة</label>
          <select
            value={studyTypeFilter}
            onChange={(e) => setStudyTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          >
            <option value="">الكل</option>
            {studyTypes.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">الحالة المالية</label>
          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          >
            <option value="">الكل</option>
            <option value="true">مدفوع</option>
            <option value="false">غير مدفوع</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => applyFilters(1)}
          className="px-4 py-2 rounded-lg bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a]"
        >
          تطبيق الفلاتر
        </button>
        <button
          onClick={() => {
            setDepartmentFilter("");
            setStageFilter("");
            setStudyTypeFilter("");
            setPaidFilter("");
            setSearch("");
            // Remove batchId filter as well
            router.push("/admin/accounts?page=1&pageSize=" + pageSize);
          }}
          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-bold hover:bg-neutral-50"
        >
          إعادة تعيين
        </button>
      </div>

      {/* Total count */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">
            إجمالي النتائج: <span className="font-bold text-neutral-900">{total}</span>
          </p>
          {selectedBatchId && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠ عرض الطلاب من استيراد محدد فقط
            </p>
          )}
        </div>
        <p className="text-sm text-neutral-600">
          عرض {students.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, total)} من {total}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">رقم الطالب</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">الاسم</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">القسم</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">المرحلة</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">نوع الدراسة</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">الحالة المالية</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-neutral-700">آخر تحديث</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={`${student.studentId}-${student.departmentCode}`} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm text-neutral-900">{student.studentId}</td>
                  <td className="px-4 py-3 text-sm text-neutral-900">{student.fullName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-900">
                    {getDepartmentDisplayName(student.departmentCode)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900">{student.stage}</td>
                  <td className="px-4 py-3 text-sm text-neutral-900">{student.studyType || "—"}</td>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={student.financialClearance}
                        onChange={() => handleToggle(student.studentId, student.financialClearance)}
                        disabled={isPending}
                        className="w-4 h-4 text-[#31BD9C] border-neutral-300 rounded focus:ring-[#31BD9C]"
                      />
                      <span className={`text-sm font-semibold ${student.financialClearance ? "text-green-600" : "text-red-600"}`}>
                        {student.financialClearance ? "مدفوع" : "غير مدفوع"}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(student.updatedAt).toLocaleDateString("ar-IQ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => applyFilters(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          
          <span className="px-4 py-2 text-sm text-neutral-700">
            صفحة {page} من {Math.ceil(total / pageSize)}
          </span>
          
          <button
            onClick={() => applyFilters(page + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
