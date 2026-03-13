import crypto from "crypto";
import { getResultById } from "@/lib/resultsRepo";
import { getStudentById } from "@/lib/studentsRepo";
import { getFinalEvaluationAndResult, calculateGrade } from "@/lib/grades";

/**
 * 🔐 QR CODE VERIFICATION - التحقق من التوقيع الرقمي
 * 
 * هذه الدالة تتحقق من صحة التوقيع الرقمي للنتيجة
 * باستخدام HMAC-SHA256 مع مفتاح سري محفوظ في متغيرات البيئة
 * 
 * @param rid Result ID (معرف النتيجة)
 * @param sid Student ID (معرف الطالب)
 * @param sig Signature (التوقيع الرقمي)
 * @returns true إذا كان التوقيع صحيح، false إذا كان غير صحيح
 */
function verifySig(rid: string, sid: string, sig: string) {
  const secret = process.env.RESULT_QR_SECRET;
  if (!secret || secret === "YOUR_STRONG_RANDOM_SECRET_HERE") {
    // Fallback for development/testing
    const fallbackSecret = process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "fallback-secret";
    const payload = `${rid}:${sid}`;
    const expected = crypto.createHmac("sha256", fallbackSecret).update(payload).digest("hex");
    return expected === sig;
  }
  const payload = `${rid}:${sid}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === sig;
}

function getDepartmentName(code: string): string {
  const depts: Record<string, string> = {
    DENTAL_TECH: "تقنيات صناعة الأسنان",
    ANESTHESIA_TECH: "تقنيات التخدير",
    RADIOLOGY_TECH: "تقنيات الأشعة",
    OPTICS_TECH: "تقنيات البصريات",
    EMERGENCY_MED_TECH: "تقنيات طب الطوارئ والاسعافات الاولية",
    COMMUNITY_HEALTH: "تقنيات صحة المجتمع",
    PHYSIOTHERAPY_TECH: "تقنيات العلاج الطبيعي",
    HEALTH_PHYSICS_ENG: "هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي",
    OIL_GAS_ENG: "هندسة تقنيات النفط والغاز",
    CYBERSEC_CLOUD_ENG: "هندسة تقنيات الامن السيبراني والحوسبة السحابية",
    CIVIL_CONSTRUCTION_ENG: "هندسة تقنيات البناء والانشاءات",
  };
  return depts[code] || code;
}

/**
 * 🔒 FINAL ACADEMIC LOCK - صفحة التحقق من النتيجة
 * 
 * هذه الصفحة تعرض بيانات النتيجة الرسمية بعد التحقق من التوقيع الرقمي
 * 
 * متطلبات الصفحة:
 * 1. التحقق من التوقيع الرقمي (HMAC-SHA256)
 * 2. جلب بيانات النتيجة من قاعدة البيانات باستخدام result_id
 * 3. عرض بيانات الطالب والنتيجة (اسم الطالب، القسم، السنة الدراسية، المعدل، التقييم، النتيجة النهائية)
 * 4. عرض جدول المواد مع التقدير المحسوب
 * 5. رسالة تأكيد رسمية: "هذه نتيجة صادرة من كلية الشرق للعلوم التقنية الطبية"
 * 
 * ⚠️ جميع القيم المعروضة محسوبة داخل النظام (وليس من Excel)
 */
export default async function VerifyResultPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ rid?: string; sid?: string; sig?: string }> 
}) {
  const params = await searchParams;
  const rid = String(params?.rid ?? "");
  const sid = String(params?.sid ?? "");
  const sig = String(params?.sig ?? "");
  
  // ============================================================
  // 🔐 STEP 1: Verify signature (التحقق من التوقيع الرقمي)
  // ============================================================
  // Verify signature using HMAC-SHA256
  // This ensures the QR code link has not been tampered with
  const isValidSignature = rid && sid && sig ? verifySig(rid, sid, sig) : false;
  
  // ============================================================
  // 🔒 STEP 2: Fetch result and student data (جلب بيانات النتيجة)
  // ============================================================
  // If signature is valid, fetch result and student data
  // All values will be calculated from system data (not from Excel)
  let result = null;
  let student = null;
  let evaluation: string | null = null;
  let finalStatus: string | null = null;
  let avg: number | string | null = null;
  
  if (isValidSignature && rid) {
    try {
      // Get result by ID (official result record ID from database)
      // This is the primary identifier linked to the QR code
      result = await getResultById(rid);
      
      // If result found, get student data
      if (result) {
        student = await getStudentById(result.studentId);
        
        // Calculate evaluation and finalStatus using ministerial logic
        // IMPORTANT: These are calculated values, NOT read from Excel
        // - Evaluation is calculated from average ONLY
        // - FinalStatus is calculated from MIN of subject scores ONLY
        const summary = result.summaryJson && typeof result.summaryJson === "object" 
          ? result.summaryJson as Record<string, unknown>
          : null;
        
        const calculated = getFinalEvaluationAndResult(
          summary,
          result.subjectsJson as Array<{ score?: number | string | null }> | undefined
        );
        
        evaluation = calculated.evaluation;
        finalStatus = calculated.finalStatus;
        const rawAvg = summary?.avg ?? summary?.average ?? null;
        avg = rawAvg != null ? (rawAvg as number | string) : null;
      }
    } catch (error) {
      console.error("Error fetching result data:", error);
      // Continue with verification status only
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">التحقق من النتيجة</h1>
        
        {/* Verification Status */}
        <div className="mb-6 p-4 rounded-xl border-2" style={{
          borderColor: isValidSignature ? "#10b981" : "#ef4444",
          backgroundColor: isValidSignature ? "#f0fdf4" : "#fef2f2"
        }}>
          {isValidSignature ? (
            <div className="text-center">
              <p className="text-lg font-bold text-green-700 mb-2">
                ✅ هذه النتيجة صادرة من نظام كلية الشرق للعلوم التقنية الطبية وموقعة رقمياً
              </p>
              <p className="text-sm text-green-600">
                تم التحقق من صحة التوقيع الرقمي للوثيقة
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-bold text-red-700 mb-2">
                ❌ رابط التحقق غير صحيح أو تم العبث به
              </p>
              <p className="text-sm text-red-600">
                لا يمكن التحقق من صحة هذه الوثيقة
              </p>
            </div>
          )}
        </div>

        {/* Result Details (only if signature is valid and data is available) */}
        {isValidSignature && result && student && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">بيانات النتيجة</h2>
            
            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">اسم الطالب:</span>
                <p className="font-bold text-lg">{student.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">القسم:</span>
                <p className="font-bold">{getDepartmentName(student.departmentCode)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">السنة الدراسية:</span>
                <p className="font-bold">{result.academicYear}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">الفصل الدراسي:</span>
                <p className="font-bold">{result.semester}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">المرحلة:</span>
                <p className="font-bold">{result.stage}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">نوع الدراسة:</span>
                <p className="font-bold">{result.studyType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">الدور:</span>
                <p className="font-bold">{result.attempt}</p>
              </div>
            </div>

            {/* Summary Results */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold mb-3">ملخص النتيجة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation && (
                  <div>
                    <span className="text-sm text-gray-500">التقييم:</span>
                    <p className="font-bold text-lg text-blue-700">{evaluation}</p>
                  </div>
                )}
                {finalStatus && (
                  <div>
                    <span className="text-sm text-gray-500">النتيجة النهائية:</span>
                    <p className={`font-bold text-lg ${
                      finalStatus === "ناجح" ? "text-green-700" : "text-orange-700"
                    }`}>
                      {finalStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subjects Table */}
            {result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0 && (() => {
              // Filter out "عدد الوحدات" (units) and subjects with empty scores
              // إظهار المواد التي لها درجة فقط (0 فأعلى) — إخفاء المواد ذات القيمة الفارغة
              const hasValidScore = (s: unknown): boolean => {
                if (s === null || s === undefined) return false;
                const str = String(s).trim();
                if (str === "") return false;
                const num = typeof s === "number" ? s : Number(s);
                return !isNaN(num) && num >= 0;
              };
              const actualSubjects = result.subjectsJson.filter((subject: any) => {
                const subjectName = String(subject.name || "").trim().toLowerCase();
                if (subjectName.includes("وحدات") || subjectName.includes("units") || 
                    subjectName === "عدد الوحدات" || subjectName === "units") return false;
                return hasValidScore(subject.score);
              });
              
              return actualSubjects.length > 0 ? (
                <div className="mt-6">
                  <h3 className="font-bold mb-3">جدول المواد</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-right">ت</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">اسم المادة</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">التقدير</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actualSubjects.map((subject: any, idx: number) => {
                          const scoreNum = typeof subject.score === "number" 
                            ? subject.score 
                            : Number(subject.score) || 0;
                          const calculatedGrade = calculateGrade(scoreNum);
                          
                          return (
                            <tr key={idx}>
                              <td className="border border-gray-300 px-4 py-2 text-center">{idx + 1}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right">{subject.name || "-"}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-bold">{calculatedGrade}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Official Message - Final Academic Lock Confirmation */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                <strong>هذه نتيجة صادرة إلكترونياً من نظام كلية الشرق للعلوم التقنية الطبية</strong>
                <br />
                تم التحقق من صحة التوقيع الرقمي والتأكد من عدم التلاعب بالبيانات
                <br />
                <span className="text-xs mt-2 block">
                  🔒 جميع القيم المعروضة محسوبة داخل النظام وموثقة رقمياً (Final Academic Lock)
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Debug Info (only if signature invalid or data unavailable) */}
        {(!isValidSignature || !result) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p><strong>Result ID:</strong> {rid || "—"}</p>
            <p><strong>Student ID:</strong> {sid || "—"}</p>
            {!isValidSignature && (
              <p className="text-red-600 mt-2">
                ⚠️ التوقيع الرقمي غير صحيح. يرجى التأكد من أن رابط التحقق لم يتم تعديله.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
