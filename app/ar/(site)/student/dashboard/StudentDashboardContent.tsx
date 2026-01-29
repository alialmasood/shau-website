"use client";

import { useState } from "react";
import type { StudentRow } from "@/lib/studentsRepo";
import type { ResultRow } from "@/lib/resultsRepo";
import { calculateGrade } from "@/lib/grades";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeRefresh";

export default function StudentDashboardContent({
  student,
  results,
}: {
  student: StudentRow;
  results: ResultRow[];
}) {
  const [activeTab, setActiveTab] = useState<"results" | "info">("results");
  const [selectedAttempt, setSelectedAttempt] = useState<string>("الدور الأول");

  // Listen for real-time updates - only refresh if event is for this student
  useRealtimeRefresh({
    studentId: student.studentId,
    eventTypes: ["ACCOUNTS_UPDATED"],
  });

  const ATTEMPTS = ["الدور الأول", "الدور الثاني"];

  // Filter results by selected attempt
  const filteredResults = results.filter((result) => result.attempt === selectedAttempt);

  const getDepartmentName = (code: string) => {
    const depts: Record<string, string> = {
      DENTAL_TECH: "تقنيات صناعة الأسنان",
      ANESTHESIA_TECH: "تقنيات التخدير",
      RADIOLOGY_TECH: "تقنيات الأشعة",
    };
    return depts[code] || code;
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Tabs - Mobile: segmented buttons, Desktop: normal tabs */}
      <div className="md:border-b md:border-neutral-200">
        {/* Mobile: Segmented buttons */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <button
            onClick={() => setActiveTab("results")}
            className={`h-11 rounded-2xl font-medium text-sm transition-colors ${
              activeTab === "results"
                ? "bg-[#31BD9C] text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            نتيجتي
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`h-11 rounded-2xl font-medium text-sm transition-colors ${
              activeTab === "info"
                ? "bg-[#31BD9C] text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            بياناتي
          </button>
        </div>
        
        {/* Desktop: Normal tabs */}
        <nav className="hidden md:flex gap-4">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-[#31BD9C] text-[#31BD9C]"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            نتيجتي
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? "border-[#31BD9C] text-[#31BD9C]"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            بياناتي
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "results" && (
        <div>
          {!student.financialClearance ? (
            <div className="rounded-2xl shadow-sm border border-orange-200 bg-white p-6 md:p-8 text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-orange-900 mb-2">الحساب المالي غير مسدد</h2>
              <p className="text-sm md:text-base text-orange-700 mb-4">
                عذراً، لا يمكنك عرض النتائج لأن الحساب المالي غير مسدد. يرجى زيارة قسم الحسابات لتسديد الرسوم.
              </p>
              <a
                href="/ar/student-portal/logout"
                className="inline-block px-6 py-2.5 h-11 md:h-auto rounded-lg bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a]"
              >
                تسجيل الخروج
              </a>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl shadow-sm border border-neutral-200 bg-white p-6 md:p-8 text-center">
              <p className="text-sm md:text-base text-neutral-500">لا توجد نتائج متاحة حالياً</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-6">
              {/* Actions Card - Sticky on mobile */}
              {filteredResults.length > 0 && (
                <div className="sticky top-2 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-2xl p-3 shadow-sm md:static md:bg-transparent md:backdrop-blur-0 md:border-0 md:shadow-none md:p-0 md:rounded-none">
                  <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-2">اختر الدور:</label>
                      <select
                        value={selectedAttempt}
                        onChange={(e) => setSelectedAttempt(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                      >
                        {ATTEMPTS.map((attempt) => (
                          <option key={attempt} value={attempt}>
                            {attempt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                      <button
                        onClick={() => {
                          const attemptNumber = selectedAttempt === "الدور الثاني" ? "2" : "1";
                          window.open(`/api/student/results/pdf?attempt=${attemptNumber}`, "_blank");
                        }}
                        className="h-11 px-4 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">تصدير PDF</span>
                        <span className="sm:hidden">PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          const attemptNumber = selectedAttempt === "الدور الثاني" ? "2" : "1";
                          const baseUrl = window.location.origin;
                          const pdfUrl = `${baseUrl}/api/student/results/pdf?attempt=${attemptNumber}`;
                          const message = encodeURIComponent(
                            `نتيجتي الدراسية - ${selectedAttempt}\n\n` +
                            `الاسم: ${student.fullName}\n` +
                            `الرقم الجامعي: ${student.studentId}\n` +
                            `القسم: ${getDepartmentName(student.departmentCode)}\n` +
                            `المرحلة: ${student.stage}\n` +
                            `نوع الدراسة: ${student.studyType}\n\n` +
                            `رابط تحميل النتيجة:\n${pdfUrl}`
                          );
                          const whatsappUrl = `https://wa.me/?text=${message}`;
                          window.open(whatsappUrl, "_blank");
                        }}
                        className="h-11 px-4 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20ba5a] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="hidden sm:inline">إرسال النتيجة واتساب</span>
                        <span className="sm:hidden">إرسال واتساب</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results for selected attempt */}
              {filteredResults.length === 0 ? (
                <div className="rounded-2xl shadow-sm border border-neutral-200 bg-white p-6 md:p-8 text-center">
                  <p className="text-sm md:text-base text-neutral-500">لا توجد نتيجة لهذا الدور بعد</p>
                </div>
              ) : (
                filteredResults.map((result) => {
                  // Extract summary values for type safety
                  const summary = result.summaryJson && typeof result.summaryJson === "object" 
                    ? result.summaryJson as Record<string, unknown>
                    : null;
                  const finalStatus = summary?.finalStatus ? String(summary.finalStatus) : null;
                  const evaluation = summary?.evaluation ? String(summary.evaluation) : null;

                  return (
                  <div key={result.id} className="rounded-2xl shadow-sm border border-neutral-200 bg-white p-4 md:p-6">
                    {/* Header */}
                    <div className="mb-3 md:mb-6 pb-3 md:pb-4 border-b border-neutral-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                        <div>
                          <span className="text-xs text-gray-500">الكلية:</span>
                          <p className="text-sm font-medium text-neutral-900">كلية التقنيات الصحية والطبية</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">القسم:</span>
                          <p className="text-sm font-medium text-neutral-900">{getDepartmentName(student.departmentCode)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">السنة الأكاديمية:</span>
                          <p className="text-sm font-medium text-neutral-900">{result.academicYear}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">الفصل والمرحلة:</span>
                          <p className="text-sm font-medium text-neutral-900">{result.semester} - {result.stage}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">نوع الدراسة والدور:</span>
                          <p className="text-sm font-medium text-neutral-900">{result.studyType} - {result.attempt}</p>
                        </div>
                      </div>
                    </div>

                {/* Subjects - Mobile: Cards, Desktop: Table */}
                {result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0 && (
                  <div className="mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-3 md:mb-4">المواد الدراسية</h3>
                    
                        {/* Mobile: Subject Cards */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {result.subjectsJson.map((subject: any, idx: number) => {
                        // Always calculate grade from score (don't trust stored grade)
                        const scoreNum = typeof subject.score === "number" 
                          ? subject.score 
                          : Number(subject.score) || 0;
                        const calculatedGrade = calculateGrade(scoreNum);
                        
                        return (
                          <div key={idx} className="rounded-2xl border border-neutral-200 shadow-sm bg-white p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#31BD9C] text-white text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-sm leading-6 font-medium text-neutral-900 flex-1 line-clamp-2">{subject.name || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {calculatedGrade && (
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                  {calculatedGrade}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Desktop: Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="p-3 text-right text-sm font-bold text-neutral-700">#</th>
                            <th className="p-3 text-right text-sm font-bold text-neutral-700">اسم المادة</th>
                            <th className="p-3 text-right text-sm font-bold text-neutral-700">التقدير</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.subjectsJson.map((subject: any, idx: number) => {
                            // Always calculate grade from score (don't trust stored grade)
                            const scoreNum = typeof subject.score === "number" 
                              ? subject.score 
                              : Number(subject.score) || 0;
                            const calculatedGrade = calculateGrade(scoreNum);
                            
                            return (
                              <tr key={idx} className="border-b border-neutral-100">
                                <td className="p-3 text-sm text-neutral-700">{idx + 1}</td>
                                <td className="p-3 text-sm text-neutral-900">{subject.name || "-"}</td>
                                <td className="p-3 text-sm text-neutral-700">{calculatedGrade || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                    {/* Summary Footer - Only finalStatus and evaluation, NO total/avg */}
                    {(finalStatus || evaluation) && (
                      <div className="pt-3 md:pt-4 border-t border-neutral-200">
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          {finalStatus && (
                            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-[#31BD9C]/10 to-white p-3">
                              <span className="text-xs text-gray-500">النتيجة النهائية:</span>
                              <p className="text-base font-bold text-[#31BD9C] mt-1">{finalStatus}</p>
                            </div>
                          )}
                          {evaluation && (
                            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-white p-3">
                              <span className="text-xs text-gray-500">التقييم:</span>
                              <p className="text-base font-bold text-neutral-900 mt-1">{evaluation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "info" && (
        <div className="rounded-2xl shadow-sm border border-neutral-200 bg-white p-4 md:p-6">
          <h2 className="text-base md:text-xl font-bold text-neutral-900 mb-4 md:mb-6">البيانات الشخصية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            <div>
              <span className="text-xs text-gray-500">رقم الطالب:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.studentId}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">الاسم الكامل:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.fullName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">القسم:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{getDepartmentName(student.departmentCode)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">المرحلة:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.stage}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">نوع الدراسة:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.studyType}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">السنة الأكاديمية:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.academicYear}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">الفصل:</span>
              <p className="text-sm md:text-base font-medium text-neutral-900 mt-1">{student.semester}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">الحساب المالي:</span>
              <p className={`text-sm md:text-base font-medium mt-1 ${student.financialClearance ? "text-green-600" : "text-red-600"}`}>
                {student.financialClearance ? "مسدد" : "غير مسدد"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
