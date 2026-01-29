"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { upsertStudent } from "@/lib/studentsRepo";
import { createResultsBatch, updateResultsBatch, findBatchByHash, getAllBatches, getResultsStats, getBatchById } from "@/lib/resultsRepo";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";
import { createHash } from "crypto";
import { calculateGrade } from "@/lib/grades";
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
];

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
};

/**
 * Shared function to parse Excel file
 * Used by both preview and import to ensure consistency
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

  // Data starts at headerRowIndex + 1
  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => !isEmptyRow(row));

  return {
    rows,
    headerRowIndex,
    headers,
    headerMap,
    sheetName,
    dataRows,
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
 */
function parseStudentRow(
  row: any[],
  headerMap: Map<string, number>,
  headers: string[]
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

  // Extract summary fields
  const summary = {
    total: getValue("المجموع") !== undefined && getValue("المجموع") !== "" 
      ? getValue("المجموع") 
      : undefined,
    avg: getValue("المعدل") !== undefined && getValue("المعدل") !== "" 
      ? getValue("المعدل") 
      : undefined,
    evaluation: getValue("التقييم") !== undefined && getValue("التقييم") !== "" 
      ? String(getValue("التقييم")) 
      : undefined,
    finalStatus: getValue("النتيجة النهائية") !== undefined && getValue("النتيجة النهائية") !== "" 
      ? String(getValue("النتيجة النهائية")) 
      : undefined,
  };

  // Build subjects dynamically
  // IMPORTANT: Ignore "التقدير" column - always calculate grade from score
  const subjects: ParsedStudent["subjects"] = [];
  let currentSubject: { name: string; score: number | string } | null = null;

  for (const header of headers) {
    // Skip "التقدير" column - we will calculate grade from score instead
    if (header === "التقدير" || normalizeHeader(header) === normalizeHeader("التقدير")) {
      // Ignore this column - grade will be calculated from score
      continue;
    }

    // Skip fixed keys
    const normalizedHeader = normalizeHeader(header);
    if (FIXED_KEYS.has(header) || FIXED_KEYS.has(normalizedHeader)) {
      continue;
    }

    // This might be a subject score column
    const scoreValue = getValue(header);
    if (scoreValue !== undefined && scoreValue !== null && scoreValue !== "") {
      // If we have a previous subject, finalize it with calculated grade
      if (currentSubject) {
        const scoreNum = typeof currentSubject.score === "number" 
          ? currentSubject.score 
          : Number(currentSubject.score) || 0;
        const calculatedGrade = calculateGrade(scoreNum);
        subjects.push({ ...currentSubject, grade: calculatedGrade });
      }
      // Start new subject
      const score = typeof scoreValue === "number" ? scoreValue : String(scoreValue).trim();
      currentSubject = {
        name: header,
        score,
      };
    } else {
      // Empty score - if we have a current subject, finalize it with calculated grade
      if (currentSubject) {
        const scoreNum = typeof currentSubject.score === "number" 
          ? currentSubject.score 
          : Number(currentSubject.score) || 0;
        const calculatedGrade = calculateGrade(scoreNum);
        subjects.push({ ...currentSubject, grade: calculatedGrade });
        currentSubject = null;
      }
    }
  }

  // Add last subject if exists with calculated grade
  if (currentSubject) {
    const scoreNum = typeof currentSubject.score === "number" 
      ? currentSubject.score 
      : Number(currentSubject.score) || 0;
    const calculatedGrade = calculateGrade(scoreNum);
    subjects.push({ ...currentSubject, grade: calculatedGrade });
  }

  // Build raw row object for reference
  const rawRow: Record<string, unknown> = {};
  headers.forEach((header) => {
    const value = getValue(header);
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
      summary,
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

  if (currentUser.role !== "EXAM_COMMITTEE" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لاستيراد النتائج");
  }

  // Use shared parsing function
  const parsed = parseExcel(fileBase64);
  const { rows, headerRowIndex, headers, headerMap, sheetName, dataRows } = parsed;

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
    const parsed = parseStudentRow(row, headerMap, headers);

    if (parsed.error) {
      errors.push({ row: rowNum, error: parsed.error });
      
      // Count specific errors
      if (parsed.error.includes("student_id")) missingStudentIdCount++;
      else if (parsed.error.includes("full_name")) missingFullNameCount++;
      else if (parsed.error.includes("study_type")) invalidStudyTypeCount++;
      else if (parsed.error.includes("stage")) invalidStageCount++;
      
      return;
    }

    const student = parsed.student!;

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

  if (currentUser.role !== "EXAM_COMMITTEE" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لعرض الإحصائيات");
  }

  return await getResultsStats();
}

export async function getImportHistory() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "EXAM_COMMITTEE" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لعرض سجل الاستيراد");
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

  if (currentUser.role !== "EXAM_COMMITTEE" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لعرض تفاصيل الدفعة");
  }

  const batch = await getBatchById(batchId);
  if (!batch) {
    throw new Error("الدفعة غير موجودة");
  }

  return batch;
}

export async function importExcel(
  fileBase64: string,
  fileName: string,
  departmentCode: string,
  attempt: string,
  forceReimport: boolean = false
): Promise<ImportResult> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "EXAM_COMMITTEE" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لاستيراد النتائج");
  }

  try {
    // Calculate file hash (SHA-256) for duplicate detection
    const fileBuffer = Buffer.from(fileBase64, "base64");
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
    console.log(`🔐 File hash (SHA-256): ${fileHash}`);

    // Use shared parsing function (same as preview)
    const parsed = parseExcel(fileBase64);
    const { rows, headerRowIndex, headers, headerMap, sheetName, dataRows } = parsed;

    console.log(`📄 Parsed Excel: sheetName="${sheetName}", headerRowIndex=${headerRowIndex + 1}, totalRows=${rows.length}, dataRows=${dataRows.length}`);

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
    const records: Array<{ rowNum: number; student: ParsedStudent | null; error: string | null }> = [];
    const studentIds = new Set<string>();
    const rowStatuses: ImportRowStatus[] = [];

    dataRows.forEach((row, index) => {
      const rowNum = headerRowIndex + 2 + index;
      const parsed = parseStudentRow(row, headerMap, headers);

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
    console.log(`🔄 Starting import (each row in separate transaction)`);
    console.log(`📊 Summary: parsedRows=${dataRows.length}, validRecords=${validRecords.length}, invalidRecords=${invalidRecords.length}`);
    
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

        // Upsert student
        // Unique constraint: student_id (defined in schema as @unique)
        // IMPORTANT: Do NOT update department_code on conflict to preserve existing department data
        // If student exists with different department_code, skip updating student record but still process result
        // On conflict: update all fields EXCEPT department_code and financial_clearance (preserve existing values)
        const studentRes = await rowClient.query(
          `INSERT INTO students (student_id, full_name, department_code, stage, study_type, academic_year, semester, financial_clearance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, false))
           ON CONFLICT (student_id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             -- DO NOT update department_code: preserve existing department to avoid overwriting data from other departments
             -- department_code = EXCLUDED.department_code,  -- REMOVED: prevents overwriting department when importing different department
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
        const existingDepartmentCode = studentRes.rows[0].department_code;
        
        // Check if department_code matches (important: student might exist in different department)
        if (!isStudentInsert && existingDepartmentCode !== departmentCode) {
          // Student exists but in different department - skip student update but still process result
          console.warn(`  ⚠️ Student exists in different department: student_id="${sid}", existing_dept="${existingDepartmentCode}", new_dept="${departmentCode}" - Skipping student update but processing result`);
          // Don't increment insertedStudents/updatedStudents, but continue to process result
        } else {
          if (isStudentInsert) {
            insertedStudents++;
            console.log(`  ✅ Student INSERTED: student_id="${sid}", department="${departmentCode}"`);
          } else {
            updatedStudents++;
            console.log(`  ✅ Student UPDATED: student_id="${sid}", department="${existingDepartmentCode}"`);
          }
        }

        // Upsert result
        // Unique constraint: (student_id, department_code, stage, study_type, academic_year, semester, attempt)
        // Defined in schema.prisma: @@unique([student_id, department_code, stage, study_type, academic_year, semester, attempt])
        // On conflict (re-import): update summary_json, subjects_json, raw_row_json, uploaded_batch_id, uploaded_by, uploaded_at
        // This ensures no duplicates and updates data on re-import
        
        // Ensure JSON fields are never null:
        // - summary_json: default to {} if empty/null
        // - subjects_json: default to [] if empty/null
        // - raw_row_json: default to {} if empty/null (even though it's nullable in schema, we ensure it's never null)
        const summaryJson = student.summary && Object.keys(student.summary).length > 0 
          ? JSON.stringify(student.summary) 
          : '{}';
        const subjectsJson = student.subjects && Array.isArray(student.subjects) && student.subjects.length > 0
          ? JSON.stringify(student.subjects)
          : '[]';
        const rawRowJson = student.rawRow && Object.keys(student.rawRow).length > 0
          ? JSON.stringify(student.rawRow)
          : '{}';
        
        // Note: payload_json column still exists in DB (from old migration) and is NOT NULL
        // We set it to rawRowJson for backward compatibility, but it's deprecated in favor of summary_json/subjects_json/raw_row_json
        const payloadJson = rawRowJson; // Use rawRowJson as payload_json for backward compatibility
        
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
        rowClient.release();
        
        const isResultInsert = resultRes.rows[0].is_insert;
        if (isResultInsert) {
          insertedResults++;
          console.log(`  ✅ Result INSERTED: student_id="${sid}", attempt="${attempt}"`);
        } else {
          updatedResults++;
          console.log(`  ✅ Result UPDATED: student_id="${sid}", attempt="${attempt}"`);
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
