import { redirect } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import crypto from "crypto";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResultsSecure } from "@/lib/resultsRepo";
import { calculateGrade, getFinalEvaluationAndResult } from "@/lib/grades";

async function makeQrDataUrl(text: string) {
  return await QRCode.toDataURL(text, { margin: 1, width: 160 });
}

function signResult(resultId: string, studentId: string) {
  const secret = process.env.RESULT_QR_SECRET;
  if (!secret || secret === "YOUR_STRONG_RANDOM_SECRET_HERE") {
    // Fallback to a default secret if not configured (for development/testing only)
    console.warn("RESULT_QR_SECRET not configured properly, using fallback");
    const fallbackSecret = process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "fallback-secret";
    const payload = `${resultId}:${studentId}`;
    return crypto.createHmac("sha256", fallbackSecret).update(payload).digest("hex");
  }
  const payload = `${resultId}:${studentId}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

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

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

/** Compute total (sum of score×units) and average from subjects when missing from summary */
function computeTotalAndAvgFromSubjects(
  subjects: Array<{ name?: string; score?: number | string | null; units?: number | string | null }> | undefined
): { total: number | null; avg: number | null } {
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return { total: null, avg: null };
  const actualSubjects = subjects.filter((s) => {
    const name = String(s.name || "").trim().toLowerCase();
    return !name.includes("وحدات") && !name.includes("units");
  });
  if (actualSubjects.length === 0) return { total: null, avg: null };
  let sumScoreTimesUnits = 0;
  let totalUnits = 0;
  for (const sub of actualSubjects) {
    const scoreNum = typeof sub.score === "number" ? sub.score : Number(sub.score) || 0;
    const unitsNum = typeof sub.units === "number" ? sub.units : Number(sub.units) || 0;
    sumScoreTimesUnits += scoreNum * unitsNum;
    totalUnits += unitsNum;
  }
  const total = sumScoreTimesUnits;
  const avg = totalUnits > 0 ? Math.round((sumScoreTimesUnits / totalUnits) * 100) / 100 : null;
  return { total, avg };
}

export default async function PrintResultPage({
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

  // ============================================================
  // 🔒 FINAL ACADEMIC LOCK - القفل النهائي للنظام
  // ============================================================
  // 
  // هذا القسم يضمن أن PDF يعتمد فقط على القيم المحسوبة داخل النظام
  // وليس على أي قيم من Excel. هذا هو القفل النهائي للنظام (Final Academic Lock)
  //
  // متطلبات PDF (إلزامي):
  // 1. اسم الطالب ✓ (من قاعدة البيانات)
  // 2. القسم ✓ (من قاعدة البيانات)
  // 3. المرحلة ✓ (من قاعدة البيانات)
  // 4. نوع الدراسة ✓ (من قاعدة البيانات)
  // 5. جدول المواد (الدرجة + التقدير) ✓ (محسوب من النظام)
  // 6. المجموع الكلي ✓ (محسوب من score × units)
  // 7. المعدل ✓ (محسوب من total / totalUnits)
  // 8. التقييم النهائي ✓ (محسوب من المعدل فقط)
  // 9. النتيجة النهائية (ناجح/مكمل) ✓ (محسوبة من أدنى درجة مادة)
  //
  // ⚠️ يمنع إدخال أي من هذه القيم يدويًا في PDF
  // ============================================================
  
  // Extract summary values and calculate evaluation/result using ministerial logic
  // IMPORTANT: PDF must display ONLY calculated values from the system (not from Excel)
  // All values are calculated using ministerial logic:
  // - Total = sum(score × units) for each subject
  // - Average = Total / totalUnits (rounded to 2 decimals)
  // - Evaluation = calculated from average ONLY
  // - FinalStatus = calculated from MIN of subject scores ONLY
  const summary = result.summaryJson && typeof result.summaryJson === "object" 
    ? result.summaryJson as Record<string, unknown>
    : null;
  
  // Calculate evaluation from average, finalStatus from MIN of subject scores
  // IMPORTANT: These are calculated values, NOT read from Excel
  // This ensures the PDF always shows accurate, system-calculated values
  const { evaluation, finalStatus, finalNumeric } = getFinalEvaluationAndResult(
    summary,
    result.subjectsJson as Array<{ score?: number | string | null }> | undefined
  );
  
  // Extract calculated total and average from summary
  // These are calculated from (score × units) during import
  // If missing in summary (e.g. old data or different Excel columns), compute from subjectsJson
  // Convert from unknown to number | string | null (summary is Record<string, unknown>)
  const rawTotal = summary?.total;
  const rawAvg = summary?.avg ?? summary?.average;
  let total: number | string | null = rawTotal != null ? (rawTotal as number | string) : null;
  let avg: number | string | null = rawAvg != null ? (rawAvg as number | string) : null;
  if (total === null || total === undefined || avg === null || avg === undefined) {
    const subjects = result.subjectsJson as Array<{ name?: string; score?: number | string | null; units?: number | string | null }> | undefined;
    const computed = computeTotalAndAvgFromSubjects(subjects);
    if (total === null || total === undefined) total = computed.total;
    if (avg === null || avg === undefined) avg = computed.avg;
  }

  // ============================================================
  // 🔐 QR CODE VERIFICATION - رمز التحقق الرسمي
  // ============================================================
  // 
  // QR Code مرتبط بسجل النتيجة مباشرة (result_id)
  // أي تعديل على الدرجات يولد PDF جديد تلقائيًا
  // 
  // الهدف النهائي:
  // - PDF = نتيجة صحيحة ✓
  // - QR Code = تحقق رسمي ✓
  // - لا يمكن تزوير أو التلاعب بالنتيجة ✓
  // ============================================================
  
  // Generate QR Code for verification (Official Verification Link)
  // IMPORTANT: QR Code contains a signed verification URL that links directly to result_id
  // This ensures official verification and prevents tampering
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  
  // Use result.id as the primary identifier (official result record ID)
  // This is the unique database ID for this result record
  // Fallback to composite ID if result.id is not available (for backward compatibility)
  const resultId = String(result.id ?? `${session.studentId}-${result.academicYear}-${result.semester}-${result.attempt}`);
  
  // Sign the result for verification using HMAC-SHA256
  // This creates a cryptographic signature that prevents tampering
  const sig = signResult(resultId, String(session.studentId));
  
  // Create verification URL: https://shau.edu.iq/ar/verify-result?rid={result_id}&sid={student_id}&sig={signature}
  // This URL allows public verification of the result authenticity
  // When scanned, it will verify the signature and display the official result data
  const verifyUrl = `${base}/ar/verify-result?rid=${encodeURIComponent(resultId)}&sid=${encodeURIComponent(
    String(session.studentId)
  )}&sig=${sig}`;
  
  // Generate QR Code image as data URL
  const qrDataUrl = await makeQrDataUrl(verifyUrl);

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          background: #fff;
          direction: rtl;
        }
        
        body {
          font-family: "Calibri", "Arial", sans-serif;
          color: #000;
          font-size: 15px;
          line-height: 1.5;
        }
        
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .sheet {
          width: 100%;
          font-family: "Calibri", "Arial", sans-serif;
          color: #000;
        }
        
        .box {
          border: 2px solid #000;
          border-collapse: collapse;
        }
        
        .boxThin {
          border: 1px solid #000;
        }
        
        .pad {
          padding: 8px 10px;
        }
        
        .center {
          text-align: center;
        }
        
        .right {
          text-align: right;
        }
        
        .left {
          text-align: left;
        }
        
        /* Header Grid */
        .headerGrid {
          display: grid;
          grid-template-columns: 1fr 180px 1.2fr;
          border: 2px solid #000;
          margin-bottom: 10px;
        }
        
        .headerCell {
          padding: 10px;
          min-height: 90px;
        }
        
        .headerCell.rightCol {
          border-right: 2px solid #000;
          text-align: right;
        }
        
        .headerCell.centerCol {
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none !important;
        }
        
        .headerCell.leftCol {
          border-left: 2px solid #000;
          overflow: visible;
          word-wrap: break-word;
          min-width: 0;
        }
        
        .metaBox {
          text-align: left;
          direction: rtl;
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-size: 15px;
        }
        
        .logo {
          width: 90px;
          height: 90px;
          object-fit: contain;
          margin: auto;
        }
        
        .headerCell div {
          margin: 2px 0;
          font-size: 13px;
          white-space: normal;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .headerCell.leftCol div {
          white-space: nowrap;
          overflow: visible;
        }
        
        /* Strip background color */
        .strip {
          background: #DDEBF7;
        }
        
        /* Title Box */
        .titleBox {
          border: 2px solid #000;
          padding: 10px;
          font-weight: 700;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 10px;
          font-size: 15px;
          background: #DDEBF7;
        }
        
        /* Student Name Box */
        .studentBox {
          border: 2px solid #000;
          padding: 10px;
          margin-top: 10px;
          margin-bottom: 10px;
          direction: rtl;
          text-align: right;
          font-weight: 700;
          font-size: 13px;
          display: block;
        }
        
        /* Subjects Table */
        table.printTable {
          width: 100%;
          border: 2px solid #000;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        
        table.printTable th,
        table.printTable td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 15px;
        }
        
        table.printTable thead th {
          font-weight: 700;
          background: #DDEBF7;
        }
        
        th.colNo,
        td.colNo {
          width: 60px;
          text-align: center;
        }
        
        th.colName,
        td.colName {
          width: auto;
          text-align: right;
          font-weight: 600;
        }
        
        th.colGrade,
        td.colGrade {
          width: 140px;
          text-align: center;
          font-weight: 700;
        }
        
        /* Prevent page breaks */
        table.printTable,
        table.printTable tr,
        table.printTable td,
        table.printTable th {
          page-break-inside: avoid;
        }
        
        /* Result Eval Box - Supports 2 or 4 items (Total/Avg, Result/Evaluation) */
        .resultEvalBox {
          border: 2px solid #000;
          margin-top: 10px;
          margin-bottom: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        
        .resultEvalBox > div {
          padding: 10px;
          border-right: 1px solid #000;
        }
        
        .resultEvalBox > div:last-child {
          border-right: none;
        }
        
        .resultEvalBox .right {
          text-align: right;
        }
        
        .resultEvalBox .left {
          text-align: right;
        }
        
        .resultEvalBox strong {
          font-weight: 700;
        }
        
        /* If we have 4 items, use 2x2 grid */
        .resultEvalBox:has(> div:nth-child(4)) {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }
        
        /* QR Block */
        .qrBlock {
          margin-top: 8mm;
          display: flex;
          justify-content: flex-end;
        }
        
        .qrBox {
          width: 55mm;
          text-align: center;
        }
        
        .qrImg {
          width: 35mm;
          height: 35mm;
          margin: 3mm auto 2mm;
          object-fit: contain;
        }
        
        .qrTitle {
          font-weight: 700;
          font-size: 12pt;
        }
        
        .qrHint {
          font-size: 9pt;
          color: #333;
        }
        
        /* Signature Footer */
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
        
        /* Print Sheet */
        #print-sheet {
          width: 190mm;
          min-height: 277mm;
          margin: 0 auto;
        }
        
        .no-break {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        
        /* Hide floating elements */
        button.fab,
        .fab,
        .floating-button,
        .noPrint {
          display: none !important;
        }
        
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          
          .noPrint {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .sheet {
            page-break-after: avoid;
          }
        }
      `}</style>
      
      <div id="result-print-root" className="sheet">
        <div id="print-sheet" className="no-break">
        {/* HeaderBox - 3 columns */}
        <div className="headerGrid box">
          {/* Right Column */}
          <div className="headerCell rightCol pad">
            <div>كلية الشرق للعلوم التقنية الطبية</div>
            <div>قسم {getDepartmentName(student.departmentCode)}</div>
            <div>العام الدراسي: {ACADEMIC_YEAR}</div>
          </div>

          {/* Center Column - Logo */}
          <div className="headerCell centerCol pad">
            <Image 
              src="/result.png" 
              alt="logo" 
              width={90} 
              height={90}
              className="logo"
              unoptimized
            />
          </div>

          {/* Left Column */}
          <div className="headerCell leftCol metaBox pad">
            <div>المرحلة: {result.stage}</div>
            <div>نوع الدراسة: {result.studyType}</div>
            <div>الفصل: {SEMESTER}</div>
            <div>السنة: {ACADEMIC_YEAR}</div>
          </div>
        </div>

        {/* TitleBox */}
        <div className="titleBox strip">
          نتائج الامتحانات النهائية – {attemptLabel}
        </div>

        {/* StudentNameBox */}
        <div className="studentBox strip">
          <span>اسم الطالب:</span> <span>{student.fullName}</span>
        </div>

        {/* SubjectsTable */}
        {result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0 && (() => {
          // Filter out "عدد الوحدات" (units) - it's NOT a subject, it's metadata
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
            <table className="printTable">
              <thead>
                <tr>
                  <th className="colNo">ت</th>
                  <th className="colName">اسم المادة</th>
                  <th className="colGrade">التقدير</th>
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
                      <td className="colNo">{idx + 1}</td>
                      <td className="colName">{subject.name || "-"}</td>
                      <td className="colGrade">{calculatedGrade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null;
        })()}

        {/* ResultEvalBox - Display calculated values ONLY */}
        {/* 
          🔒 FINAL ACADEMIC LOCK - القفل النهائي للنظام
          
          هذا القسم يعرض فقط القيم المحسوبة داخل النظام:
          - التقييم النهائي: محسوب من المعدل فقط (وليس من أقل درجة)
          - النتيجة النهائية: محسوبة من أدنى درجة مادة (MIN) فقط (وليس من المعدل)
          
          ⚠️ ملاحظة: المجموع الكلي والمعدل لا يُعرضان للطالب (سياسة النظام)
          ⚠️ يمنع إدخال أي من هذه القيم يدويًا - جميعها محسوبة تلقائيًا
        */}
        {(finalStatus || evaluation) && (
          <div className="resultEvalBox box">
            {/* Row 1: Final Status and Evaluation */}
            {/* 
              Display Final Status (calculated from MIN of subject scores)
              منطق وزاري: النتيجة النهائية تعتمد فقط على أدنى درجة مادة
              إذا كانت جميع درجات المواد ≥ 50 → "ناجح"
              إذا وُجدت أي مادة درجتها < 50 → "مكمل"
            */}
            {finalStatus && (
              <div className="right pad">
                النتيجة: <strong>{finalStatus}</strong>
              </div>
            )}
            {/* 
              Display Evaluation (calculated from average)
              منطق وزاري: التقييم النهائي يعتمد فقط على المعدل النهائي
              نفس سلم التقدير ولكن على المعدل (امتياز/جيد جداً/جيد/متوسط/مقبول/راسب)
            */}
            {evaluation && (
              <div className="left pad">
                التقييم: <strong>{evaluation}</strong>
              </div>
            )}
          </div>
        )}

        {/* QR Block - Official Verification Code */}
        {/* 
          🔐 QR CODE VERIFICATION - رمز التحقق الرسمي
          
          هذا الرمز يحتوي على رابط تحقق رسمي بصيغة:
          https://shau.edu.iq/ar/verify-result?rid={result_id}&sid={student_id}&sig={signature}
          
          عند فتح رابط الـ QR Code:
          - يتم التحقق من التوقيع الرقمي
          - يتم عرض بيانات النتيجة الرسمية
          - يتم التأكد من عدم التلاعب بالبيانات
          
          هذا الربط يُعتبر القفل النهائي للنظام (Final Academic Lock)
        */}
        <div className="qrBlock no-break">
          <div className="qrBox">
            <div className="qrTitle">رمز التحقق (QR)</div>
            <img src={qrDataUrl} alt="QR Code للتحقق من صحة الوثيقة" className="qrImg" />
            <div className="qrHint">امسح الرمز للتحقق من صحة الوثيقة</div>
          </div>
        </div>

        {/* Signature Footer */}
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
      </div>
    </>
  );
}
