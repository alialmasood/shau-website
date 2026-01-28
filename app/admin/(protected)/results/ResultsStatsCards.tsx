"use client";

import { ResultsStats } from "@/lib/resultsRepo";

export default function ResultsStatsCards({ stats }: { stats: ResultsStats }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Uploads */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 uppercase mb-1">إجمالي الرفعات</p>
            <p className="text-3xl font-extrabold text-blue-900">{stats.totalUploads}</p>
          </div>
          <div className="text-blue-500 text-4xl">📤</div>
        </div>
      </div>

      {/* Uploaded Departments */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600 uppercase mb-1">الأقسام المرفوعة</p>
            <p className="text-3xl font-extrabold text-green-900">{stats.uploadedDepartments}</p>
          </div>
          <div className="text-green-500 text-4xl">🏢</div>
        </div>
      </div>

      {/* Total Imported Students */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600 uppercase mb-1">إجمالي الطلاب المستوردين</p>
            <p className="text-3xl font-extrabold text-purple-900">{stats.totalImportedStudents}</p>
          </div>
          <div className="text-purple-500 text-4xl">👥</div>
        </div>
      </div>

      {/* Last Upload */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-600 uppercase mb-1">آخر رفع</p>
            {stats.lastUpload ? (
              <>
                <p className="text-lg font-bold text-orange-900 truncate" title={stats.lastUpload.fileName}>
                  {stats.lastUpload.fileName}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {formatDate(stats.lastUpload.createdAt)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {stats.lastUpload.importedCount} طالب مستورد
                </p>
              </>
            ) : (
              <p className="text-sm text-orange-600">لا توجد رفعات</p>
            )}
          </div>
          <div className="text-orange-500 text-4xl">🕐</div>
        </div>
      </div>
    </div>
  );
}
