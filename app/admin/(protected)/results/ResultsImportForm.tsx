"use client";

import { useState } from "react";
import { previewExcel, importExcel, type PreviewResult } from "./actions";

type Department = { code: string; name: string };

export default function ResultsImportForm({
  departments,
  attempts,
}: {
  departments: Department[];
  attempts: string[];
}) {
  const [departmentCode, setDepartmentCode] = useState("");
  const [attempt, setAttempt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    parsedRowsCount: number;
    validRecordsCount: number;
    invalidRecordsCount: number;
    attempted: number;
    insertedStudents: number;
    updatedStudents: number;
    insertedResults: number;
    updatedResults: number;
    skippedRows: number;
    errors: string[];
    skippedDetails: Array<{ rowIndex: number; studentId: string; fullName: string; reason: string }>;
    rowStatuses: Array<{
      rowIndex: number;
      studentId: string;
      fullName: string;
      studyType: string;
      stage: string;
      status: "IMPORTED" | "SKIPPED" | "ERROR";
      message: string;
    }>;
    sheetName: string;
    headerRowIndex: number;
  } | null>(null);
  const [duplicateBatchId, setDuplicateBatchId] = useState<string | null>(null);
  const [forceReimport, setForceReimport] = useState(false);

  async function handlePreview() {
    if (!file || !departmentCode || !attempt) {
      setError("الرجاء اختيار القسم والدور ورفع الملف");
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      // تحويل الملف إلى base64 string (متوافق مع المتصفح)
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // تحويل Uint8Array إلى base64 بطريقة آمنة للملفات الكبيرة
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      const result = await previewExcel(base64, departmentCode, attempt);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء معاينة الملف");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file || !departmentCode || !attempt) {
      setError("الرجاء اختيار القسم والدور ورفع الملف");
      return;
    }

    if (!preview || preview.validRows === 0) {
      setError("لا توجد صفوف صالحة للاستيراد. يرجى معاينة الملف أولاً");
      return;
    }

    // Check if there are any errors
    if (
      preview.missingStudentId > 0 ||
      preview.missingFullName > 0 ||
      preview.invalidStudyType > 0 ||
      preview.invalidStage > 0 ||
      preview.duplicates > 0
    ) {
      setError("يوجد أخطاء في البيانات. يرجى إصلاحها قبل الاستيراد");
      return;
    }

    if (!confirm(`هل أنت متأكد من استيراد ${preview.validRows} صف؟`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // تحويل الملف إلى base64 string (متوافق مع المتصفح)
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // تحويل Uint8Array إلى base64 بطريقة آمنة للملفات الكبيرة
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      const result = await importExcel(base64, file.name, departmentCode, attempt, forceReimport);
      
      // Handle duplicate file detection
      if (result.error === "DUPLICATE_FILE" && result.duplicateBatchId) {
        setDuplicateBatchId(result.duplicateBatchId);
        setError(result.errors?.[0] || "تم استيراد هذا الملف مسبقاً");
        setLoading(false);
        return;
      }
      
      if (result.success) {
        const parts = [];
        if (result.parsedRowsCount !== undefined) {
          parts.push(`تم تحليل ${result.parsedRowsCount} صف`);
        }
        if (result.attempted !== undefined) {
          parts.push(`تمت محاولة ${result.attempted} صف`);
        }
        if (result.insertedStudents !== undefined && result.insertedStudents > 0) {
          parts.push(`تم إدراج ${result.insertedStudents} طالب جديد`);
        }
        if (result.updatedStudents !== undefined && result.updatedStudents > 0) {
          parts.push(`تم تحديث ${result.updatedStudents} طالب`);
        }
        if (result.insertedResults !== undefined && result.insertedResults > 0) {
          parts.push(`تم إدراج ${result.insertedResults} نتيجة جديدة`);
        }
        if (result.updatedResults !== undefined && result.updatedResults > 0) {
          parts.push(`تم تحديث ${result.updatedResults} نتيجة`);
        }
        if (result.skippedRows !== undefined && result.skippedRows > 0) {
          parts.push(`تم تخطي ${result.skippedRows} صف`);
        }
        if (result.errors && result.errors.length > 0) {
          parts.push(`${result.errors.length} خطأ`);
        }
        
        const summary = parts.length > 0 ? parts.join(" • ") : `تم استيراد ${preview.validRows} صف بنجاح!`;
        setSuccess(summary);
        
        // Store import result for detailed table display
        setImportResult({
          parsedRowsCount: result.parsedRowsCount || 0,
          validRecordsCount: result.validRecordsCount || 0,
          invalidRecordsCount: result.invalidRecordsCount || 0,
          attempted: result.attempted || 0,
          insertedStudents: result.insertedStudents || 0,
          updatedStudents: result.updatedStudents || 0,
          insertedResults: result.insertedResults || 0,
          updatedResults: result.updatedResults || 0,
          skippedRows: result.skippedRows || 0,
          errors: result.errors || [],
          skippedDetails: result.skippedDetails || [],
          rowStatuses: result.rowStatuses || [],
          sheetName: result.sheetName || "",
          headerRowIndex: result.headerRowIndex || -1,
        });
        
        // Log detailed summary
        console.log("📊 Import Summary:", result);
        
        // Log errors if any
        if (result.errors && result.errors.length > 0) {
          console.warn("❌ Import errors:", result.errors);
        }
        
        setPreview(null);
        setFile(null);
        setDepartmentCode("");
        setAttempt("");
      } else {
        setError(result.error || "فشل الاستيراد");
        // Also show error details if available
        if (result.rowStatuses && result.rowStatuses.length > 0) {
          setImportResult({
            parsedRowsCount: result.parsedRowsCount || 0,
            validRecordsCount: result.validRecordsCount || 0,
            invalidRecordsCount: result.invalidRecordsCount || 0,
            attempted: result.attempted || 0,
            insertedStudents: result.insertedStudents || 0,
            updatedStudents: result.updatedStudents || 0,
            insertedResults: result.insertedResults || 0,
            updatedResults: result.updatedResults || 0,
            skippedRows: result.skippedRows || 0,
            errors: result.errors || [],
            skippedDetails: result.skippedDetails || [],
            rowStatuses: result.rowStatuses || [],
            sheetName: result.sheetName || "",
            headerRowIndex: result.headerRowIndex || -1,
          });
        }
        
        // Reset duplicate state on successful import
        setDuplicateBatchId(null);
        setForceReimport(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد");
    } finally {
      setLoading(false);
    }
  }

  const canImport = preview && preview.validRows > 0 && 
    preview.missingStudentId === 0 &&
    preview.missingFullName === 0 &&
    preview.invalidStudyType === 0 &&
    preview.invalidStage === 0 &&
    preview.duplicates === 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
          <p className="font-bold">خطأ</p>
          <p className="text-sm">{error}</p>
          {duplicateBatchId && (
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setForceReimport(true);
                  setError(null);
                  setDuplicateBatchId(null);
                  handleImport();
                }}
                className="px-4 py-2 bg-[#31BD9C] text-white rounded-lg hover:bg-[#2aa888] font-medium"
              >
                إعادة الاستيراد كتحديث
              </button>
              <button
                onClick={() => {
                  setDuplicateBatchId(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-300 text-green-800">
          <p className="font-bold">نجح</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            القسم <span className="text-red-500">*</span>
          </label>
          <select
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          >
            <option value="">اختر القسم</option>
            {departments.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            الدور <span className="text-red-500">*</span>
          </label>
          <select
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          >
            <option value="">اختر الدور</option>
            {attempts.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-900 mb-2">
          ملف Excel <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">
          يجب أن يحتوي الملف على الأعمدة التالية: student_id, full_name, study_type, stage
          <br />
          نوع الدراسة والمرحلة سيتم قراءتهما من الملف مباشرة
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading || !file || !departmentCode || !attempt}
          className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "جاري المعاينة..." : "معاينة"}
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !canImport}
          className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الاستيراد..." : "استيراد"}
        </button>
      </div>

      {preview && (
        <div className="mt-6 p-6 rounded-xl border border-neutral-200 bg-neutral-50">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">نتائج المعاينة</h3>
          
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-bold text-blue-900 mb-1">معلومات التصحيح:</p>
            <p className="text-xs text-blue-700">
              Sheet Name: {preview.sheetName || "N/A"}
            </p>
            <p className="text-xs text-blue-700">
              صف Header المكتشف: {preview.detectedHeaderRowIndex}
            </p>
            <p className="text-xs text-blue-700">
              Headers ({preview.detectedHeaders.length}): {preview.detectedHeaders.slice(0, 10).join(", ")}
              {preview.detectedHeaders.length > 10 && "..."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">إجمالي الصفوف</p>
              <p className="text-2xl font-extrabold text-neutral-900">{preview.totalRows}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">صفوف صالحة</p>
              <p className="text-2xl font-extrabold text-green-600">{preview.validRows}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">student_id مفقود</p>
              <p className="text-2xl font-extrabold text-red-600">{preview.missingStudentId}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">full_name مفقود</p>
              <p className="text-2xl font-extrabold text-red-600">{preview.missingFullName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">study_type غير صالح</p>
              <p className="text-2xl font-extrabold text-red-600">{preview.invalidStudyType}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">stage غير صالح</p>
              <p className="text-2xl font-extrabold text-red-600">{preview.invalidStage}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">مكررات</p>
              <p className="text-2xl font-extrabold text-orange-600">{preview.duplicates}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">حالة الاستيراد</p>
              <p className={`text-lg font-extrabold ${canImport ? "text-green-600" : "text-red-600"}`}>
                {canImport ? "جاهز" : "يوجد أخطاء"}
              </p>
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold text-neutral-900 mb-2">الأخطاء:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {preview.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-red-600">
                    صف {err.row}: {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {preview.sampleStudents.length > 0 && (
            <div>
              <p className="text-sm font-bold text-neutral-900 mb-2">عينة من البيانات (5 طلاب أولين):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-neutral-300">
                  <thead className="bg-neutral-200">
                    <tr>
                      <th className="px-2 py-1 text-right border border-neutral-300">رقم الطالب</th>
                      <th className="px-2 py-1 text-right border border-neutral-300">الاسم</th>
                      <th className="px-2 py-1 text-right border border-neutral-300">نوع الدراسة</th>
                      <th className="px-2 py-1 text-right border border-neutral-300">المرحلة</th>
                      <th className="px-2 py-1 text-right border border-neutral-300">عدد المواد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleStudents.map((student, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1 border border-neutral-300">{student.studentId}</td>
                        <td className="px-2 py-1 border border-neutral-300">{student.fullName}</td>
                        <td className="px-2 py-1 border border-neutral-300">{student.studyType}</td>
                        <td className="px-2 py-1 border border-neutral-300">{student.stage}</td>
                        <td className="px-2 py-1 border border-neutral-300">{student.subjectsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Result Details Table */}
      {importResult && importResult.rowStatuses.length > 0 && (
        <div className="mt-6 p-6 rounded-xl border border-neutral-200 bg-white">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">تفاصيل الاستيراد</h3>
          
          {/* Summary Stats */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-bold text-blue-900 mb-1">معلومات الملف:</p>
            <p className="text-xs text-blue-700">
              Sheet Name: {importResult.sheetName || "N/A"}
            </p>
            <p className="text-xs text-blue-700">
              Header Row: {importResult.headerRowIndex}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">تم التحليل</p>
              <p className="text-xl font-extrabold text-neutral-900">{importResult.parsedRowsCount}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">تمت المحاولة</p>
              <p className="text-xl font-extrabold text-blue-600">{importResult.attempted}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">تم الاستيراد</p>
              <p className="text-xl font-extrabold text-green-600">{importResult.insertedResults + importResult.updatedResults}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase mb-1">تم التخطي</p>
              <p className="text-xl font-extrabold text-red-600">{importResult.skippedRows}</p>
            </div>
          </div>

          {/* Row Status Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-neutral-300">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">#</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">رقم الطالب</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">الاسم</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">نوع الدراسة</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">المرحلة</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">الحالة</th>
                  <th className="px-3 py-2 text-right border border-neutral-300 font-bold">الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {importResult.rowStatuses.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={
                      row.status === "IMPORTED" ? "bg-green-50" :
                      row.status === "ERROR" ? "bg-red-50" :
                      "bg-yellow-50"
                    }
                  >
                    <td className="px-3 py-2 border border-neutral-300">{row.rowIndex}</td>
                    <td className="px-3 py-2 border border-neutral-300 font-mono text-xs">{row.studentId || "—"}</td>
                    <td className="px-3 py-2 border border-neutral-300">{row.fullName || "—"}</td>
                    <td className="px-3 py-2 border border-neutral-300">{row.studyType || "—"}</td>
                    <td className="px-3 py-2 border border-neutral-300">{row.stage || "—"}</td>
                    <td className="px-3 py-2 border border-neutral-300">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        row.status === "IMPORTED" ? "bg-green-100 text-green-800" :
                        row.status === "ERROR" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {row.status === "IMPORTED" ? "✅ مستورد" :
                         row.status === "ERROR" ? "❌ خطأ" :
                         "⚠️ متخطى"}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-neutral-300 text-xs">{row.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Errors List */}
          {importResult.errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-bold text-red-900 mb-2">الأخطاء:</p>
              <ul className="list-disc list-inside space-y-1">
                {importResult.errors.map((err, idx) => (
                  <li key={idx} className="text-xs text-red-700">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
