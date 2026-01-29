import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResults } from "@/lib/resultsRepo";
import { getFinalEvaluationAndResult, calculateFinalEvaluation } from "@/lib/grades";

export const dynamic = 'force-dynamic';

export default async function CheckStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const params = await searchParams;
  const studentId = params.studentId || "An26001";

  const student = await getStudentById(studentId);
  if (!student) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">التحقق من بيانات الطالب</h1>
        <p className="text-red-600">الطالب غير موجود: {studentId}</p>
      </div>
    );
  }

  // Get results
  const ACADEMIC_YEAR = "2025-2026";
  const SEMESTER = "الفصل الأول";
  const results = await getStudentResults(
    studentId,
    ACADEMIC_YEAR,
    SEMESTER,
    student.stage,
    student.studyType
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">التحقق من بيانات الطالب</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">معلومات الطالب</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">الرقم الجامعي:</span>
            <p className="font-bold">{student.studentId}</p>
          </div>
          <div>
            <span className="text-gray-600">الاسم:</span>
            <p className="font-bold">{student.fullName}</p>
          </div>
          <div>
            <span className="text-gray-600">القسم:</span>
            <p className="font-bold">{student.departmentCode}</p>
          </div>
          <div>
            <span className="text-gray-600">المرحلة:</span>
            <p className="font-bold">{student.stage}</p>
          </div>
          <div>
            <span className="text-gray-600">نوع الدراسة:</span>
            <p className="font-bold">{student.studyType}</p>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">لا توجد نتائج لهذا الطالب</p>
        </div>
      ) : (
        results.map((result) => {
          const summary = result.summaryJson && typeof result.summaryJson === "object" 
            ? result.summaryJson as Record<string, unknown>
            : null;
          
          const avg = summary?.avg ?? summary?.average;
          const storedEvaluation = summary?.evaluation != null ? String(summary.evaluation) : null;
          
          // Calculate evaluation from average (avg may be unknown from Record<string, unknown>)
          const calculatedEvaluation = avg !== undefined && avg !== null && avg !== ""
            ? calculateFinalEvaluation(avg as number | string)
            : null;
          
          // Get final evaluation and result using ministerial logic
          const { evaluation, finalStatus, finalNumeric } = getFinalEvaluationAndResult(
            summary,
            result.subjectsJson as Array<{ score?: number | string | null }> | undefined
          );

          return (
            <div key={result.id} className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">النتيجة - {result.attempt}</h2>
              
              <div className="space-y-4">
                {(() => {
                  // Calculate total sum from subjects (score × units)
                  const actualSubjects = Array.isArray(result.subjectsJson) 
                    ? result.subjectsJson.filter((subject: any) => {
                        const subjectName = String(subject.name || "").trim().toLowerCase();
                        return !subjectName.includes("وحدات") && 
                               !subjectName.includes("units") && 
                               subjectName !== "عدد الوحدات" &&
                               subjectName !== "units";
                      })
                    : [];
                  
                  let calculatedTotal = 0;
                  let calculatedTotalUnits = 0;
                  const subjectContributions: Array<{ name: string; score: number; units: number; contribution: number }> = [];
                  
                  for (const subject of actualSubjects) {
                    const scoreNum = typeof subject.score === "number" 
                      ? subject.score 
                      : Number(subject.score) || 0;
                    const unitsNum = typeof subject.units === "number" 
                      ? subject.units 
                      : Number(subject.units) || 0;
                    
                    // Include ALL subjects in calculation, even if units = 0
                    // This matches the ministerial logic: sum(score × units) for all subjects
                    const contribution = scoreNum * unitsNum;
                    calculatedTotal += contribution;
                    calculatedTotalUnits += unitsNum;
                    
                    subjectContributions.push({
                      name: (subject.name != null ? String(subject.name) : "").trim() || "-",
                      score: scoreNum,
                      units: unitsNum,
                      contribution
                    });
                  }
                  
                  const storedTotal = summary?.total !== undefined ? Number(summary.total) : null;
                  const totalMatch = storedTotal !== null && Math.abs(storedTotal - calculatedTotal) < 0.01;
                  
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded">
                          <span className="text-gray-600 block mb-2">المعدل (من قاعدة البيانات):</span>
                          <p className="text-2xl font-bold">{avg !== undefined && avg !== null ? String(avg) : "غير موجود"}</p>
                        </div>
                        
                        <div className={`p-4 rounded ${totalMatch ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <span className="text-gray-600 block mb-2">المجموع الكلي (محفوظ):</span>
                          <p className="text-2xl font-bold">{storedTotal !== null ? String(storedTotal) : "غير موجود"}</p>
                        </div>
                        
                        <div className={`p-4 rounded ${totalMatch ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <span className="text-gray-600 block mb-2">المجموع الكلي (محسوب):</span>
                          <p className="text-2xl font-bold">{calculatedTotal}</p>
                          <p className="text-xs text-gray-500 mt-1">sum(درجة × وحدات) لكل مادة</p>
                        </div>
                      </div>
                      
                      {!totalMatch && (
                        <div className="mt-4 bg-red-100 border border-red-300 rounded p-4">
                          <p className="text-red-800 font-bold">⚠️ تحذير: المجموع الكلي المحفوظ لا يطابق المجموع المحسوب!</p>
                          <p className="text-red-700 mt-2">
                            المجموع المحفوظ: {storedTotal !== null ? String(storedTotal) : "غير موجود"} | 
                            المجموع المحسوب: {calculatedTotal}
                          </p>
                          <p className="text-red-700 mt-2">
                            الفرق: {storedTotal !== null ? Math.abs(storedTotal - calculatedTotal) : "غير محدد"}
                          </p>
                        </div>
                      )}
                      
                      {totalMatch && storedTotal !== null && (
                        <div className="mt-4 bg-green-100 border border-green-300 rounded p-4">
                          <p className="text-green-800 font-bold">✅ المجموع الكلي صحيح: المجموع المحفوظ يطابق المجموع المحسوب ({calculatedTotal})</p>
                        </div>
                      )}
                      
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
                        <p className="text-blue-800 font-bold mb-2">تفاصيل الحساب:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <span className="text-blue-600 text-xs block">مجموع الوحدات (محسوب):</span>
                            <p className="text-blue-800 font-bold text-lg">{calculatedTotalUnits}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 text-xs block">المجموع الكلي (محسوب):</span>
                            <p className="text-blue-800 font-bold text-lg">{calculatedTotal}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 text-xs block">عدد المواد:</span>
                            <p className="text-blue-800 font-bold text-lg">{actualSubjects.length}</p>
                          </div>
                          <div>
                            <span className="text-blue-600 text-xs block">المعدل (محسوب):</span>
                            <p className="text-blue-800 font-bold text-lg">
                              {calculatedTotalUnits > 0 
                                ? (Math.round((calculatedTotal / calculatedTotalUnits) * 100) / 100).toFixed(2)
                                : "غير محسوب"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Display units from Excel */}
                      <div className="mt-4 bg-purple-50 border border-purple-200 rounded p-4">
                        <p className="text-purple-800 font-bold mb-3">عدد الوحدات المستوردة من Excel:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-purple-600 text-sm block mb-1">تفاصيل الوحدات لكل مادة:</span>
                            <div className="bg-white rounded p-3 max-h-60 overflow-y-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-right py-1 px-2">اسم المادة</th>
                                    <th className="text-center py-1 px-2">عدد الوحدات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {actualSubjects.map((subject: any, idx: number) => {
                                    const unitsNum = typeof subject.units === "number" 
                                      ? subject.units 
                                      : Number(subject.units) || 0;
                                    return (
                                      <tr key={idx} className={unitsNum === 0 ? "bg-yellow-50" : ""}>
                                        <td className="text-right py-1 px-2 text-xs">{subject.name || "-"}</td>
                                        <td className={`text-center py-1 px-2 font-bold ${unitsNum === 0 ? "text-red-600" : ""}`}>
                                          {unitsNum === 0 ? "⚠️ 0" : unitsNum}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t font-bold bg-purple-100">
                                    <td className="text-right py-1 px-2">المجموع:</td>
                                    <td className="text-center py-1 px-2">{calculatedTotalUnits}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                          <div>
                            <span className="text-purple-600 text-sm block mb-1">ملخص الوحدات:</span>
                            <div className="bg-white rounded p-3 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">إجمالي عدد الوحدات:</span>
                                <span className="font-bold text-lg">{calculatedTotalUnits}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">عدد المواد:</span>
                                <span className="font-bold">{actualSubjects.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">متوسط الوحدات لكل مادة:</span>
                                <span className="font-bold">
                                  {actualSubjects.length > 0 
                                    ? (calculatedTotalUnits / actualSubjects.length).toFixed(2)
                                    : "0"}
                                </span>
                              </div>
                              <div className="pt-2 border-t">
                                <span className="text-gray-600 text-xs block mb-1">المواد بدون وحدات:</span>
                                <span className="text-red-600 font-bold">
                                  {actualSubjects.filter((s: any) => {
                                    const unitsNum = typeof s.units === "number" 
                                      ? s.units 
                                      : Number(s.units) || 0;
                                    return unitsNum === 0;
                                  }).length} مادة
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">التحقق من التقييم:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded ${storedEvaluation === calculatedEvaluation ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <span className="text-gray-600 block mb-2">التقييم المحفوظ:</span>
                      <p className="text-xl font-bold">{storedEvaluation || "غير موجود"}</p>
                    </div>
                    
                    <div className={`p-4 rounded ${storedEvaluation === calculatedEvaluation ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <span className="text-gray-600 block mb-2">التقييم المحسوب من المعدل:</span>
                      <p className="text-xl font-bold">{calculatedEvaluation || "لا يمكن الحساب"}</p>
                    </div>
                  </div>
                  
                  {storedEvaluation !== calculatedEvaluation && (
                    <div className="mt-4 bg-red-100 border border-red-300 rounded p-4">
                      <p className="text-red-800 font-bold">⚠️ تحذير: التقييم المحفوظ لا يطابق التقييم المحسوب من المعدل!</p>
                      <p className="text-red-700 mt-2">
                        التقييم المحفوظ: {storedEvaluation || "غير موجود"} | 
                        التقييم المحسوب: {calculatedEvaluation || "لا يمكن الحساب"}
                      </p>
                      <p className="text-red-700 mt-2">
                        المعدل المستخدم: {avg !== undefined && avg !== null ? String(avg) : "غير موجود"}
                      </p>
                    </div>
                  )}
                  
                  {storedEvaluation === calculatedEvaluation && (
                    <div className="mt-4 bg-green-100 border border-green-300 rounded p-4">
                      <p className="text-green-800 font-bold">✅ التقييم صحيح: التقييم المحفوظ يطابق التقييم المحسوب من المعدل</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">النتيجة النهائية:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <span className="text-gray-600 block mb-2">النتيجة النهائية:</span>
                      <p className="text-xl font-bold">{finalStatus || "غير موجود"}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded">
                      <span className="text-gray-600 block mb-2">أدنى درجة (MIN):</span>
                      <p className="text-xl font-bold">{finalNumeric !== null ? String(finalNumeric) : "غير موجود"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">المواد الدراسية:</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2">اسم المادة</th>
                          <th className="border border-gray-300 px-4 py-2">الدرجة</th>
                          <th className="border border-gray-300 px-4 py-2">عدد الوحدات</th>
                          <th className="border border-gray-300 px-4 py-2">التقدير</th>
                          <th className="border border-gray-300 px-4 py-2">المساهمة (درجة × وحدات)</th>
                          <th className="border border-gray-300 px-4 py-2">المجموع التراكمي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const actualSubjects = Array.isArray(result.subjectsJson) 
                            ? result.subjectsJson.filter((subject: any) => {
                                const subjectName = String(subject.name || "").trim().toLowerCase();
                                return !subjectName.includes("وحدات") && 
                                       !subjectName.includes("units") && 
                                       subjectName !== "عدد الوحدات" &&
                                       subjectName !== "units";
                              })
                            : [];
                          
                          let runningTotal = 0;
                          
                          return actualSubjects.map((subject: any, idx: number) => {
                            const scoreNum = typeof subject.score === "number" 
                              ? subject.score 
                              : Number(subject.score) || 0;
                            const unitsNum = typeof subject.units === "number" 
                              ? subject.units 
                              : Number(subject.units) || 0;
                            const contribution = scoreNum * unitsNum;
                            runningTotal += contribution;
                            
                            return (
                              <tr key={idx} className={unitsNum === 0 ? "bg-yellow-50" : ""}>
                                <td className="border border-gray-300 px-4 py-2">{subject.name || "-"}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{scoreNum}</td>
                                <td className={`border border-gray-300 px-4 py-2 text-center ${unitsNum === 0 ? "text-red-600 font-bold" : ""}`}>
                                  {unitsNum === 0 ? "⚠️ 0" : unitsNum}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{subject.grade || "-"}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center font-bold">{contribution}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600">
                                  المجموع حتى الآن: {runningTotal}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan={4} className="border border-gray-300 px-4 py-2 text-right">المجموع الكلي:</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {(() => {
                              const actualSubjects = Array.isArray(result.subjectsJson) 
                                ? result.subjectsJson.filter((subject: any) => {
                                    const subjectName = String(subject.name || "").trim().toLowerCase();
                                    return !subjectName.includes("وحدات") && 
                                           !subjectName.includes("units") && 
                                           subjectName !== "عدد الوحدات" &&
                                           subjectName !== "units";
                                  })
                                : [];
                              
                              let total = 0;
                              for (const subject of actualSubjects) {
                                const scoreNum = typeof subject.score === "number" 
                                  ? subject.score 
                                  : Number(subject.score) || 0;
                                const unitsNum = typeof subject.units === "number" 
                                  ? subject.units 
                                  : Number(subject.units) || 0;
                                total += scoreNum * unitsNum;
                              }
                              return total;
                            })()}
                          </td>
                          <td className="border border-gray-300 px-4 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
