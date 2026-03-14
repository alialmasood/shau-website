import { notFound } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { getResultById } from "@/lib/resultsRepo";
import { getStudentById } from "@/lib/studentsRepo";
import { calculateGrade, getFinalEvaluationAndResult } from "@/lib/grades";
import { verifySig } from "@/lib/resultSignature";
import { DEPARTMENT_CODE_TO_NAME } from "@/lib/departmentNames";

async function makeQrDataUrl(text: string) {
  return await QRCode.toDataURL(text, { margin: 1, width: 160 });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

function getDepartmentName(code: string): string {
  return DEPARTMENT_CODE_TO_NAME[code] || code;
}

function getAttemptLabel(attemptNumber: number): string {
  return attemptNumber === 2 ? "الدور الثاني" : "الدور الأول";
}

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
  return { total: sumScoreTimesUnits, avg: totalUnits > 0 ? Math.round((sumScoreTimesUnits / totalUnits) * 100) / 100 : null };
}

export default async function VerifyResultPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ rid?: string; sid?: string; sig?: string; attempt?: string }>;
}) {
  const params = await searchParams;
  const rid = String(params?.rid ?? "");
  const sid = String(params?.sid ?? "");
  const sig = String(params?.sig ?? "");
  const attemptParam = params?.attempt || "1";
  const attemptNumber = attemptParam === "2" ? 2 : 1;
  const attemptLabel = getAttemptLabel(attemptNumber);

  if (!rid || !sid || !sig || !verifySig(rid, sid, sig)) {
    notFound();
  }

  const result = await getResultById(rid);
  if (!result || result.studentId !== sid || result.attempt !== attemptLabel) {
    notFound();
  }

  const student = await getStudentById(result.studentId);
  if (!student) {
    notFound();
  }

  const summary =
    result.summaryJson && typeof result.summaryJson === "object"
      ? (result.summaryJson as Record<string, unknown>)
      : null;

  const { evaluation, finalStatus } = getFinalEvaluationAndResult(
    summary,
    result.subjectsJson as Array<{ score?: number | string | null }> | undefined
  );

  const rawTotal = summary?.total;
  const rawAvg = summary?.avg ?? summary?.average;
  let total: number | string | null = rawTotal != null ? (rawTotal as number | string) : null;
  let avg: number | string | null = rawAvg != null ? (rawAvg as number | string) : null;
  if (total === null || total === undefined || avg === null || avg === undefined) {
    const subjects = result.subjectsJson as
      | Array<{ name?: string; score?: number | string | null; units?: number | string | null }>
      | undefined;
    const computed = computeTotalAndAvgFromSubjects(subjects);
    if (total === null || total === undefined) total = computed.total;
    if (avg === null || avg === undefined) avg = computed.avg;
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  const verifyUrl = `${base}/ar/verify-result?rid=${encodeURIComponent(rid)}&sid=${encodeURIComponent(sid)}&sig=${sig}`;
  const qrDataUrl = await makeQrDataUrl(verifyUrl);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #fff; direction: rtl; font-family: "Calibri", "Arial", sans-serif; color: #000; font-size: 15px; line-height: 1.5; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .sheet { width: 100%; }
        .box { border: 2px solid #000; border-collapse: collapse; }
        .pad { padding: 8px 10px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .left { text-align: right; }
        .headerGrid { display: grid; grid-template-columns: 1fr 180px 1.2fr; border: 2px solid #000; margin-bottom: 10px; }
        .headerCell { padding: 10px; min-height: 90px; }
        .headerCell.rightCol { border-right: 2px solid #000; text-align: right; }
        .headerCell.centerCol { text-align: center; display: flex; align-items: center; justify-content: center; border: none !important; }
        .headerCell.leftCol { border-left: 2px solid #000; overflow: visible; word-wrap: break-word; min-width: 0; }
        .metaBox { text-align: left; direction: rtl; display: flex; flex-direction: column; justify-content: center; font-size: 15px; }
        .logo { width: 90px; height: 90px; object-fit: contain; margin: auto; }
        .headerCell div { margin: 2px 0; font-size: 13px; white-space: normal; word-wrap: break-word; overflow-wrap: break-word; }
        .headerCell.leftCol div { white-space: nowrap; overflow: visible; }
        .strip { background: #DDEBF7; }
        .titleBox { border: 2px solid #000; padding: 10px; font-weight: 700; text-align: center; margin-top: 10px; margin-bottom: 10px; font-size: 15px; background: #DDEBF7; }
        .studentBox { border: 2px solid #000; padding: 10px; margin-top: 10px; margin-bottom: 10px; direction: rtl; text-align: right; font-weight: 700; font-size: 13px; display: block; }
        table.printTable { width: 100%; border: 2px solid #000; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
        table.printTable th, table.printTable td { border: 1px solid #000; padding: 8px; font-size: 15px; }
        table.printTable thead th { font-weight: 700; background: #DDEBF7; }
        th.colNo, td.colNo { width: 60px; text-align: center; }
        th.colName, td.colName { width: auto; text-align: right; font-weight: 600; }
        th.colGrade, td.colGrade { width: 140px; text-align: center; font-weight: 700; }
        table.printTable, table.printTable tr, table.printTable td, table.printTable th { page-break-inside: avoid; }
        .resultEvalBox { border: 2px solid #000; margin-top: 10px; margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; }
        .resultEvalBox > div { padding: 10px; border-right: 1px solid #000; }
        .resultEvalBox > div:last-child { border-right: none; }
        .resultEvalBox strong { font-weight: 700; }
        .qrBlock { margin-top: 8mm; display: flex; justify-content: flex-end; }
        .qrBox { width: 55mm; text-align: center; }
        .qrImg { width: 35mm; height: 35mm; margin: 3mm auto 2mm; object-fit: contain; }
        .qrTitle { font-weight: 700; font-size: 12pt; }
        .qrHint { font-size: 9pt; color: #333; }
        .signature { margin-top: 30px; text-align: center; font-size: 12px; }
        .print-footer { text-align: center; font-size: 10px; margin-top: 20px; }
        #print-sheet { width: 190mm; min-height: 277mm; margin: 0 auto; }
        .no-break { break-inside: avoid !important; page-break-inside: avoid !important; }
        @media print { html, body { margin: 0; padding: 0; background: #fff; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .sheet { page-break-after: avoid; } }
      `}</style>

      <div id="result-print-root" className="sheet">
        <div id="print-sheet" className="no-break">
          <div className="headerGrid box">
            <div className="headerCell rightCol pad">
              <div>كلية الشرق للعلوم التقنية الطبية</div>
              <div>قسم {getDepartmentName(student.departmentCode)}</div>
              <div>العام الدراسي: {ACADEMIC_YEAR}</div>
            </div>
            <div className="headerCell centerCol pad">
              <Image src="/result.png" alt="logo" width={90} height={90} className="logo" unoptimized />
            </div>
            <div className="headerCell leftCol metaBox pad">
              <div>المرحلة: {result.stage}</div>
              <div>نوع الدراسة: {result.studyType}</div>
              <div>الفصل: {SEMESTER}</div>
              <div>السنة: {ACADEMIC_YEAR}</div>
            </div>
          </div>

          <div className="titleBox strip">نتائج الامتحانات النهائية – {attemptLabel}</div>
          <div className="studentBox strip">
            <span>اسم الطالب:</span> <span>{student.fullName}</span>
          </div>

          {(() => {
            const rawData =
              result.rawRowJson && typeof result.rawRowJson === "object" ? (result.rawRowJson as Record<string, unknown>) : null;
            const norm = (s: string) =>
              String(s)
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^\w\u0600-\u06FF_]/g, "");
            const FIXED = new Set([
              "student_id",
              "full_name",
              "study_type",
              "stage",
              norm("المجموع"),
              norm("المعدل"),
              norm("التقييم"),
              norm("النتيجة النهائية"),
              norm("التقدير"),
              norm("وحدات"),
              "units",
              norm("رقم الطالب"),
              norm("الاسم الكامل"),
            ]);
            const hasValidScore = (s: unknown): boolean => {
              if (s === null || s === undefined) return false;
              const str = String(s).trim();
              if (str === "") return false;
              const num = typeof s === "number" ? s : Number(s);
              return !isNaN(num) && num >= 0;
            };

            let fromJson: Array<{ name: string; score?: number | string }> = [];
            if (result.subjectsJson && Array.isArray(result.subjectsJson) && result.subjectsJson.length > 0) {
              fromJson = result.subjectsJson.filter((subject: { name?: string; score?: unknown }) => {
                const n = String(subject.name || "").trim().toLowerCase();
                if (n.includes("وحدات") || n.includes("units") || n === "عدد الوحدات" || n === "units") return false;
                return hasValidScore(subject.score);
              }) as Array<{ name: string; score?: number | string }>;
            }

            let fromRaw: Array<{ name: string; score?: number | string }> = [];
            if (rawData) {
              fromRaw = Object.entries(rawData)
                .filter(([key, value]) => {
                  const k = String(key).trim();
                  if (!k || /^\d+$/.test(k)) return false;
                  const n = norm(k);
                  if (FIXED.has(n) || FIXED.has(k)) return false;
                  if (n.includes("وحدات") || n.includes("units")) return false;
                  if (value === null || value === undefined) return false;
                  const strVal = String(value).trim();
                  if (strVal === "") return false;
                  const num = Number(value);
                  return !isNaN(num) && num >= 0 && num <= 150;
                })
                .map(([name, value]) => ({ name: String(name).trim(), score: Number(value) }))
                .sort((a, b) => a.name.localeCompare(b.name));
            }

            const actualSubjects = fromRaw.length >= fromJson.length ? fromRaw : fromJson;
            const filtered = actualSubjects.filter((s) => hasValidScore(s.score));

            return filtered.length > 0 ? (
              <table className="printTable">
                <thead>
                  <tr>
                    <th className="colNo">ت</th>
                    <th className="colName">اسم المادة</th>
                    <th className="colGrade">التقدير</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((subject, idx) => {
                    const scoreNum = typeof subject.score === "number" ? subject.score : Number(subject.score) || 0;
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

          <div className="qrBlock no-break">
            <div className="qrBox">
              <div className="qrTitle">رمز التحقق (QR)</div>
              <img src={qrDataUrl} alt="QR Code للتحقق من صحة الوثيقة" className="qrImg" />
              <div className="qrHint">امسح الرمز للتحقق من صحة الوثيقة</div>
            </div>
          </div>

          <div className="signature">
            رئيس اللجنة الامتحانية
            <br />
            --------------------------
          </div>
          <div className="print-footer">هذه الوثيقة صادرة إلكترونياً من نظام كلية الشرق ولا تحتاج إلى توقيع وختم</div>
        </div>
      </div>
    </>
  );
}
