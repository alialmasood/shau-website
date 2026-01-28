import { redirect } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import crypto from "crypto";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import { getStudentResultsSecure } from "@/lib/resultsRepo";
import { calculateGrade } from "@/lib/grades";

async function makeQrDataUrl(text: string) {
  return await QRCode.toDataURL(text, { margin: 1, width: 160 });
}

function signResult(resultId: string, studentId: string) {
  const secret = process.env.RESULT_QR_SECRET!;
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
  };
  return depts[code] || code;
}

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
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

  // Extract summary values for type safety
  const summary = result.summaryJson && typeof result.summaryJson === "object" 
    ? result.summaryJson as Record<string, unknown>
    : null;
  const finalStatus = summary?.finalStatus ? String(summary.finalStatus) : null;
  const evaluation = summary?.evaluation ? String(summary.evaluation) : null;

  // Generate QR Code for verification
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  const resultId = String(result.id ?? `${session.studentId}-${result.academicYear}-${result.semester}-${result.attempt}`);
  const sig = signResult(resultId, String(session.studentId));
  const verifyUrl = `${base}/ar/verify-result?rid=${encodeURIComponent(resultId)}&sid=${encodeURIComponent(
    String(session.studentId)
  )}&sig=${sig}`;
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
        
        /* Result Eval Box */
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
        {result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0 && (
          <table className="printTable">
            <thead>
              <tr>
                <th className="colNo">ت</th>
                <th className="colName">اسم المادة</th>
                <th className="colGrade">التقدير</th>
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
                    <td className="colNo">{idx + 1}</td>
                    <td className="colName">{subject.name || "-"}</td>
                    <td className="colGrade">{calculatedGrade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ResultEvalBox */}
        {(finalStatus || evaluation) && (
          <div className="resultEvalBox box">
            {finalStatus && (
              <div className="right pad">
                النتيجة: <strong>{finalStatus}</strong>
              </div>
            )}
            {evaluation && (
              <div className="left pad">
                التقييم: <strong>{evaluation}</strong>
              </div>
            )}
          </div>
        )}

        {/* QR Block */}
        <div className="qrBlock no-break">
          <div className="qrBox">
            <div className="qrTitle">رمز التحقق (QR)</div>
            <img src={qrDataUrl} alt="QR" className="qrImg" />
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
