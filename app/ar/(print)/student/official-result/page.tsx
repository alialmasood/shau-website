import { redirect } from "next/navigation";
import Image from "next/image";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResultsSecure } from "@/lib/resultsRepo";
import { calculateGrade, getFinalEvaluationAndResult } from "@/lib/grades";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

function getDepartmentName(code: string): string {
  const depts: Record<string, string> = {
    DENTAL_TECH: "تقنيات صناعة الأسنان",
    ANESTHESIA_TECH: "تقنيات التخدير",
    RADIOLOGY_TECH: "تقنيات الأشعة",
  };
  return depts[code] || code;
}

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

export default async function OfficialResultPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  // Get student session (security: always use session, never from query params)
  const session = await getStudentSession();
  if (!session || !session.studentId) {
    redirect("/ar/student-portal/login");
  }

  const student = await getStudentById(session.studentId);
  if (!student) {
    redirect("/ar/student-portal/login");
  }

  // Check financial clearance
  if (!student.financialClearance) {
    redirect("/ar/student/dashboard");
  }

  // Get attempt from searchParams (default to 1)
  const params = await searchParams;
  const attemptParam = params.attempt || "1";
  const attemptNumber = attemptParam === "2" ? 2 : 1;
  const attemptLabel = getAttemptLabel(attemptNumber);

  // Get results securely
  const resultsResponse = await getStudentResultsSecure(
    session.studentId,
    ACADEMIC_YEAR,
    SEMESTER
  );

  if (resultsResponse.error || !resultsResponse.results) {
    redirect("/ar/student/dashboard");
  }

  // Filter results by attempt
  const result = resultsResponse.results.find((r) => r.attempt === attemptLabel);
  if (!result) {
    redirect("/ar/student/dashboard");
  }

  // Extract summary values and calculate evaluation/result using ministerial logic
  const summary = result.summaryJson && typeof result.summaryJson === "object" 
    ? result.summaryJson as Record<string, unknown>
    : null;
  
  // Calculate evaluation from average, finalStatus from MIN of subject scores
  const { evaluation, finalStatus } = getFinalEvaluationAndResult(
    summary,
    result.subjectsJson as Array<{ score?: number | string | null }> | undefined
  );

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "Arial", "Traditional Arabic", sans-serif;
          direction: rtl;
          text-align: right;
          color: #000;
          background: #fff;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .container {
          width: 100%;
          max-width: 100%;
        }
        
        /* Header Grid */
        .print-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border: 1px solid #000;
          margin-bottom: 10px;
        }
        
        .header-box {
          padding: 8px;
          font-size: 12px;
          border-right: 1px solid #000;
        }
        
        .header-box:last-child {
          border-right: none;
        }
        
        .header-box.right {
          text-align: right;
        }
        
        .header-box.center {
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header-box.left {
          text-align: right;
        }
        
        .header-box img {
          height: 70px;
          width: auto;
          object-fit: contain;
        }
        
        .header-box div {
          margin: 2px 0;
        }
        
        /* Result Title */
        .result-title {
          border: 1px solid #000;
          text-align: center;
          font-weight: bold;
          padding: 6px;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        /* Student Name Box */
        .student-name-box {
          border: 1px solid #000;
          padding: 6px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        .student-name-box strong {
          font-weight: bold;
        }
        
        /* Subjects Table */
        .subjects-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 10px;
        }
        
        .subjects-table th,
        .subjects-table td {
          border: 1px solid #000;
          padding: 6px;
          text-align: center;
        }
        
        .subjects-table th {
          font-weight: bold;
          background: #fff;
        }
        
        .subjects-table td {
          background: #fff;
        }
        
        .subjects-table td.subject {
          text-align: right;
        }
        
        /* Final Box */
        .final-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #000;
          margin-top: 10px;
          padding: 6px;
          font-size: 12px;
        }
        
        .final-box div {
          text-align: right;
        }
        
        .final-box strong {
          font-weight: bold;
        }
        
        /* Signature */
        .signature {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
        }
        
        /* Print Footer */
        .print-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 20px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      
      <div className="container">
        {/* Header Grid */}
        <div className="print-header">
          <div className="header-box right">
            <div>كلية التقنيات الصحية والطبية</div>
            <div>قسم {getDepartmentName(student.departmentCode)}</div>
          </div>

          <div className="header-box center">
            <Image 
              src="/result.png" 
              alt="logo" 
              width={70} 
              height={70}
              unoptimized
            />
          </div>

          <div className="header-box left">
            <div>المرحلة: {result.stage}</div>
            <div>نوع الدراسة: {result.studyType}</div>
            <div>الفصل: {SEMESTER}</div>
            <div>السنة: {ACADEMIC_YEAR}</div>
          </div>
        </div>

        {/* Result Title */}
        <div className="result-title">
          نتائج الامتحانات النهائية – {attemptLabel}
        </div>

        {/* Student Name Box */}
        <div className="student-name-box">
          اسم الطالب: <strong>{student.fullName}</strong>
        </div>

        {/* Subjects Table */}
        {result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0 && (
          <table className="subjects-table">
            <thead>
              <tr>
                <th>ت</th>
                <th>اسم المادة</th>
                <th>التقدير</th>
              </tr>
            </thead>
            <tbody>
              {result.subjectsJson.map((subject: any, idx: number) => {
                const scoreNum = typeof subject.score === "number" 
                  ? subject.score 
                  : Number(subject.score) || 0;
                const calculatedGrade = calculateGrade(scoreNum);
                
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td className="subject">{subject.name || "-"}</td>
                    <td>{calculatedGrade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Final Box - النتيجة والتقدير فقط */}
        {(finalStatus || evaluation) && (
          <div className="final-box">
            {finalStatus && (
              <div>النتيجة: <strong>{finalStatus}</strong></div>
            )}
            {evaluation && (
              <div>التقدير: <strong>{evaluation}</strong></div>
            )}
          </div>
        )}

        {/* Signature */}
        <div className="signature">
          رئيس اللجنة الامتحانية
          <br />
          --------------------------
        </div>

        {/* Print Footer */}
        <div className="print-footer">
          هذه الوثيقة صادرة إلكترونياً من نظام كلية الشرق ولا تحتاج إلى توقيع وختم
        </div>
      </div>
    </>
  );
}
