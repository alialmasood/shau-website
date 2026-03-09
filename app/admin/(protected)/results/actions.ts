"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { upsertStudent } from "@/lib/studentsRepo";
import { createResultsBatch, updateResultsBatch, findBatchByHash, getAllBatches, getResultsStats, getBatchById, deleteBatch, deleteOrphanedResults, getOrphanedResultsCount } from "@/lib/resultsRepo";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";
import { createHash } from "crypto";
import { calculateGrade, calculateFinalEvaluation, calculateFinalResult, calculateFinalNumeric } from "@/lib/grades";
import { canAdmin } from "@/lib/adminAuthz";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/sseHub";

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";
const ATTEMPTS = ["الدور الأول", "الدور الثاني"];
const STUDY_TYPES = ["صباحي", "مسائي"];
const STAGES = ["المرحلة الأولى", "المرحلة الثانية"];
const DEPARTMENTS = [
  { code: "DENTAL_TECH", name: "تقنيات صناعة الأسنان" },
  { code: "ANESTHESIA_TECH", name: "تقنيات التخدير" },
  { code: "RADIOLOGY_TECH", name: "تقنيات الأشعة" },
  { code: "OPTICS_TECH", name: "تقنيات البصريات" },
  { code: "EMERGENCY_MED_TECH", name: "تقنيات طب الطوارئ والاسعافات الاولية" },
  { code: "COMMUNITY_HEALTH", name: "تقنيات صحة المجتمع" },
  { code: "PHYSIOTHERAPY_TECH", name: "تقنيات العلاج الطبيعي" },
  { code: "HEALTH_PHYSICS_ENG", name: "هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي" },
  { code: "OIL_GAS_ENG", name: "هندسة تقنيات النفط والغاز" },
  { code: "CYBERSEC_CLOUD_ENG", name: "هندسة تقنيات الامن السيبراني والحوسبة السحابية" },
  { code: "CIVIL_CONSTRUCTION_ENG", name: "هندسة تقنيات البناء والانشاءات" },
];

// Build subjects from rawRow — يُستخدم عند الاستيراد لضمان حفظ كل المواد
// يجتاز مفاتيح rawRow مباشرة (البيانات الفعلية في الصف) دون الاعتماد على headers
function buildSubjectsFromRawRow(
  rawRow: Record<string, unknown>,
  _headers: string[],
  fixedKeys: Set<string>,
  normalizeHeaderFn: (t: string) => string
): Array<{ name: string; score: number | string; grade: string; units?: number | string }> {
  const subjects: Array<{ name: string; score: number | string; grade: string; units?: number | string }> = [];
  for (const key of Object.keys(rawRow)) {
    const orig = String(key ?? "").trim();
    if (!orig || /^\d+$/.test(orig)) continue;
    const origLower = orig.toLowerCase();
    if (origLower.includes("وحدات") || origLower.includes("units")) continue;
    const n = normalizeHeaderFn(orig);
    if (fixedKeys.has(orig) || fixedKeys.has(n)) continue;
    if (orig === "التقدير" || n === normalizeHeaderFn("التقدير")) continue;
    const value = rawRow[orig] ?? rawRow[key] ?? rawRow[orig.trim()];
    const trimmed = value === undefined || value === null ? "" : String(value).trim();
    const scoreNum = trimmed === "" ? 0 : (typeof value === "number" ? value : Number(trimmed));
    const score = (trimmed !== "" && !isNaN(scoreNum) && scoreNum >= 0) ? scoreNum : 0;
    subjects.push({
      name: orig,
      score,
      grade: calculateGrade(score),
      units: 0,
    });
  }
  return subjects;
}

// أسماء مواد معروفة يجب ألا تُعامل أبداً كأعمدة وحدات (مثل رياضيات/الرياضيات)
const SUBJECT_NAMES_NEVER_UNITS = new Set(["رياضيات", "الرياضيات", "رياضيات ", " الرياضيات"]);

// Fixed keys that are not subjects
const FIXED_KEYS = new Set([
  "student_id",
  "full_name",
  "study_type",
  "stage",
  "المجموع",
  "المعدل",
  "التقييم",
  "النتيجة النهائية",
  "التقدير", // This is attached to previous subject
  "وحدات", // General units column (if exists)
  "units", // English units column (if exists)
]);

// Normalize header text
function normalizeHeader(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

type ParsedExcelData = {
  rows: any[][];
  headerRowIndex: number;
  headers: string[];
  headerMap: Map<string, number>;
  sheetName: string;
  dataRows: any[][];
  unitsRow?: any[] | null; // Units row (if exists) - row after header row containing units for each subject column
};

/**
 * Shared function to parse Excel file
 * Used by both preview and import to ensure consistency
 * 
 * IMPORTANT: Supports units in a separate row after header row
 * Excel structure:
 * Row 1: Headers (names of subjects, student_id, full_name, etc.)
 * Row 2: Units row (number of units for each subject column)
 * Row 3+: Student data rows
 */
function parseExcel(fileBase64: string): ParsedExcelData {
  const fileBuffer = Buffer.from(fileBase64, "base64");
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Parse as raw matrix first
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  }) as any[][];

  // Auto-detect header row
  const { headerRowIndex, headers, headerMap } = detectHeaderRow(rows);

  // Check if next row after header is a units row
  // Units row typically contains only numbers (units for each subject column)
  // IMPORTANT: Never treat a student data row as units row - check student_id/full_name columns first
  let unitsRow: any[] | null = null;
  const unitsRowIndex = headerRowIndex + 1;
  if (unitsRowIndex < rows.length) {
    const potentialUnitsRow = rows[unitsRowIndex];
    if (potentialUnitsRow && potentialUnitsRow.length > 0) {
      // If this row has real student_id or full_name data, it's a student row, NOT units row
      const colStudentId = headerMap.get("student_id") ?? headerMap.get(normalizeHeader("student_id"));
      const colFullName = headerMap.get("full_name") ?? headerMap.get(normalizeHeader("full_name"));
      const cellStudentId = colStudentId !== undefined ? String(potentialUnitsRow[colStudentId] ?? "").trim() : "";
      const cellFullName = colFullName !== undefined ? String(potentialUnitsRow[colFullName] ?? "").trim() : "";
      const hasLetter = (s: string) => /[\u0600-\u06FFa-zA-Z]/.test(s);
      const looksLikeStudentRow = (cellStudentId.length > 0 && (cellStudentId.length > 2 || hasLetter(cellStudentId))) ||
        (cellFullName.length > 0 && hasLetter(cellFullName));

      if (looksLikeStudentRow) {
        console.log(`[parseExcel] Row at index ${unitsRowIndex + 1} has student_id/full_name data -> treating as DATA row, not units row`);
      } else {
        const numericCount = potentialUnitsRow.filter((cell: any) => {
          if (cell === null || cell === undefined || cell === "") return false;
          const num = Number(cell);
          return !isNaN(num);
        }).length;
        const textCount = potentialUnitsRow.filter((cell: any) => {
          const str = String(cell || "").trim().toLowerCase();
          return str && (str.includes("student") || str.includes("name") || str.includes("id"));
        }).length;
        if (numericCount > textCount && textCount === 0) {
          unitsRow = potentialUnitsRow;
          console.log(`[parseExcel] Detected units row at index ${unitsRowIndex + 1} (after header row)`);
        }
      }
    }
  }

  // Data starts after header row (and after units row if exists)
  const dataStartIndex = unitsRow ? unitsRowIndex + 1 : headerRowIndex + 1;
  const dataRows = rows.slice(dataStartIndex).filter((row) => !isEmptyRow(row));

  return {
    rows,
    headerRowIndex,
    headers,
    headerMap,
    sheetName,
    dataRows,
    unitsRow, // Add units row to return value
  };
}

export type PreviewResult = {
  totalRows: number;
  validRows: number;
  missingStudentId: number;
  missingFullName: number;
  invalidStudyType: number;
  invalidStage: number;
  duplicates: number;
  detectedHeaderRowIndex: number;
  detectedHeaders: string[];
  sheetName: string;
  sampleStudents: Array<{
    studentId: string;
    fullName: string;
    studyType: string;
    stage: string;
    subjectsCount: number;
  }>;
  errors: Array<{ row: number; error: string }>;
};

type ParsedStudent = {
  studentId: string;
  fullName: string;
  studyType: string;
  stage: string;
  summary: {
    total?: number | string;
    avg?: number | string;
    evaluation?: string;
    finalStatus?: string;
  };
  subjects: Array<{
    name: string;
    score: number | string;
    grade: string;
    units?: number | string; // عدد الوحدات لكل مادة
  }>;
  rawRow: Record<string, unknown>;
};

/**
 * Auto-detect header row by scanning for required keys
 */
function detectHeaderRow(rows: any[][]): { headerRowIndex: number; headers: string[]; headerMap: Map<string, number> } {
  const requiredKeys = ["student_id", "full_name"];
  
  // Scan first 30 rows
  for (let i = 0; i < Math.min(30, rows.length); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Normalize all cells in this row
    const normalizedRow = row.map((cell) => normalizeHeader(String(cell ?? "")));
    
    // Check if this row contains both required keys
    const hasStudentId = normalizedRow.includes("student_id");
    const hasFullName = normalizedRow.includes("full_name");
    
    if (hasStudentId && hasFullName) {
      // Found header row! Build header map
      const headers: string[] = [];
      const headerMap = new Map<string, number>();
      
      row.forEach((cell, colIndex) => {
        const originalHeader = String(cell ?? "").trim();
        const normalized = normalizeHeader(originalHeader);
        
        if (originalHeader) {
          headers.push(originalHeader);
          // Map both original and normalized versions
          headerMap.set(originalHeader, colIndex);
          headerMap.set(normalized, colIndex);
        }
      });
      
      return { headerRowIndex: i, headers, headerMap };
    }
  }
  
  // If not found, use first row as fallback
  const firstRow = rows[0] || [];
  const headers: string[] = [];
  const headerMap = new Map<string, number>();
  
  firstRow.forEach((cell, colIndex) => {
    const originalHeader = String(cell ?? "").trim();
    if (originalHeader) {
      headers.push(originalHeader);
      headerMap.set(originalHeader, colIndex);
      headerMap.set(normalizeHeader(originalHeader), colIndex);
    }
  });
  
  return { headerRowIndex: 0, headers, headerMap };
}

/**
 * Check if row is completely empty
 */
function isEmptyRow(row: any[]): boolean {
  if (!row || row.length === 0) return true;
  return row.every((cell) => {
    const value = String(cell ?? "").trim();
    return value === "";
  });
}

/**
 * Parse Excel row into structured student data
 * 
 * IMPORTANT: Ministerial Logic for Total and Average Calculation
 * 
 * 1️⃣ المجموع الكلي (Total Sum):
 *    المجموع الكلي = sum(درجة المادة × عدد وحداتها)
 *    = (درجة المادة 1 × عدد وحداتها) + (درجة المادة 2 × عدد وحداتها) + ...
 * 
 * 2️⃣ مجموع عدد الوحدات (Total Units):
 *    مجموع عدد الوحدات = sum(عدد الوحدات) لجميع المواد
 * 
 * 3️⃣ المعدل (Average) - Ministerial Logic:
 *    المعدل = المجموع الكلي ÷ مجموع عدد الوحدات
 *    
 *    حيث:
 *    - المجموع الكلي = sum(درجة المادة × عدد وحداتها) لكل مادة
 *    - مجموع عدد الوحدات = sum(عدد الوحدات) لجميع المواد
 *    
 *    مثال:
 *    - المجموع الكلي = 745 (من sum(score × units))
 *    - مجموع الوحدات = 9 (من sum(units))
 *    - المعدل = 745 ÷ 9 = 82.78
 *    
 *    شروط إلزامية:
 *    - إذا مجموع عدد الوحدات = 0 → لا يُحسب المعدل (يستخدم قيمة Excel)
 *    - يُسمح بالقيم العشرية (مثال: 82.78)
 *    - التقريب إلى خانتين عشريتين فقط
 *    - لا يعتمد المعدل على عدد المواد، بل على عدد الوحدات فقط
 *    - المعدل يُحسب حصراً من: المجموع الكلي ÷ مجموع الوحدات
 * 
 * If units are not found in Excel, the system will use the total/avg values from Excel directly.
 * 
 * Each subject should have:
 * - score (درجة المادة)
 * - units (عدد الوحدات) - can be in a separate column named "وحدات" or "units"
 */
function parseStudentRow(
  row: any[],
  headerMap: Map<string, number>,
  headers: string[],
  unitsRow?: any[] | null
): { student: ParsedStudent | null; error: string | null } {
  // Get values by column index
  const getValue = (key: string): any => {
    const colIndex = headerMap.get(key) ?? headerMap.get(normalizeHeader(key));
    if (colIndex === undefined) return undefined;
    return row[colIndex];
  };

  // Extract required fields
  const studentIdRaw = getValue("student_id");
  const studentId = studentIdRaw !== undefined && studentIdRaw !== null 
    ? String(studentIdRaw).trim() 
    : "";
  
  const fullNameRaw = getValue("full_name");
  const fullName = fullNameRaw !== undefined && fullNameRaw !== null
    ? String(fullNameRaw).trim()
    : "";

  const studyTypeRaw = getValue("study_type");
  const studyType = studyTypeRaw !== undefined && studyTypeRaw !== null
    ? String(studyTypeRaw).trim()
    : "";

  const stageRaw = getValue("stage");
  const stage = stageRaw !== undefined && stageRaw !== null
    ? String(stageRaw).trim()
    : "";

  // Validate required fields
  if (!studentId) {
    return { student: null, error: "student_id مفقود" };
  }
  if (!fullName) {
    return { student: null, error: "full_name مفقود" };
  }
  if (!STUDY_TYPES.includes(studyType)) {
    return { student: null, error: `study_type غير صالح: ${studyType}` };
  }
  if (!STAGES.includes(stage)) {
    return { student: null, error: `stage غير صالح: ${stage}` };
  }

  // Extract summary fields from Excel
  // IMPORTANT: We read total and avg from Excel initially, but they will be recalculated if units are available
  // IMPORTANT: evaluation is NEVER read from Excel - it is ALWAYS calculated from avg (ministerial logic)
  let total = getValue("المجموع") !== undefined && getValue("المجموع") !== "" 
    ? getValue("المجموع") 
    : undefined;
  let avg = getValue("المعدل") !== undefined && getValue("المعدل") !== "" 
    ? getValue("المعدل") 
    : undefined;
  
  // ============================================================
  // 🔹 التقييم (Evaluation) - لا يُقرأ من Excel أبداً
  // ============================================================
  // 
  // التقييم يُحسب دائماً من المعدل (Average) وليس من درجة المادة
  // منطق التقييم نفس منطق التقدير:
  // - إذا كان المعدل >= 90 → "امتياز"
  // - إذا كان المعدل >= 80 → "جيد جداً"
  // - إذا كان المعدل >= 70 → "جيد"
  // - إذا كان المعدل >= 60 → "متوسط"
  // - إذا كان المعدل >= 50 → "مقبول"
  // - إذا كان المعدل < 50 → "راسب"
  // 
  // ملاحظات:
  // - evaluation will be calculated AFTER avg is finalized (either from Excel or calculated from units)
  // - This ensures evaluation always uses the correct avg value (with proper rounding)
  // - finalStatus will be calculated later from finalNumeric (MIN of scores), not from average
  // ============================================================
  
  const summary = {
    total,
    avg,
    evaluation: undefined, // Will be calculated after avg is finalized - NEVER from Excel
    // finalStatus will be added later after calculating finalNumeric
  };

  // ============================================================
  // 🔹 فصل عدد الوحدات عن المواد الدراسية
  // ============================================================
  // 
  // منطق الاستيراد:
  // 1. عدد الوحدات لا يُعامل كمادة دراسية
  // 2. لا يُنشأ له subject_id
  // 3. لا يدخل في جدول المواد
  // 4. يُربط بالمادة التي قبله أو معه
  // 
  // مثال Excel:
  // [ المادة ] [ الدرجة ] [ عدد الوحدات ]
  // 
  // وليس:
  // [ مادة ] [ مادة: عدد الوحدات ]
  // ============================================================
  
  // Build subjects dynamically
  // IMPORTANT: Ignore "التقدير" column - always calculate grade from score
  // IMPORTANT: Read units (وحدات) for each subject - units is a property, NOT a subject
  // IMPORTANT: Use column INDEX (colIndex) instead of getValue(header) when iterating - because
  // headers like "التقدير" and "عدد الوحدات" repeat for each subject, and headerMap stores only
  // the last occurrence, causing wrong column reads. Using row[colIndex] ensures correct value per column.
  const subjects: ParsedStudent["subjects"] = [];
  let currentSubject: { name: string; score: number | string; units?: number | string } | null = null;

  headers.forEach((header, colIndex) => {
    const cellValue = row[colIndex];
    // Skip "التقدير" column - we will calculate grade from score instead
    if (header === "التقدير" || normalizeHeader(header) === normalizeHeader("التقدير")) {
      // Ignore this column - grade will be calculated from score
      return;
    }

    // Skip fixed keys (including general "وحدات" and "units" columns)
    const normalizedHeader = normalizeHeader(header);
    if (FIXED_KEYS.has(header) || FIXED_KEYS.has(normalizedHeader)) {
      return;
    }

    // Check if this is a units column (وحدات) — التحقق من النص الأصلي قبل normalize لأن normalize يحذف العربية
    const origLower = String(header).trim().toLowerCase();
    const origTrimmed = String(header).trim();
    // رياضيات والرياضيات مادة دراسية وليست عمود وحدات — never treat as units column
    const isMathSubject = SUBJECT_NAMES_NEVER_UNITS.has(origTrimmed) || SUBJECT_NAMES_NEVER_UNITS.has(origLower) ||
      origTrimmed === "رياضيات" || origTrimmed === "الرياضيات";
    const isUnitsColumn = !isMathSubject && (
      origLower.includes("وحدات") || origLower.includes("units") ||
      normalizedHeader.toLowerCase().includes("units") ||
      normalizedHeader === "units"
    );
    
    if (isUnitsColumn) {
      // This is a units column - attach it to the current subject (if exists)
      // IMPORTANT: Do NOT create a new subject for units column
      if (currentSubject) {
        if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
          const units = typeof cellValue === "number" ? cellValue : Number(cellValue) || 0;
          currentSubject.units = units;
        }
      }
      // Skip this column - it's not a subject
      return;
    }

    // This might be a subject score column - use cellValue (row[colIndex]) not getValue(header)
    const scoreValue = cellValue;
    if (scoreValue !== undefined && scoreValue !== null && scoreValue !== "") {
      // IMPORTANT: Double-check that this header is NOT a units column
      // Sometimes Excel might have "عدد الوحدات" as a column name with a numeric value
      // رياضيات/الرياضيات are always subjects, never units
      const headerNameLower = String(header).trim().toLowerCase();
      const isUnitsHeader = !isMathSubject && (
        headerNameLower.includes("وحدات") || 
        headerNameLower.includes("units") ||
        headerNameLower === "عدد الوحدات" ||
        headerNameLower === "units"
      );
      
      if (isUnitsHeader) {
        // This is a units column with a value - attach it to current subject or skip
        if (currentSubject) {
          const units = typeof scoreValue === "number" ? scoreValue : Number(scoreValue) || 0;
          currentSubject.units = units;
        }
        // Skip - do NOT create a subject for units
        return;
      }
      
      // If we have a previous subject, finalize it with calculated grade
      if (currentSubject) {
        const scoreNum = typeof currentSubject.score === "number" 
          ? currentSubject.score 
          : Number(currentSubject.score) || 0;
        const calculatedGrade = calculateGrade(scoreNum);
        subjects.push({ 
          name: currentSubject.name,
          score: currentSubject.score,
          grade: calculatedGrade,
          units: currentSubject.units ?? 0, // Default to 0 if units not found
        });
      }
      // Start new subject
      const score = typeof scoreValue === "number" ? scoreValue : String(scoreValue).trim();
      currentSubject = {
        name: header,
        score,
      };
      
      // Try to find units for this subject
      // Method 1: Check if units row exists (units in a separate row after header)
      if (unitsRow && unitsRow.length > 0) {
        if (colIndex < unitsRow.length) {
          const unitsValue = unitsRow[colIndex];
          if (unitsValue !== undefined && unitsValue !== null && unitsValue !== "") {
            const units = typeof unitsValue === "number" ? unitsValue : Number(unitsValue) || 0;
            if (!isNaN(units) && units > 0) {
              currentSubject.units = units;
              console.log(`[parseStudentRow] Found units from units row: "${header}" = ${units}`);
            }
          }
        }
      }
      
      // Method 2: Try to find units column for this subject (look for "وحدات" + subject name or just "وحدات")
      // Check next few headers for units (units column should be adjacent to subject column)
      // Only if units not found from units row - use row[i] not getValue to avoid duplicate header issue
      if (!currentSubject.units) {
        for (let i = colIndex + 1; i < Math.min(colIndex + 3, headers.length); i++) {
          const nextHeader = headers[i];
          const nextNormalized = normalizeHeader(nextHeader).toLowerCase();
          if (nextNormalized.includes("وحدات") || nextNormalized.includes("units") || 
              String(nextHeader).trim().toLowerCase().includes("وحدات") || String(nextHeader).trim().toLowerCase().includes("units")) {
            const unitsValue = row[i];
            if (unitsValue !== undefined && unitsValue !== null && unitsValue !== "") {
              const units = typeof unitsValue === "number" ? unitsValue : Number(unitsValue) || 0;
              if (!isNaN(units) && units > 0) {
                currentSubject.units = units;
                console.log(`[parseStudentRow] Found units from adjacent column: "${header}" = ${units}`);
                break;
              }
            }
          }
        }
      }
    } else {
      // Empty score - if we have a current subject, finalize it with calculated grade
      if (currentSubject) {
        const scoreNum = typeof currentSubject.score === "number" 
          ? currentSubject.score 
          : Number(currentSubject.score) || 0;
        const calculatedGrade = calculateGrade(scoreNum);
        subjects.push({ 
          name: currentSubject.name,
          score: currentSubject.score,
          grade: calculatedGrade,
          units: currentSubject.units ?? 0, // Default to 0 if units not found
        });
        currentSubject = null;
      }
    }
  });

  // Add last subject if exists with calculated grade
  type SubjectItem = { name: string; score: number | string; units?: number | string };
  const lastSubject = currentSubject as SubjectItem | null;
  if (lastSubject) {
    const scoreNum = typeof lastSubject.score === "number" 
      ? lastSubject.score 
      : Number(lastSubject.score) || 0;
    const calculatedGrade = calculateGrade(scoreNum);
    subjects.push({ 
      name: lastSubject.name,
      score: lastSubject.score,
      grade: calculatedGrade,
      units: lastSubject.units ?? 0, // Default to 0 if units not found
    });
  }

  // ============================================================
  // 🔹 استخدام عدد الوحدات فقط في الحسابات
  // ============================================================
  // 
  // عدد الوحدات يُستخدم فقط هنا:
  // ✅ حساب المجموع: المجموع = (درجة المادة × عدد وحداتها) + ...
  // ✅ حساب المعدل: المعدل = المجموع ÷ مجموع الوحدات
  // 
  // ❌ لا يُستخدم في:
  // - تقدير (grade) - يعتمد على درجة المادة فقط
  // - رسوب/نجاح (finalStatus) - يعتمد على أدنى درجة مادة فقط
  // - عرض للطالب - لا يظهر في صفحة الطالب أو PDF
  // 
  // عدد الوحدات = Meta Data (بيانات وصفية)
  // المادة = كيان أكاديمي (Subject Entity)
  // لا يجوز خلط الاثنين
  // ============================================================
  
  // Calculate total sum based on (score × units) for each subject - ministerial logic
  // المجموع الكلي = sum(درجة المادة × عدد وحداتها)
  // مجموع عدد الوحدات = sum(عدد الوحدات) لجميع المواد
  // المعدل = المجموع الكلي ÷ مجموع عدد الوحدات
  // 
  // IMPORTANT MINISTERIAL LOGIC:
  // - المعدل يُحسب حصراً من: المجموع الكلي ÷ مجموع الوحدات
  // - إذا مجموع الوحدات = 0 → لا يُحسب المعدل
  // - يُسمح بالقيم العشرية (مثال: 63.18)
  // - التقريب إلى خانتين عشريتين فقط
  let calculatedTotal: number | undefined = undefined;
  let calculatedAvg: number | undefined = undefined;
  let totalUnits: number = 0;
  let hasUnits = false;
  
  if (subjects.length > 0) {
    let sumScoreTimesUnits = 0;
    
    // ============================================================
    // 🔹 حساب المجموع الكلي (Total Sum) - منطق وزاري
    // ============================================================
    // 
    // المجموع الكلي = (درجة المادة الأولى × عدد وحداتها) +
    //                 (درجة المادة الثانية × عدد وحداتها) +
    //                 (درجة المادة الثالثة × عدد وحداتها) + ...
    // 
    // مثال:
    // - المادة 1: درجة = 85، وحدات = 4 → 85 × 4 = 340
    // - المادة 2: درجة = 75، وحدات = 3 → 75 × 3 = 225
    // - المادة 3: درجة = 90، وحدات = 2 → 90 × 2 = 180
    // المجموع الكلي = 340 + 225 + 180 = 745
    // 
    // ملاحظات:
    // - كل مادة لها عمود درجة و عمود عدد وحدات
    // - لا يجوز حساب المجموع بدون ضرب الدرجة في عدد الوحدات
    // - هذا المنطق مطابق للنموذج الوزاري المعتمد
    // ============================================================
    
    // Step 1: Calculate المجموع الكلي = sum(درجة × وحدات) لكل مادة
    // Step 2: Calculate مجموع الوحدات = sum(وحدات) لجميع المواد
    // 
    // ⚠️ IMPORTANT: Only include actual subjects (exclude "عدد الوحدات" which is NOT a subject)
    // Filter out "عدد الوحدات" - it's NOT a subject, it's metadata
    const actualSubjects = subjects.filter((subject) => {
      const subjectName = String(subject.name || "").trim().toLowerCase();
      // Exclude any subject with "وحدات" or "units" in the name
      return !subjectName.includes("وحدات") && 
             !subjectName.includes("units") && 
             subjectName !== "عدد الوحدات" &&
             subjectName !== "units";
    });
    
    for (const subject of actualSubjects) {
      const scoreNum = typeof subject.score === "number" 
        ? subject.score 
        : Number(subject.score) || 0;
      const unitsNum = typeof subject.units === "number" 
        ? subject.units 
        : Number(subject.units) || 0;
      
      // Check if this subject has units
      // IMPORTANT: Only include subjects with units > 0 in the calculation
      // If units = 0, skip this subject from total/average calculation
      if (unitsNum > 0) {
        hasUnits = true;
        // Add to total units (sum of all units)
        totalUnits += unitsNum;
        
        // Add to sum (score × units) - include even if score is 0
        // This ensures: 0 × units = 0 is included in the total
        // Formula: المجموع الكلي += (درجة المادة × عدد وحداتها)
        sumScoreTimesUnits += scoreNum * unitsNum;
        
        console.log(`[parseStudentRow] Subject "${subject.name}": score=${scoreNum}, units=${unitsNum}, contribution=${scoreNum * unitsNum}`);
      } else {
        // Subject without units - log for debugging
        console.log(`[parseStudentRow] Subject "${subject.name}": score=${scoreNum}, units=0 (skipped from total calculation)`);
      }
    }
    
    // ============================================================
    // 🔹 حساب المعدل (Average) - منطق وزاري
    // ============================================================
    // 
    // ⚠️ IMPORTANT: المعدل يُحسب حصراً من:
    // المعدل = المجموع الكلي ÷ مجموع عدد الوحدات
    // 
    // حيث:
    // - المجموع الكلي = sum(درجة المادة × عدد وحداتها) لكل مادة
    // - مجموع عدد الوحدات = sum(عدد الوحدات) لجميع المواد
    // 
    // مثال عملي:
    // - المادة 1: درجة = 85، وحدات = 4 → 85 × 4 = 340
    // - المادة 2: درجة = 75، وحدات = 3 → 75 × 3 = 225
    // - المادة 3: درجة = 90، وحدات = 2 → 90 × 2 = 180
    // - المجموع الكلي = 340 + 225 + 180 = 745
    // - مجموع الوحدات = 4 + 3 + 2 = 9
    // - المعدل = 745 ÷ 9 = 82.777... → 82.78 (مقرب إلى خانتين عشريتين)
    // 
    // شروط إلزامية:
    // - إذا مجموع الوحدات = 0 → لا يُحسب المعدل (يستخدم قيمة Excel)
    // - يُسمح بالقيم العشرية (مثال: 82.78)
    // - التقريب إلى خانتين عشريتين فقط
    // - لا يعتمد المعدل على عدد المواد، بل على عدد الوحدات فقط
    // 
    // ⚠️ IMPORTANT: المعدل لا يُحسب من:
    // - عدد المواد (لا يعتمد على عدد المواد)
    // - جمع الدرجات مباشرة (يجب ضرب الدرجة في الوحدات أولاً)
    // - أي طريقة أخرى غير (المجموع الكلي ÷ مجموع الوحدات)
    // ============================================================
    
    // Step 3: Calculate المعدل = المجموع الكلي ÷ مجموع الوحدات
    // IMPORTANT: Only calculate if totalUnits > 0 (ministerial requirement)
    if (hasUnits && totalUnits > 0) {
      // المجموع الكلي = sum(score × units) for all subjects
      calculatedTotal = sumScoreTimesUnits;
      
      // Calculate average = المجموع الكلي ÷ مجموع الوحدات
      // Formula: المعدل = calculatedTotal / totalUnits
      // Round to 2 decimal places (ministerial requirement)
      calculatedAvg = Math.round((sumScoreTimesUnits / totalUnits) * 100) / 100;
      
      // Override Excel values with calculated values
      // This ensures we use system-calculated values, not Excel values
      total = calculatedTotal;
      avg = calculatedAvg;
      
      console.log(`[parseStudentRow] ✅ Calculated from units:`);
      console.log(`  - المجموع الكلي (Total) = ${calculatedTotal} (sum of score × units for all subjects)`);
      console.log(`  - مجموع الوحدات (Total Units) = ${totalUnits}`);
      console.log(`  - المعدل (Average) = ${calculatedAvg} (rounded to 2 decimals)`);
      console.log(`  - Formula: ${calculatedTotal} ÷ ${totalUnits} = ${calculatedAvg}`);
      console.log(`  - ✅ المعدل يُحسب من: المجموع الكلي ÷ عدد الوحدات`);
    } else if (!hasUnits) {
      console.log(`[parseStudentRow] ⚠️ No units found in any subject, using Excel total/avg values`);
      console.log(`  - Cannot calculate average without units - using Excel value: ${avg}`);
    } else if (totalUnits === 0) {
      console.log(`[parseStudentRow] ⚠️ totalUnits = 0, cannot calculate avg (ministerial requirement)`);
      console.log(`  - Cannot divide by zero - using Excel value: ${avg}`);
      // Keep Excel values, don't calculate avg
    }
  }

  // ============================================================
  // 🔹 منطق النجاح والرسوب (تأكيد)
  // ============================================================
  // 
  // النجاح/الرسوب يعتمد على:
  // ✅ أدنى درجة مادة (MIN of subject scores)
  // 
  // ❌ لا يعتمد على:
  // - عدد الوحدات (لا علاقة له بالرسوب)
  // - المعدل (لا يُنظر إليه في هذا القرار)
  // - التقييم (لا يُنظر إليه في هذا القرار)
  // 
  // المنطق:
  // - إذا كل الدرجات ≥ 50 → ناجح
  // - إذا أي درجة < 50 → مكمل
  // 
  // عدد الوحدات = Meta Data (لا يؤثر على النجاح/الرسوب)
  // المادة = كيان أكاديمي (يؤثر على النجاح/الرسوب)
  // ============================================================
  
  // ============================================================
  // 🔹 منطق النتيجة النهائية (Final Status: ناجح/مكمل)
  // ============================================================
  // 
  // ⚠️ IMPORTANT: النتيجة النهائية تعتمد فقط على أدنى درجة للطالب
  // 
  // المنطق الوزاري:
  // 1. يتم فحص جميع درجات المواد الخاصة بالطالب
  // 2. يتم استخراج أدنى درجة (MIN) من درجات المواد
  // 3. قرار النتيجة النهائية:
  //    - إذا كانت أدنى درجة >= 50 → النتيجة النهائية = "ناجح"
  //    - إذا كانت أدنى درجة < 50 → النتيجة النهائية = "مكمل"
  // 
  // مثال:
  // - الطالب لديه درجات: 85, 75, 90, 45, 80
  // - أدنى درجة = 45
  // - النتيجة النهائية = "مكمل" (لأن 45 < 50)
  // 
  // مثال آخر:
  // - الطالب لديه درجات: 85, 75, 90, 50, 80
  // - أدنى درجة = 50
  // - النتيجة النهائية = "ناجح" (لأن 50 >= 50)
  // 
  // ❌ لا تعتمد على:
  // - المعدل (لا يُنظر إليه في هذا القرار)
  // - التقييم (لا يُنظر إليه في هذا القرار)
  // - عدد الوحدات (لا علاقة له بالرسوب)
  // - المجموع الكلي (لا علاقة له بالرسوب)
  // 
  // ملاحظات إلزامية:
  // - لا يُنظر إلى المعدل إطلاقًا في هذا القرار
  // - لا يهم عدد المواد الراسبة، مادة واحدة أقل من 50 كافية لجعل النتيجة (مكمل)
  // - يجب تحديث النتيجة النهائية تلقائيًا عند تغيير أي درجة مادة
  // ============================================================
  
  // Step 1: Extract all subject scores
  const subjectScores = subjects
    .map(subject => subject.score)
    .filter(score => score !== undefined && score !== null && score !== "");
  
  // Step 2: Calculate finalNumeric = MIN(جميع درجات المواد)
  // This is the minimum score among all subjects
  const finalNumeric = subjectScores.length > 0 
    ? calculateFinalNumeric(subjectScores)
    : undefined;

  // Step 3: Calculate finalStatus based ONLY on finalNumeric (MIN)
  // Formula: إذا أدنى درجة >= 50 → "ناجح"، وإلا → "مكمل"
  const finalStatus = finalNumeric !== undefined && finalNumeric !== null
    ? calculateFinalResult(finalNumeric) // Uses MIN only, NOT average, NOT evaluation
    : undefined;
  
  console.log(`[parseStudentRow] Final Status Calculation:`);
  console.log(`  - Subject scores: [${subjectScores.join(", ")}]`);
  console.log(`  - أدنى درجة (MIN) = ${finalNumeric}`);
  console.log(`  - النتيجة النهائية = ${finalStatus} (based on MIN >= 50)`);

  // ============================================================
  // 🔹 منطق التقييم النهائي (Final Evaluation)
  // ============================================================
  // 
  // التقييم منطقُه نفس منطق التقدير تمامًا، لكن:
  // ✅ التقييم لا يعتمد على درجة مادة (Subject Score)
  // ✅ التقييم يعتمد فقط على قيمة (المعدل النهائي) - Average
  // 
  // قاعدة التقييم حسب المعدل:
  // - إذا كان المعدل >= 90 → "امتياز"
  // - إذا كان المعدل >= 80 → "جيد جداً"
  // - إذا كان المعدل >= 70 → "جيد"
  // - إذا كان المعدل >= 60 → "متوسط"
  // - إذا كان المعدل >= 50 → "مقبول"
  // - إذا كان المعدل < 50 → "راسب"
  //
  // ملاحظات إلزامية:
  // - يتم حساب التقييم تلقائيًا بعد حساب المعدل
  // - يدعم الكسور العشرية (مثال: 63.18 → "متوسط")
  // - يُستخدم نفس التقريب المعتمد للمعدل (خانتين عشريتين) قبل التقييم
  // - التقييم يُحسب دائماً من المعدل، ولا يُقرأ من Excel أبداً
  // - التقييم لا يعتمد على درجة مادة منفردة
  // - التقييم لا يعتمد على أدنى درجة (MIN)
  // ============================================================
  let evaluation: string | undefined = undefined;
  if (avg !== undefined && avg !== null && avg !== "") {
    // Use the avg value (which may be rounded to 2 decimals if calculated from units)
    // calculateFinalEvaluation handles decimal values correctly
    // IMPORTANT: evaluation is calculated from average ONLY, NOT from subject scores
    evaluation = calculateFinalEvaluation(avg);
  }

  // Update summary with calculated total, avg, evaluation, finalNumeric and finalStatus
  // IMPORTANT MINISTERIAL LOGIC:
  // - evaluation: calculated from average ONLY (never from Excel, never from subject scores)
  // - finalStatus: calculated from finalNumeric (MIN) ONLY (never from average, never from evaluation)
  // - avg: calculated from (total / totalUnits) with 2 decimal places rounding if units are available
  const updatedSummary = {
    total, // Use calculated total (score × units) if available, otherwise Excel total
    avg, // Use calculated avg (total / totalUnits, rounded to 2 decimals) if available, otherwise Excel avg
    evaluation, // ALWAYS calculated from avg (never from Excel, never from subject scores), supports decimal values
    finalNumeric, // MIN of all subject scores (أدنى درجة من جميع المواد)
    finalStatus, // Calculated from finalNumeric (MIN) ONLY - NOT from average, NOT from evaluation
  };
  
  console.log(`[parseStudentRow] Student ${studentId}: total=${total} (calculated=${calculatedTotal ?? 'N/A'}), avg=${avg} (calculated=${calculatedAvg ?? 'N/A'}, rounded to 2 decimals), totalUnits=${totalUnits}, evaluation=${evaluation} (calculated from avg), finalNumeric=${finalNumeric}, finalStatus=${updatedSummary.finalStatus}`);

  // Build raw row object for reference - use column index to avoid duplicate header mapping issues
  const rawRow: Record<string, unknown> = {};
  headers.forEach((header, colIndex) => {
    const value = row[colIndex];
    if (value !== undefined && value !== null) {
      rawRow[header] = value;
    }
  });

  return {
    student: {
      studentId,
      fullName,
      studyType,
      stage,
      summary: updatedSummary,
      subjects,
      rawRow,
    },
    error: null,
  };
}

export async function previewExcel(
  fileBase64: string,
  departmentCode: string,
  attempt: string
): Promise<PreviewResult> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "upload");
    if (!allowed) {
      throw new Error("ليس لديك صلاحية لاستيراد النتائج");
    }
  }

  // Use shared parsing function
  const parsed = parseExcel(fileBase64);
  const { rows, headerRowIndex, headers, headerMap, sheetName, dataRows, unitsRow } = parsed;

  if (rows.length === 0 || dataRows.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      missingStudentId: 0,
      missingFullName: 0,
      invalidStudyType: 0,
      invalidStage: 0,
      duplicates: 0,
      detectedHeaderRowIndex: headerRowIndex + 1,
      detectedHeaders: headers,
      sheetName,
      sampleStudents: [],
      errors: [{ row: 1, error: "الملف فارغ" }],
    };
  }

  const errors: Array<{ row: number; error: string }> = [];
  const studentIds = new Set<string>();
  const duplicates = new Set<string>();
  const validStudents: ParsedStudent[] = [];

  let missingStudentIdCount = 0;
  let missingFullNameCount = 0;
  let invalidStudyTypeCount = 0;
  let invalidStageCount = 0;

  dataRows.forEach((row, index) => {
    const rowNum = headerRowIndex + 2 + index; // Excel row number (1-indexed, headerRowIndex is 0-indexed)
    const parsedRow = parseStudentRow(row, headerMap, headers, unitsRow);

    if (parsedRow.error) {
      errors.push({ row: rowNum, error: parsedRow.error });
      
      // Count specific errors
      if (parsedRow.error.includes("student_id")) missingStudentIdCount++;
      else if (parsedRow.error.includes("full_name")) missingFullNameCount++;
      else if (parsedRow.error.includes("study_type")) invalidStudyTypeCount++;
      else if (parsedRow.error.includes("stage")) invalidStageCount++;
      
      return;
    }

    const student = parsedRow.student!;

    // Check for duplicates
    if (studentIds.has(student.studentId)) {
      duplicates.add(student.studentId);
      errors.push({ row: rowNum, error: `student_id مكرر: ${student.studentId}` });
      return;
    }

    studentIds.add(student.studentId);
    validStudents.push(student);
  });

  // Prepare sample students
  const sampleStudents = validStudents.slice(0, 5).map((s) => ({
    studentId: s.studentId,
    fullName: s.fullName,
    studyType: s.studyType,
    stage: s.stage,
    subjectsCount: s.subjects.length,
  }));

  return {
    totalRows: dataRows.length,
    validRows: validStudents.length,
    missingStudentId: missingStudentIdCount,
    missingFullName: missingFullNameCount,
    invalidStudyType: invalidStudyTypeCount,
    invalidStage: invalidStageCount,
    duplicates: duplicates.size,
    detectedHeaderRowIndex: headerRowIndex + 1, // Convert to 1-indexed for display
    detectedHeaders: headers,
    sheetName,
    sampleStudents,
    errors: errors.slice(0, 50), // Limit errors display
  };
}

type ImportRowStatus = {
  rowIndex: number;
  studentId: string;
  fullName: string;
  studyType: string;
  stage: string;
  status: "IMPORTED" | "SKIPPED" | "ERROR";
  message: string;
};

type ImportResult = {
  success: boolean;
  batchId?: string;
  error?: string;
  parsedRowsCount: number;
  validRecordsCount: number;
  invalidRecordsCount: number;
  attempted: number;
  insertedStudents: number;
  updatedStudents: number;
  insertedResults: number;
  updatedResults: number;
  skippedRows: number;
  errors: string[];
  skippedDetails: Array<{
    rowIndex: number;
    studentId: string;
    fullName: string;
    reason: string;
  }>;
  rowStatuses: ImportRowStatus[];
  sheetName: string;
  headerRowIndex: number;
  duplicateBatchId?: string;
};

export async function getImportStats() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "access");
    if (!allowed) {
      throw new Error("ليس لديك صلاحية لعرض الإحصائيات");
    }
  }

  return await getResultsStats();
}

export async function getImportHistory() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "access");
    if (!allowed) {
      throw new Error("ليس لديك صلاحية لعرض سجل الاستيراد");
    }
  }

  const batches = await getAllBatches();
  
  // Get creator names
  const batchesWithCreator = await Promise.all(
    batches.map(async (batch) => {
      if (!batch.createdBy) {
        return { ...batch, creatorName: null };
      }
      const creatorRes = await query(
        `SELECT full_name FROM admin_users WHERE id = $1`,
        [batch.createdBy]
      );
      const creatorName = creatorRes.rows.length > 0 
        ? (creatorRes.rows[0].full_name as string) || null
        : null;
      return { ...batch, creatorName };
    })
  );

  return batchesWithCreator;
}

export async function getBatchDetails(batchId: string) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "access");
    if (!allowed) {
      throw new Error("ليس لديك صلاحية لعرض تفاصيل الدفعة");
    }
  }

  const batch = await getBatchById(batchId);
  if (!batch) {
    throw new Error("الدفعة غير موجودة");
  }

  return batch;
}

export async function deleteResultsBatchAction(batchId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "delete");
    if (!allowed) {
      return { success: false, error: "ليس لديك صلاحية لحذف الاستيراد" };
    }
  }

  const result = await deleteBatch(batchId);

  if (result.success) {
    revalidatePath("/admin/results");
    broadcast({
      type: "RESULTS_IMPORTED",
      payload: { batchId },
    });
  }

  return result;
}

export async function deleteOrphanedResultsAction(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "delete");
    if (!allowed) {
      return { success: false, deletedCount: 0, error: "ليس لديك صلاحية لحذف السجلات" };
    }
  }

  const result = await deleteOrphanedResults();
  if (result.success) {
    revalidatePath("/admin/results");
    revalidatePath("/admin/accounts");
    broadcast({ type: "RESULTS_IMPORTED", payload: {} });
  }
  return result;
}

export async function getOrphanedResultsCountAction(): Promise<number> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) return 0;
  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "access");
    if (!allowed) return 0;
  }
  return getOrphanedResultsCount();
}

export async function importExcel(
  fileBase64: string,
  fileName: string,
  departmentCode: string,
  attempt: string,
  forceReimport: boolean = false
): Promise<ImportResult> {
  console.log(`🚀 [importExcel] ========== STARTING IMPORT ==========`);
  console.log(`🚀 [importExcel] Parameters: fileName="${fileName}", departmentCode="${departmentCode}", attempt="${attempt}", forceReimport=${forceReimport}`);
  console.log(`🚀 [importExcel] File size: ${fileBase64.length} characters (base64)`);
  
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    console.error(`❌ [importExcel] No current user - redirecting to login`);
    redirect("/admin/login");
  }

  console.log(`✅ [importExcel] Current user: ${currentUser.email}, role: ${currentUser.role}`);

  const roleUpper = String(currentUser.role || "").toUpperCase();
  if (roleUpper !== "EXAM_COMMITTEE" && roleUpper !== "ADMIN") {
    const allowed = await canAdmin("results", "upload");
    if (!allowed) {
      console.error(`❌ [importExcel] Unauthorized: role=${currentUser.role}`);
      throw new Error("ليس لديك صلاحية لاستيراد النتائج");
    }
  }

  try {
    // Calculate file hash (SHA-256) for duplicate detection
    const fileBuffer = Buffer.from(fileBase64, "base64");
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
    console.log(`🔐 [importExcel] File hash (SHA-256): ${fileHash}`);

    // Use shared parsing function (same as preview)
    console.log(`📄 [importExcel] Starting Excel parsing...`);
    const parsed = parseExcel(fileBase64);
    const { rows, headerRowIndex, headers, headerMap, sheetName, dataRows, unitsRow } = parsed;

    console.log(`📄 [importExcel] Parsed Excel: sheetName="${sheetName}", headerRowIndex=${headerRowIndex + 1}, totalRows=${rows.length}, dataRows=${dataRows.length}`);
    if (unitsRow) {
      console.log(`📄 [importExcel] Units row detected at index ${headerRowIndex + 2}`);
    } else {
      console.log(`📄 [importExcel] No units row detected - will look for units in adjacent columns`);
    }

    // Check for duplicate batch (same department, attempt, academic_year, semester, file_hash)
    if (!forceReimport) {
      const existingBatch = await findBatchByHash(
        departmentCode,
        attempt,
        ACADEMIC_YEAR,
        SEMESTER,
        fileHash
      );
      
      if (existingBatch) {
        return {
          success: false,
          error: "DUPLICATE_FILE",
          parsedRowsCount: 0,
          validRecordsCount: 0,
          invalidRecordsCount: 0,
          attempted: 0,
          insertedStudents: 0,
          updatedStudents: 0,
          insertedResults: 0,
          updatedResults: 0,
          skippedRows: 0,
          errors: [`تم استيراد هذا الملف مسبقاً في ${new Date(existingBatch.createdAt).toLocaleDateString("ar-IQ")}`],
          skippedDetails: [],
          rowStatuses: [],
          sheetName,
          headerRowIndex: headerRowIndex + 1,
          duplicateBatchId: existingBatch.id,
        };
      }
    }

    if (rows.length === 0 || dataRows.length === 0) {
      return {
        success: false,
        error: "الملف فارغ",
        parsedRowsCount: 0,
        validRecordsCount: 0,
        invalidRecordsCount: 0,
        attempted: 0,
        insertedStudents: 0,
        updatedStudents: 0,
        insertedResults: 0,
        updatedResults: 0,
        skippedRows: 0,
        errors: [],
        skippedDetails: [],
        rowStatuses: [],
        sheetName,
        headerRowIndex: headerRowIndex + 1,
      };
    }

    // Step 1: Parse ALL rows into records first
    console.log(`📝 [importExcel] Step 1: Parsing ${dataRows.length} data rows into records...`);
    const records: Array<{ rowNum: number; student: ParsedStudent | null; error: string | null }> = [];
    const studentIds = new Set<string>();
    const rowStatuses: ImportRowStatus[] = [];

    dataRows.forEach((row, index) => {
      const rowNum = headerRowIndex + 2 + index;
      if (index < 3 || index === dataRows.length - 1) {
        console.log(`📝 [importExcel] Parsing row ${index + 1}/${dataRows.length} (Excel row ${rowNum})...`);
      }
      const parsed = parseStudentRow(row, headerMap, headers, unitsRow);

      if (parsed.error) {
        records.push({ rowNum, student: null, error: parsed.error });
        rowStatuses.push({
          rowIndex: index + 1,
          studentId: "",
          fullName: "",
          studyType: "",
          stage: "",
          status: "ERROR",
          message: parsed.error,
        });
        return;
      }

      const student = parsed.student!;

      // Check for duplicates within the file
      if (studentIds.has(student.studentId)) {
        const errorMsg = `student_id مكرر في الملف: ${student.studentId}`;
        records.push({ 
          rowNum, 
          student: null, 
          error: errorMsg,
        });
        rowStatuses.push({
          rowIndex: index + 1,
          studentId: student.studentId,
          fullName: student.fullName,
          studyType: student.studyType,
          stage: student.stage,
          status: "ERROR",
          message: errorMsg,
        });
        return;
      }

      studentIds.add(student.studentId);
      records.push({ rowNum, student, error: null });
      rowStatuses.push({
        rowIndex: index + 1,
        studentId: student.studentId,
        fullName: student.fullName,
        studyType: student.studyType,
        stage: student.stage,
        status: "IMPORTED", // Will be updated during processing
        message: "",
      });
    });

    // Step 2: Separate valid and invalid records
    const validRecords = records.filter((r) => r.student !== null && r.error === null);
    const invalidRecords = records.filter((r) => r.error !== null);

    // DIAGNOSTIC: Log parsed rows BEFORE any DB operations
    console.log("=".repeat(80));
    console.log("🔍 DIAGNOSTIC: PARSED ROWS BEFORE DB WRITES");
    console.log("=".repeat(80));
    console.log(`PARSED_ROWS: ${records.length}`);
    console.log(`VALID_RECORDS: ${validRecords.length}`);
    console.log(`INVALID_RECORDS: ${invalidRecords.length}`);
    
    // Print extracted fields for EACH row
    records.forEach((r, i) => {
      if (r.student) {
        console.log(`ROW ${i + 1} (VALID):`, {
          student_id: r.student.studentId,
          full_name: r.student.fullName,
          study_type: r.student.studyType,
          stage: r.student.stage,
          rowNum: r.rowNum,
        });
      } else {
        console.log(`ROW ${i + 1} (INVALID):`, {
          student_id: "N/A",
          full_name: "N/A",
          study_type: "N/A",
          stage: "N/A",
          rowNum: r.rowNum,
          error: r.error,
        });
      }
    });
    console.log("=".repeat(80));

    if (validRecords.length === 0) {
      // Build rowStatuses for invalid records only
      const finalRowStatuses: ImportRowStatus[] = invalidRecords.map((r, idx) => {
        const recordIdx = records.indexOf(r);
        return {
          rowIndex: recordIdx >= 0 ? recordIdx + 1 : idx + 1,
          studentId: r.student?.studentId || "",
          fullName: r.student?.fullName || "",
          studyType: r.student?.studyType || "",
          stage: r.student?.stage || "",
          status: "ERROR" as const,
          message: r.error || "Unknown error",
        };
      });
      
      return {
        success: false,
        error: `لا توجد سجلات صالحة للاستيراد. الأخطاء: ${invalidRecords.length}`,
        parsedRowsCount: records.length,
        validRecordsCount: 0,
        invalidRecordsCount: invalidRecords.length,
        attempted: 0,
        insertedStudents: 0,
        updatedStudents: 0,
        insertedResults: 0,
        updatedResults: 0,
        skippedRows: invalidRecords.length,
        errors: invalidRecords.map((r) => `Row ${r.rowNum}: ${r.error || "Unknown error"}`),
        skippedDetails: invalidRecords.map((r) => {
          const recordIdx = records.indexOf(r);
          return {
            rowIndex: recordIdx >= 0 ? recordIdx + 1 : 1,
            studentId: r.student?.studentId || "",
            fullName: r.student?.fullName || "",
            reason: r.error || "Unknown error",
          };
        }),
        rowStatuses: finalRowStatuses,
        sheetName,
        headerRowIndex: headerRowIndex + 1,
      };
    }

    // Build meta_subjects_json from detected subjects
    const detectedSubjects = new Set<string>();
    validRecords.forEach((r) => {
      if (r.student) {
        r.student.subjects.forEach((subj) => {
          detectedSubjects.add(subj.name);
        });
      }
    });

    // Fallback: إذا لم تُكتشف مواد من الصفوف، نأخذ أسماء الأعمدة من العناوين (كل عمود ليس ثابتاً وليس وحدات)
    if (detectedSubjects.size === 0 && headers.length > 0) {
      headers.forEach((h) => {
        const orig = String(h ?? "").trim();
        if (!orig) return;
        const n = normalizeHeader(orig);
        const nLower = n.toLowerCase();
        if (FIXED_KEYS.has(orig) || FIXED_KEYS.has(n)) return;
        if (nLower.includes("وحدات") || nLower.includes("units") || nLower === "units") return;
        if (orig === "التقدير" || n === normalizeHeader("التقدير")) return;
        detectedSubjects.add(orig);
      });
      console.log(`📋 [importExcel] Fallback: used ${detectedSubjects.size} headers as detected subjects`);
    }

    const metaSubjectsJson = {
      subjects: Array.from(detectedSubjects),
      detectedAt: new Date().toISOString(),
    };

    // Create batch (before processing rows)
    const firstStudent = validRecords[0]?.student;
    const batchId = await createResultsBatch({
      departmentCode,
      academicYear: ACADEMIC_YEAR,
      semester: SEMESTER,
      stage: firstStudent?.stage || "",
      studyType: firstStudent?.studyType || "",
      attempt,
      fileName,
      fileHash,
      rowsCount: validRecords.length,
      importedCount: 0, // Will be updated after processing
      skippedCount: invalidRecords.length, // Start with invalid records
      metaSubjectsJson,
      errorsJson: invalidRecords.length > 0 
        ? { errors: invalidRecords.map((r) => ({ row: r.rowNum, error: r.error || "" })) } 
        : undefined,
      createdBy: currentUser.id,
    });

    // Step 3: Execute DB writes - each row in its own transaction to avoid aborting all rows on one failure
    console.log(`🔄 [importExcel] Step 3: Starting database writes (each row in separate transaction)`);
    console.log(`📊 [importExcel] Summary: parsedRows=${dataRows.length}, validRecords=${validRecords.length}, invalidRecords=${invalidRecords.length}`);
    console.log(`📊 [importExcel] Batch ID: ${batchId}`);
    
    if (validRecords.length === 0) {
      console.error(`❌ [importExcel] CRITICAL: No valid records to import!`);
      console.error(`  - This means no data will be saved to the database`);
      console.error(`  - Check parsing errors above`);
    }
    
    const { getClient } = await import("@/lib/db");

    // Counters for detailed tracking
    let attempted = 0;
    let insertedStudents = 0;
    let updatedStudents = 0;
    let insertedResults = 0;
    let updatedResults = 0;
    let skippedRows = invalidRecords.length; // Start with invalid records count
    const errors: string[] = [];
    const skippedDetails: Array<{ rowIndex: number; studentId: string; fullName: string; reason: string }> = [];
    
    // Track status for each valid row (will be updated during processing)
    const rowStatusMap = new Map<number, ImportRowStatus>();
    validRecords.forEach((r, i) => {
      if (r.student) {
        rowStatusMap.set(i, {
          rowIndex: i + 1,
          studentId: r.student.studentId,
          fullName: r.student.fullName,
          studyType: r.student.studyType,
          stage: r.student.stage,
          status: "SKIPPED", // Will be updated to IMPORTED if successful
          message: "قيد المعالجة...",
        });
      }
    });

    // Process each row in its own transaction to avoid aborting all rows on one failure
    console.log(`🔄 Processing ${validRecords.length} valid records (each in separate transaction)...`);
    console.log(`📋 Will process records:`, validRecords.map((r, i) => ({
      index: i + 1,
      studentId: r.student?.studentId || "NULL",
      fullName: r.student?.fullName || "NULL",
    })));
    
    for (let i = 0; i < validRecords.length; i++) {
      const record = validRecords[i];
      const rowClient = await getClient();
      
      try {
        await rowClient.query("BEGIN");
        attempted++;
        
        if (!record.student) {
          await rowClient.query("ROLLBACK");
          rowClient.release();
          skippedRows++;
          const errorMsg = `Record ${i + 1}: student is null`;
          errors.push(`Row ${i + 1}: ${errorMsg}`);
          skippedDetails.push({
            rowIndex: i + 1,
            studentId: "N/A",
            fullName: "N/A",
            reason: errorMsg,
          });
          
          // Update row status
          const status = rowStatusMap.get(i);
          if (status) {
            status.status = "ERROR";
            status.message = errorMsg;
          } else {
            // Add new status if not exists
            rowStatusMap.set(i, {
              rowIndex: i + 1,
              studentId: "N/A",
              fullName: "N/A",
              studyType: "",
              stage: "",
              status: "ERROR",
              message: errorMsg,
            });
          }
          
          console.warn(`⚠️ Skipping record ${i + 1}/${validRecords.length}: student is null`);
          continue;
        }

        const student = record.student;
        
        // Normalize student_id to string
        const sid = String(student.studentId ?? "").trim();
        const fullName = String(student.fullName ?? "").trim();
        
        // Validate required fields
        if (sid === "" || fullName === "") {
          await rowClient.query("ROLLBACK");
          rowClient.release();
          skippedRows++;
          const errorMsg = `Missing required fields (student_id="${sid}", full_name="${fullName}")`;
          errors.push(`Row ${i + 1}: ${errorMsg}`);
          skippedDetails.push({
            rowIndex: i + 1,
            studentId: sid || "N/A",
            fullName: fullName || "N/A",
            reason: errorMsg,
          });
          
          // Update row status
          const status = rowStatusMap.get(i);
          if (status) {
            status.status = "SKIPPED";
            status.message = errorMsg;
          }
          
          console.warn(`⚠️ Skipping record ${i + 1}/${validRecords.length}: ${errorMsg}`);
          continue;
        }
        
        console.log(`📝 [${i + 1}/${validRecords.length}] Processing: student_id="${sid}", full_name="${fullName}", study_type="${student.studyType}", stage="${student.stage}"`);

        // Upsert student: القسم من دفعة الاستيراد (الجداول المستوردة)
        // On conflict: نحدّث قسم الطالب ليطابق دفعة النتائج المستوردة
        console.log(`  📝 [${i + 1}/${validRecords.length}] Upserting student: student_id="${sid}", full_name="${fullName}"`);
        const studentRes = await rowClient.query(
          `INSERT INTO students (student_id, full_name, department_code, stage, study_type, academic_year, semester, financial_clearance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, false))
           ON CONFLICT (student_id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             department_code = EXCLUDED.department_code,
             stage = EXCLUDED.stage,
             study_type = EXCLUDED.study_type,
             academic_year = EXCLUDED.academic_year,
             semester = EXCLUDED.semester,
             updated_at = NOW()
           RETURNING id, department_code, (xmax = 0) AS is_insert`,
          [
            sid,
            fullName,
            departmentCode,
            student.stage,
            student.studyType,
            ACADEMIC_YEAR,
            SEMESTER,
            false,
          ]
        );
        
        if (studentRes.rows.length === 0) {
          await rowClient.query("ROLLBACK");
          rowClient.release();
          skippedRows++;
          const errorMsg = `Student upsert returned no rows: student_id="${sid}"`;
          console.warn(`  ⚠️ ${errorMsg}`);
          errors.push(`Row ${i + 1}: ${errorMsg}`);
          skippedDetails.push({
            rowIndex: i + 1,
            studentId: sid,
            fullName: fullName,
            reason: errorMsg,
          });
          
          // Update row status
          const status = rowStatusMap.get(i);
          if (status) {
            status.status = "ERROR";
            status.message = errorMsg;
          }
          continue;
        }
        
        const isStudentInsert = studentRes.rows[0].is_insert;
        if (isStudentInsert) {
          insertedStudents++;
          console.log(`  ✅ Student INSERTED: student_id="${sid}", department="${departmentCode}"`);
        } else {
          updatedStudents++;
          console.log(`  ✅ Student UPDATED: student_id="${sid}", department="${departmentCode}"`);
        }

        // Upsert result
        // Unique constraint: (student_id, department_code, stage, study_type, academic_year, semester, attempt)
        // Defined in schema.prisma: @@unique([student_id, department_code, stage, study_type, academic_year, semester, attempt])
        // On conflict (re-import): update summary_json, subjects_json, raw_row_json, uploaded_batch_id, uploaded_by, uploaded_at
        // This ensures no duplicates and updates data on re-import
        
        // Ensure JSON fields are never null:
        // - summary_json: default to {} if empty/null
        // - subjects_json: default to [] if empty/null - مع fallback من rawRow إن كانت المواد فارغة
        // - raw_row_json: default to {} if empty/null (even though it's nullable in schema, we ensure it's never null)
        const summaryJson = student.summary && Object.keys(student.summary).length > 0 
          ? JSON.stringify(student.summary) 
          : '{}';
        // الاعتماد على rawRow دائماً إن وُجد — لضمان حفظ كل المواد المكتشفة في الدفعة
        let subjectsToSave = student.subjects && Array.isArray(student.subjects) ? student.subjects : [];
        if (student.rawRow && Object.keys(student.rawRow).length > 0) {
          const fromRaw = buildSubjectsFromRawRow(student.rawRow, headers, FIXED_KEYS, normalizeHeader);
          if (fromRaw.length >= subjectsToSave.length) {
            subjectsToSave = fromRaw;
            if (fromRaw.length > 0 && fromRaw.length !== (student.subjects?.length || 0)) {
              console.log(`  📋 Subjects from rawRow: ${fromRaw.length} for student_id="${sid}"`);
            }
          }
        }
        const subjectsJson = subjectsToSave.length > 0 ? JSON.stringify(subjectsToSave) : '[]';
        const rawRowJson = student.rawRow && Object.keys(student.rawRow).length > 0
          ? JSON.stringify(student.rawRow)
          : '{}';
        
        // Note: payload_json column still exists in DB (from old migration) and is NOT NULL
        // We set it to rawRowJson for backward compatibility, but it's deprecated in favor of summary_json/subjects_json/raw_row_json
        const payloadJson = rawRowJson; // Use rawRowJson as payload_json for backward compatibility
        
        console.log(`  📝 [${i + 1}/${validRecords.length}] Upserting result: student_id="${sid}", attempt="${attempt}", batchId="${batchId}"`);
        console.log(`  📝 Summary JSON keys:`, Object.keys(student.summary || {}));
        console.log(`  📝 Subjects count:`, subjectsToSave.length);
        
        const resultRes = await rowClient.query(
          `INSERT INTO results (student_id, department_code, academic_year, semester, stage, study_type, attempt, payload_json, summary_json, subjects_json, raw_row_json, uploaded_batch_id, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13)
           ON CONFLICT (student_id, department_code, stage, study_type, academic_year, semester, attempt) DO UPDATE SET
             payload_json = EXCLUDED.payload_json,
             summary_json = EXCLUDED.summary_json,
             subjects_json = EXCLUDED.subjects_json,
             raw_row_json = EXCLUDED.raw_row_json,
             uploaded_batch_id = EXCLUDED.uploaded_batch_id,
             uploaded_by = EXCLUDED.uploaded_by,
             uploaded_at = NOW()
           RETURNING id, (xmax = 0) AS is_insert`,
          [
            sid,
            departmentCode,
            ACADEMIC_YEAR,
            SEMESTER,
            student.stage,
            student.studyType,
            attempt,
            payloadJson,
            summaryJson,
            subjectsJson,
            rawRowJson,
            batchId,
            currentUser.id,
          ]
        );
        
        if (resultRes.rows.length === 0) {
          await rowClient.query("ROLLBACK");
          rowClient.release();
          skippedRows++;
          const errorMsg = `Result upsert returned no rows: student_id="${sid}", attempt="${attempt}"`;
          console.warn(`  ⚠️ ${errorMsg}`);
          errors.push(`Row ${i + 1}: ${errorMsg}`);
          skippedDetails.push({
            rowIndex: i + 1,
            studentId: sid,
            fullName: fullName,
            reason: errorMsg,
          });
          
          // Update row status
          const status = rowStatusMap.get(i);
          if (status) {
            status.status = "ERROR";
            status.message = errorMsg;
          }
          continue;
        }
        
        await rowClient.query("COMMIT");
        console.log(`  ✅ Transaction COMMITTED for student_id="${sid}", attempt="${attempt}"`);
        rowClient.release();
        
        const isResultInsert = resultRes.rows[0].is_insert;
        if (isResultInsert) {
          insertedResults++;
          console.log(`  ✅ Result INSERTED: student_id="${sid}", attempt="${attempt}", result_id="${resultRes.rows[0].id}"`);
        } else {
          updatedResults++;
          console.log(`  ✅ Result UPDATED: student_id="${sid}", attempt="${attempt}", result_id="${resultRes.rows[0].id}"`);
        }
        
        // Update row status to IMPORTED
        const status = rowStatusMap.get(i);
        if (status) {
          status.status = "IMPORTED";
          status.message = isResultInsert ? "تم الإدراج بنجاح" : "تم التحديث بنجاح";
        }
      } catch (rowError) {
        // Rollback this row's transaction
        try {
          await rowClient.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(`❌ Failed to rollback transaction for row ${i + 1}:`, rollbackError);
        }
        rowClient.release();
        
        skippedRows++;
        const errorMsg = `Error processing record ${i + 1}: ${rowError instanceof Error ? rowError.message : String(rowError)}`;
        errors.push(`Row ${i + 1}: ${errorMsg}`);
        skippedDetails.push({
          rowIndex: i + 1,
          studentId: record.student?.studentId || "N/A",
          fullName: record.student?.fullName || "N/A",
          reason: errorMsg,
        });
        
        // Update row status
        const status = rowStatusMap.get(i);
        if (status) {
          status.status = "ERROR";
          status.message = errorMsg;
        }
        
        console.error(`❌ ${errorMsg}`);
        console.error(`❌ Error details:`, rowError);
        // Continue processing other rows instead of stopping
      }
    }
      
    // Verify all rows were processed
    // Note: skippedRows includes invalidRecords.length + any skipped during processing
    const totalProcessed = insertedResults + updatedResults + skippedRows;
    const expectedTotal = records.length; // All parsed records should be accounted for
    
    console.log(`📊 [importExcel] Processing Summary:`);
    console.log(`  - Total records: ${records.length}`);
    console.log(`  - Valid records: ${validRecords.length}`);
    console.log(`  - Invalid records: ${invalidRecords.length}`);
    console.log(`  - Attempted: ${attempted}`);
    console.log(`  - Inserted students: ${insertedStudents}`);
    console.log(`  - Updated students: ${updatedStudents}`);
    console.log(`  - Inserted results: ${insertedResults}`);
    console.log(`  - Updated results: ${updatedResults}`);
    console.log(`  - Skipped rows: ${skippedRows}`);
    console.log(`  - Total processed: ${totalProcessed} (expected: ${expectedTotal})`);
    
    if (totalProcessed !== expectedTotal) {
      console.warn(`⚠️ [importExcel] Mismatch: totalProcessed (${totalProcessed}) !== expectedTotal (${expectedTotal})`);
    }
    
    // Verify data was actually saved to database
    if (insertedResults === 0 && updatedResults === 0) {
      console.error(`❌ [importExcel] CRITICAL: No results were inserted or updated!`);
      console.error(`  - This means the data was NOT saved to the database`);
      console.error(`  - Check for errors above or transaction issues`);
    } else {
      console.log(`✅ [importExcel] Data saved successfully: ${insertedResults + updatedResults} results in database`);
    }
    
    console.log(`🔍 Verification: parsedRowsCount=${expectedTotal}, totalProcessed=${totalProcessed} (insertedResults=${insertedResults} + updatedResults=${updatedResults} + skippedRows=${skippedRows})`);
    
    // Update batch with final counts
    await updateResultsBatch(batchId, {
      importedCount: insertedResults + updatedResults,
      skippedCount: skippedRows,
      errorsJson: errors.length > 0 
        ? { errors: errors.map((e, idx) => ({ index: idx + 1, error: e })) }
        : undefined,
    });
    
    // Log final summary with detailed counters
    const summary = {
      parsedRowsCount: records.length,
      validRecordsCount: validRecords.length,
      invalidRecordsCount: invalidRecords.length,
      attempted,
      insertedStudents,
      updatedStudents,
      insertedResults,
      updatedResults,
      skippedRows,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log("=".repeat(80));
    console.log("✅ Import completed - FINAL SUMMARY:");
    console.log(JSON.stringify(summary, null, 2));
    console.log("=".repeat(80));

    // Build final row statuses (combine valid and invalid)
    const finalRowStatuses: ImportRowStatus[] = Array.from(rowStatusMap.values()).concat(
      invalidRecords.map((r) => {
        const idx = records.indexOf(r);
        return {
          rowIndex: idx + 1,
          studentId: r.student?.studentId || "",
          fullName: r.student?.fullName || "",
          studyType: r.student?.studyType || "",
          stage: r.student?.stage || "",
          status: "ERROR" as const,
          message: r.error || "Unknown error",
        };
      })
    ).sort((a, b) => a.rowIndex - b.rowIndex);
    
    // Revalidate paths and broadcast event
    revalidatePath("/admin/results");
    revalidatePath("/admin/accounts");
    
    // Broadcast real-time update
    console.log(`[importExcel] 📡 About to broadcast RESULTS_IMPORTED for department: ${departmentCode}, batchId: ${batchId}`);
    console.log(`[importExcel] 📊 Import stats: insertedResults=${insertedResults}, updatedResults=${updatedResults}`);
    
    try {
      broadcast({
        type: "RESULTS_IMPORTED",
        payload: {
          departmentCode,
          batchId,
          importedCount: insertedResults + updatedResults,
        },
      });
      console.log(`[importExcel] ✅ Broadcast function called successfully`);
    } catch (error) {
      console.error(`[importExcel] ❌ Error calling broadcast:`, error);
    }

    return { 
      success: true, 
      batchId,
      parsedRowsCount: records.length,
      validRecordsCount: validRecords.length,
      invalidRecordsCount: invalidRecords.length,
      attempted,
      insertedStudents,
      updatedStudents,
      insertedResults,
      updatedResults,
      skippedRows,
      errors: errors.length > 0 ? errors : [],
      skippedDetails,
      rowStatuses: finalRowStatuses,
      sheetName,
      headerRowIndex: headerRowIndex + 1,
    };
  } catch (error) {
    console.error("Error importing Excel:", error);
    const errorMsg = error instanceof Error ? error.message : "حدث خطأ أثناء الاستيراد";
    return {
      success: false,
      error: errorMsg,
      parsedRowsCount: 0,
      validRecordsCount: 0,
      invalidRecordsCount: 0,
      attempted: 0,
      insertedStudents: 0,
      updatedStudents: 0,
      insertedResults: 0,
      updatedResults: 0,
      skippedRows: 0,
      errors: [errorMsg],
      skippedDetails: [],
      rowStatuses: [],
      sheetName: "",
      headerRowIndex: -1,
    };
  }
}
