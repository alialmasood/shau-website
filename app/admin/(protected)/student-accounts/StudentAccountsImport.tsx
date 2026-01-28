"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { importStudentAccounts } from "./actions";

export default function StudentAccountsImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Array<{ studentId: string; username: string; password: string }>>([]);
  const [generatedCredentials, setGeneratedCredentials] = useState<Array<{ studentId: string; fullName: string; username: string; tempPassword: string }>>([]);
  const [showCredentials, setShowCredentials] = useState(false);

  function downloadXLSX(data: Array<{ studentId: string; fullName: string; username: string; tempPassword: string }>) {
    // Prepare data array with headers
    const worksheetData = data.map((row) => ({
      student_id: row.studentId,
      full_name: row.fullName,
      username: row.username,
      password: row.tempPassword,
    }));

    // Create worksheet from array of objects
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Credentials");

    // Write workbook as array buffer
    const arrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    // Convert array buffer to blob and download
    const blob = new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student-credentials.xlsx`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) {
      setError("الرجاء اختيار ملف Excel");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCredentials([]);
    setShowCredentials(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);

      const result = await importStudentAccounts(base64);

      if (result.success) {
        setSuccess(`تم الاستيراد بنجاح: ${result.imported} جديد، ${result.updated} محدث`);
        if (result.credentials.length > 0) {
          setCredentials(result.credentials);
          setShowCredentials(true);
        }
        if (result.generatedCredentials && result.generatedCredentials.length > 0) {
          setGeneratedCredentials(result.generatedCredentials);
        }
        if (result.errors.length > 0) {
          setError(`تحذير: ${result.errors.length} خطأ`);
        }
        
        // Refresh the page to reload accounts list
        router.refresh();
        
        // Also trigger a custom event that the table can listen to
        window.dispatchEvent(new CustomEvent('studentAccountsImported'));
      } else {
        setError(result.error || "فشل الاستيراد");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاستيراد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-neutral-900">استيراد حسابات الطلاب</h2>
      
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
          يجب أن يحتوي الملف على الأعمدة التالية: student_id (مطلوب), full_name (مطلوب), username (اختياري), password (اختياري)
        </p>
      </div>

      <button
        onClick={handleImport}
        disabled={loading || !file}
        className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "جاري الاستيراد..." : "استيراد"}
      </button>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
          <p className="font-bold">خطأ</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-300 text-green-800">
          <p className="font-bold">نجح</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {showCredentials && credentials.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-blue-900">بيانات الدخول:</h3>
            <button
              onClick={() => {
                const text = credentials.map(c => `${c.studentId},${c.username},${c.password}`).join('\n');
                const header = "student_id,username,password\n";
                navigator.clipboard.writeText(header + text);
                alert("تم نسخ البيانات إلى الحافظة");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              نسخ الكل
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 text-right">رقم الطالب</th>
                  <th className="p-2 text-right">اسم المستخدم</th>
                  <th className="p-2 text-right">كلمة المرور</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred, idx) => (
                  <tr key={idx} className="border-b border-blue-200">
                    <td className="p-2">{cred.studentId}</td>
                    <td className="p-2">{cred.username}</td>
                    <td className="p-2 font-mono">{cred.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {generatedCredentials.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="mb-3">
            <h3 className="font-bold text-yellow-900 mb-2">كلمات المرور المولدة تلقائياً</h3>
            <p className="text-xs text-yellow-700 mb-3">
              ⚠️ سيظهر الملف مرة واحدة فقط بعد التوليد. احتفظ به في مكان آمن.
            </p>
            <button
              onClick={() => downloadXLSX(generatedCredentials)}
              className="px-4 py-2 bg-[#31BD9C] text-white rounded-lg hover:bg-[#2aa88a] font-medium"
            >
              تحميل ملف بيانات الدخول (Excel)
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="p-2 text-right">رقم الطالب</th>
                  <th className="p-2 text-right">الاسم الكامل</th>
                  <th className="p-2 text-right">اسم المستخدم</th>
                  <th className="p-2 text-right">كلمة المرور</th>
                </tr>
              </thead>
              <tbody>
                {generatedCredentials.map((cred, idx) => (
                  <tr key={idx} className="border-b border-yellow-200">
                    <td className="p-2">{cred.studentId}</td>
                    <td className="p-2">{cred.fullName}</td>
                    <td className="p-2">{cred.username}</td>
                    <td className="p-2 font-mono">{cred.tempPassword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
