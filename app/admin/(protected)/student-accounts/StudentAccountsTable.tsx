"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getStudentAccounts, resetPasswordAction, toggleActiveAction, bulkResetPasswords } from "./actions";

type StudentAccount = {
  id: string;
  username: string;
  studentId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  fullName: string;
};

export default function StudentAccountsTable({ selectedBatchId }: { selectedBatchId?: string }) {
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [bulkCredentials, setBulkCredentials] = useState<Array<{ studentId: string; fullName: string; username: string; tempPassword: string }>>([]);

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

  function downloadSingleXLSX(studentId: string, fullName: string, username: string, password: string) {
    downloadXLSX([{ studentId, fullName, username, tempPassword: password }]);
  }

  useEffect(() => {
    loadAccounts();
    
    // Listen for import completion event
    const handleImport = () => {
      console.log("[StudentAccountsTable] Import completed, reloading accounts...");
      loadAccounts();
    };
    
    window.addEventListener('studentAccountsImported', handleImport);
    return () => window.removeEventListener('studentAccountsImported', handleImport);
  }, [selectedBatchId]);

  async function loadAccounts() {
    try {
      setLoading(true);
      const data = await getStudentAccounts(selectedBatchId);
      setAccounts(data as StudentAccount[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(username: string, studentId: string, fullName: string) {
    if (!confirm(`هل أنت متأكد من إعادة تعيين كلمة المرور لـ ${username}؟`)) {
      return;
    }

    try {
      const result = await resetPasswordAction(username);
      if (result.success && result.password) {
        setTempPassword({ ...tempPassword, [username]: result.password });
        await loadAccounts();
      } else {
        alert(result.error || "فشل إعادة تعيين كلمة المرور");
      }
    } catch (err) {
      alert("حدث خطأ أثناء إعادة تعيين كلمة المرور");
    }
  }

  async function handleBulkResetPasswords() {
    if (!confirm(`هل أنت متأكد من إعادة توليد كلمات المرور لجميع حسابات الطلاب؟\n\nسيتم توليد كلمة مرور جديدة لكل حساب.`)) {
      return;
    }

    try {
      const result = await bulkResetPasswords();
      if (result.success && result.credentials) {
        setBulkCredentials(result.credentials);
        await loadAccounts();
      } else {
        alert(result.error || "فشل إعادة تعيين كلمات المرور");
      }
    } catch (err) {
      alert("حدث خطأ أثناء إعادة تعيين كلمات المرور");
    }
  }

  async function handleToggleActive(username: string) {
    try {
      const result = await toggleActiveAction(username);
      if (result.success) {
        await loadAccounts();
      } else {
        alert(result.error || "فشل تغيير حالة الحساب");
      }
    } catch (err) {
      alert("حدث خطأ أثناء تغيير حالة الحساب");
    }
  }

  function copyCredentials(username: string, password: string) {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    setCopied(username);
    setTimeout(() => setCopied(null), 2000);
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "لم يسجل دخول";
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-neutral-500">جاري التحميل...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      {selectedBatchId && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-600">
            ⚠ عرض الحسابات من استيراد محدد فقط
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-neutral-900">قائمة حسابات الطلاب</h2>
        <button
          onClick={handleBulkResetPasswords}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm"
        >
          إعادة توليد كلمات المرور للجميع + تنزيل Excel
        </button>
      </div>

      {bulkCredentials.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="mb-3">
            <h3 className="font-bold text-yellow-900 mb-2">كلمات المرور المولدة للجميع</h3>
            <p className="text-xs text-yellow-700 mb-3">
              ⚠️ سيظهر الملف مرة واحدة فقط بعد التوليد. احتفظ به في مكان آمن.
            </p>
            <button
              onClick={() => downloadXLSX(bulkCredentials)}
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
                {bulkCredentials.map((cred, idx) => (
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
      
      {accounts.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">لا توجد حسابات</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-right p-3 text-sm font-bold text-neutral-700">رقم الطالب</th>
                <th className="text-right p-3 text-sm font-bold text-neutral-700">الاسم الكامل</th>
                <th className="text-right p-3 text-sm font-bold text-neutral-700">اسم المستخدم</th>
                <th className="text-right p-3 text-sm font-bold text-neutral-700">الحالة</th>
                <th className="text-right p-3 text-sm font-bold text-neutral-700">آخر دخول</th>
                <th className="text-right p-3 text-sm font-bold text-neutral-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="p-3 text-sm text-neutral-700">{account.studentId}</td>
                  <td className="p-3 text-sm text-neutral-700">{account.fullName}</td>
                  <td className="p-3 text-sm text-neutral-700">{account.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      account.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {account.isActive ? "نشط" : "معطل"}
                    </span>
                    {account.mustChangePassword && (
                      <span className="mr-2 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        يجب تغيير كلمة المرور
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-neutral-600">{formatDate(account.lastLoginAt)}</td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleResetPassword(account.username, account.studentId, account.fullName)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        إعادة تعيين كلمة المرور
                      </button>
                      <button
                        onClick={() => handleToggleActive(account.username)}
                        className={`px-3 py-1 text-xs rounded ${
                          account.isActive
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {account.isActive ? "تعطيل" : "تفعيل"}
                      </button>
                      {tempPassword[account.username] && (
                        <>
                          <button
                            onClick={() => copyCredentials(account.username, tempPassword[account.username])}
                            className="px-3 py-1 text-xs bg-[#31BD9C] text-white rounded hover:bg-[#2aa88a]"
                          >
                            {copied === account.username ? "تم النسخ!" : "نسخ"}
                          </button>
                          <button
                            onClick={() => downloadSingleXLSX(account.studentId, account.fullName, account.username, tempPassword[account.username])}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            تحميل Excel
                          </button>
                        </>
                      )}
                    </div>
                    {tempPassword[account.username] && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <div className="mb-1">
                          <strong>كلمة المرور المؤقتة:</strong> <span className="font-mono">{tempPassword[account.username]}</span>
                        </div>
                        <p className="text-yellow-700 text-xs">⚠️ سيظهر الملف مرة واحدة فقط. احتفظ به في مكان آمن.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
