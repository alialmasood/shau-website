"use client";

import { useState } from "react";
import { getBatchDetails } from "./actions";

type BatchWithCreator = {
  id: string;
  departmentCode: string;
  academicYear: string;
  semester: string;
  stage: string;
  studyType: string;
  attempt: string;
  fileName: string;
  fileHash: string | null;
  rowsCount: number;
  importedCount: number;
  skippedCount: number;
  metaSubjectsJson: Record<string, unknown> | null;
  errorsJson: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
  creatorName: string | null;
};

export default function ImportHistoryTable({
  history,
  departments,
}: {
  history: BatchWithCreator[];
  departments: Array<{ code: string; name: string }>;
}) {
  const [selectedBatch, setSelectedBatch] = useState<BatchWithCreator | null>(null);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDepartmentName = (code: string) => {
    return departments.find((d) => d.code === code)?.name || code;
  };

  const handleViewDetails = async (batch: BatchWithCreator) => {
    if (selectedBatch?.id === batch.id && batchDetails) {
      setSelectedBatch(null);
      setBatchDetails(null);
      return;
    }

    setLoading(true);
    setSelectedBatch(batch);
    try {
      const details = await getBatchDetails(batch.id);
      setBatchDetails(details);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      setBatchDetails(null);
    } finally {
      setLoading(false);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>لا توجد سجلات استيراد حتى الآن</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-right p-3 text-sm font-bold text-neutral-700">التاريخ</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">القسم</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">الدور</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">عدد الصفوف</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">مستورد</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">متخطى</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">اسم الملف</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">المستخدم</th>
              <th className="text-right p-3 text-sm font-bold text-neutral-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {history.map((batch) => (
              <tr
                key={batch.id}
                className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                <td className="p-3 text-sm text-neutral-700">{formatDate(batch.createdAt)}</td>
                <td className="p-3 text-sm text-neutral-700">{getDepartmentName(batch.departmentCode)}</td>
                <td className="p-3 text-sm text-neutral-700">{batch.attempt}</td>
                <td className="p-3 text-sm text-neutral-700">{batch.rowsCount}</td>
                <td className="p-3 text-sm text-green-600 font-medium">{batch.importedCount}</td>
                <td className="p-3 text-sm text-red-600 font-medium">{batch.skippedCount}</td>
                <td className="p-3 text-sm text-neutral-700 truncate max-w-xs" title={batch.fileName}>
                  {batch.fileName}
                </td>
                <td className="p-3 text-sm text-neutral-600">{batch.creatorName || "غير معروف"}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleViewDetails(batch)}
                    className="text-[#31BD9C] hover:text-[#2aa888] text-sm font-medium hover:underline"
                  >
                    {selectedBatch?.id === batch.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Details Modal/Expansion */}
      {selectedBatch && (
        <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          {loading ? (
            <p className="text-sm text-neutral-600">جاري التحميل...</p>
          ) : batchDetails ? (
            <div className="space-y-3">
              <h3 className="font-bold text-neutral-900">تفاصيل الدفعة</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-600">المرحلة:</span>{" "}
                  <span className="text-neutral-900">{batchDetails.stage}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600">نوع الدراسة:</span>{" "}
                  <span className="text-neutral-900">{batchDetails.studyType}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600">السنة الأكاديمية:</span>{" "}
                  <span className="text-neutral-900">{batchDetails.academicYear}</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600">الفصل:</span>{" "}
                  <span className="text-neutral-900">{batchDetails.semester}</span>
                </div>
              </div>

              {batchDetails.errorsJson && typeof batchDetails.errorsJson === "object" && "errors" in batchDetails.errorsJson && Array.isArray(batchDetails.errorsJson.errors) && batchDetails.errorsJson.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">الأخطاء:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {(batchDetails.errorsJson.errors as Array<{ row?: number; error?: string; index?: number }>).slice(0, 10).map((err, idx) => (
                      <li key={idx}>
                        {err.row ? `الصف ${err.row}: ` : err.index ? `#${err.index}: ` : ""}
                        {err.error || "خطأ غير معروف"}
                      </li>
                    ))}
                    {batchDetails.errorsJson.errors.length > 10 && (
                      <li className="text-neutral-500">... و {batchDetails.errorsJson.errors.length - 10} خطأ آخر</li>
                    )}
                  </ul>
                </div>
              )}

              {batchDetails.metaSubjectsJson && typeof batchDetails.metaSubjectsJson === "object" && "subjects" in batchDetails.metaSubjectsJson && Array.isArray(batchDetails.metaSubjectsJson.subjects) && (
                <div className="mt-4">
                  <h4 className="font-medium text-neutral-700 mb-2">المواد المكتشفة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(batchDetails.metaSubjectsJson.subjects as string[]).map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">فشل تحميل التفاصيل</p>
          )}
        </div>
      )}
    </div>
  );
}
