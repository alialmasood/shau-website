import { query } from "./db";

export type ResultRow = {
  id: string;
  studentId: string;
  departmentCode: string;
  academicYear: string;
  semester: string;
  stage: string;
  studyType: string;
  attempt: string;
  summaryJson: Record<string, unknown>;
  subjectsJson: Array<Record<string, unknown>>;
  rawRowJson: Record<string, unknown> | null;
  uploadedBatchId: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
};

export type ResultAdminRow = ResultRow & {
  studentName: string | null;
};

export type ResultsBatchRow = {
  id: string;
  departmentCode: string;
  academicYear: string;
  semester: string;
  stage: string;
  studyType: string;
  attempt: string;
  fileName: string;
  fileHash: string | null;
  rowsCount: number;
  importedCount: number;
  skippedCount: number;
  metaSubjectsJson: Record<string, unknown> | null;
  errorsJson: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
};

export type CreateResultInput = {
  studentId: string;
  departmentCode: string;
  academicYear: string;
  semester: string;
  stage: string;
  studyType: string;
  attempt: string;
  summaryJson: Record<string, unknown>;
  subjectsJson: Array<Record<string, unknown>>;
  rawRowJson?: Record<string, unknown>;
  uploadedBatchId?: string;
  uploadedBy?: string;
};

export type CreateBatchInput = {
  departmentCode: string;
  academicYear: string;
  semester: string;
  stage: string;
  studyType: string;
  attempt: string;
  fileName: string;
  fileHash?: string | null;
  rowsCount: number;
  importedCount?: number;
  skippedCount?: number;
  metaSubjectsJson?: Record<string, unknown>;
  errorsJson?: Record<string, unknown>;
  createdBy?: string;
};

function mapResultRow(r: { [k: string]: unknown }): ResultRow {
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    departmentCode: String(r.department_code),
    academicYear: String(r.academic_year),
    semester: String(r.semester),
    stage: String(r.stage),
    studyType: String(r.study_type || ""),
    attempt: String(r.attempt),
    summaryJson: (r.summary_json as Record<string, unknown>) || (r.payload_json as Record<string, unknown>) || {},
    subjectsJson: (r.subjects_json as Array<Record<string, unknown>>) || [],
    rawRowJson: (r.raw_row_json as Record<string, unknown>) || (r.payload_json as Record<string, unknown>) || null,
    uploadedBatchId: r.uploaded_batch_id ? String(r.uploaded_batch_id) : null,
    uploadedAt: r.uploaded_at ? new Date(r.uploaded_at as string).toISOString() : "",
    uploadedBy: r.uploaded_by ? String(r.uploaded_by) : null,
  };
}

function mapBatchRow(r: { [k: string]: unknown }): ResultsBatchRow {
  return {
    id: String(r.id),
    departmentCode: String(r.department_code),
    academicYear: String(r.academic_year),
    semester: String(r.semester),
    stage: String(r.stage),
    studyType: String(r.study_type || ""),
    attempt: String(r.attempt),
    fileName: String(r.file_name),
    fileHash: r.file_hash ? String(r.file_hash) : null,
    rowsCount: Number(r.rows_count),
    importedCount: Number(r.imported_count || 0),
    skippedCount: Number(r.skipped_count || 0),
    metaSubjectsJson: r.meta_subjects_json ? (r.meta_subjects_json as Record<string, unknown>) : null,
    errorsJson: r.errors_json ? (r.errors_json as Record<string, unknown>) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    createdBy: r.created_by ? String(r.created_by) : null,
  };
}

export async function createResultsBatch(input: CreateBatchInput): Promise<string> {
  const res = await query(
    `INSERT INTO results_batches (department_code, academic_year, semester, stage, study_type, attempt, file_name, file_hash, rows_count, imported_count, skipped_count, meta_subjects_json, errors_json, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      input.departmentCode,
      input.academicYear,
      input.semester,
      input.stage,
      input.studyType,
      input.attempt,
      input.fileName,
      input.fileHash || null,
      input.rowsCount,
      input.importedCount || 0,
      input.skippedCount || 0,
      input.metaSubjectsJson ? JSON.stringify(input.metaSubjectsJson) : null,
      input.errorsJson ? JSON.stringify(input.errorsJson) : null,
      input.createdBy || null,
    ]
  );
  return String(res.rows[0].id);
}

export async function updateResultsBatch(
  batchId: string,
  updates: { importedCount?: number; skippedCount?: number; errorsJson?: Record<string, unknown> }
): Promise<void> {
  const updatesList: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.importedCount !== undefined) {
    updatesList.push(`imported_count = $${paramIndex}`);
    params.push(updates.importedCount);
    paramIndex++;
  }

  if (updates.skippedCount !== undefined) {
    updatesList.push(`skipped_count = $${paramIndex}`);
    params.push(updates.skippedCount);
    paramIndex++;
  }

  if (updates.errorsJson !== undefined) {
    updatesList.push(`errors_json = $${paramIndex}::jsonb`);
    params.push(JSON.stringify(updates.errorsJson));
    paramIndex++;
  }

  if (updatesList.length === 0) return;

  params.push(batchId);
  await query(
    `UPDATE results_batches SET ${updatesList.join(", ")} WHERE id = $${paramIndex}`,
    params
  );
}

export async function upsertResult(input: CreateResultInput): Promise<string> {
  const res = await query(
    `INSERT INTO results (student_id, department_code, academic_year, semester, stage, study_type, attempt, summary_json, subjects_json, raw_row_json, uploaded_batch_id, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (student_id, department_code, stage, study_type, academic_year, semester, attempt) DO UPDATE SET
       summary_json = EXCLUDED.summary_json,
       subjects_json = EXCLUDED.subjects_json,
       raw_row_json = EXCLUDED.raw_row_json,
       uploaded_batch_id = EXCLUDED.uploaded_batch_id,
       uploaded_by = EXCLUDED.uploaded_by,
       uploaded_at = NOW()
     RETURNING id`,
    [
      input.studentId,
      input.departmentCode,
      input.academicYear,
      input.semester,
      input.stage,
      input.studyType,
      input.attempt,
      JSON.stringify(input.summaryJson),
      JSON.stringify(input.subjectsJson),
      input.rawRowJson ? JSON.stringify(input.rawRowJson) : null,
      input.uploadedBatchId || null,
      input.uploadedBy || null,
    ]
  );
  return String(res.rows[0].id);
}

export async function getStudentResults(
  studentId: string,
  academicYear: string,
  semester: string,
  stage: string,
  studyType: string
): Promise<ResultRow[]> {
  const res = await query(
    `SELECT id, student_id, department_code, academic_year, semester, stage, study_type, attempt, 
            summary_json, subjects_json, raw_row_json, payload_json, uploaded_batch_id, uploaded_at, uploaded_by
     FROM results
     WHERE student_id = $1 AND academic_year = $2 AND semester = $3 AND stage = $4 AND study_type = $5
     ORDER BY attempt, uploaded_at DESC`,
    [studentId, academicYear, semester, stage, studyType]
  );
  return res.rows.map(mapResultRow);
}

/**
 * Get a single result by ID (for verification purposes)
 * This is used for QR Code verification - public read-only access
 */
export async function getResultById(resultId: string): Promise<ResultRow | null> {
  const res = await query(
    `SELECT id, student_id, department_code, academic_year, semester, stage, study_type, attempt, 
            summary_json, subjects_json, raw_row_json, payload_json, uploaded_batch_id, uploaded_at, uploaded_by
     FROM results
     WHERE id = $1 LIMIT 1`,
    [resultId]
  );
  if (res.rows.length === 0) return null;
  return mapResultRow(res.rows[0]);
}

export async function getResultWithStudentById(resultId: string): Promise<ResultAdminRow | null> {
  const res = await query(
    `SELECT r.id, r.student_id, r.department_code, r.academic_year, r.semester, r.stage, r.study_type, r.attempt,
            r.summary_json, r.subjects_json, r.raw_row_json, r.payload_json, r.uploaded_batch_id, r.uploaded_at, r.uploaded_by,
            s.full_name
     FROM results r
     LEFT JOIN students s ON s.student_id = r.student_id
     WHERE r.id = $1
     LIMIT 1`,
    [resultId]
  );
  if (res.rows.length === 0) return null;
  return {
    ...mapResultRow(res.rows[0]),
    studentName: res.rows[0].full_name ? String(res.rows[0].full_name) : null,
  };
}

export async function getResultsAdminList(input: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ results: ResultAdminRow[]; total: number }> {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 25)));
  const offset = (page - 1) * pageSize;
  const search = (input.search || "").trim();

  const params: unknown[] = [];
  let whereClause = "";
  if (search) {
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    whereClause = `WHERE r.student_id ILIKE $1 OR s.full_name ILIKE $2`;
  }

  const countRes = await query(
    `SELECT COUNT(*)::int AS total
     FROM results r
     LEFT JOIN students s ON s.student_id = r.student_id
     ${whereClause}`,
    params
  );
  const total = Number(countRes.rows[0]?.total || 0);

  const listParams = [...params, pageSize, offset];
  const res = await query(
    `SELECT r.id, r.student_id, r.department_code, r.academic_year, r.semester, r.stage, r.study_type, r.attempt,
            r.summary_json, r.subjects_json, r.raw_row_json, r.payload_json, r.uploaded_batch_id, r.uploaded_at, r.uploaded_by,
            s.full_name
     FROM results r
     LEFT JOIN students s ON s.student_id = r.student_id
     ${whereClause}
     ORDER BY r.uploaded_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  );

  return {
    total,
    results: res.rows.map((r) => ({
      ...mapResultRow(r),
      studentName: r.full_name ? String(r.full_name) : null,
    })),
  };
}

export async function updateResultSubjectsAndSummary(input: {
  resultId: string;
  subjectsJson: Array<Record<string, unknown>>;
  summaryJson: Record<string, unknown>;
  updatedBy?: string | null;
}): Promise<void> {
  await query(
    `UPDATE results
     SET subjects_json = $2::jsonb,
         summary_json = $3::jsonb,
         uploaded_by = COALESCE($4, uploaded_by),
         uploaded_at = NOW()
     WHERE id = $1`,
    [
      input.resultId,
      JSON.stringify(input.subjectsJson),
      JSON.stringify(input.summaryJson),
      input.updatedBy || null,
    ]
  );
}

/**
 * Secure function to get student results - validates session and financial clearance
 * Always derives student_id from session, never from query params
 * Returns 403 error if financial_clearance is false
 * 
 * SECURITY: This function ensures:
 * 1. student_id is ALWAYS derived from session (never from query params)
 * 2. Financial clearance is checked before returning results
 * 3. Student can only access their own results (enforced by using session.studentId)
 */
export async function getStudentResultsSecure(
  sessionStudentId: string,
  academicYear: string,
  semester: string
): Promise<{ results: ResultRow[]; error?: never } | { results?: never; error: { code: number; message: string } }> {
  // CRITICAL SECURITY: Always use student_id from session, never from query params
  // Get student record to verify financial clearance and get stage/study_type
  const { getStudentById } = await import("./studentsRepo");
  const student = await getStudentById(sessionStudentId);
  
  if (!student) {
    return {
      error: {
        code: 404,
        message: "الطالب غير موجود",
      },
    };
  }

  // SECURITY CHECK: Verify financial clearance before returning results
  if (!student.financialClearance) {
    return {
      error: {
        code: 403,
        message: "الحساب المالي غير مسدد",
      },
    };
  }

  // Verify study_type exists
  if (!student.studyType) {
    return {
      error: {
        code: 400,
        message: "نوع الدراسة غير محدد",
      },
    };
  }

  // Fetch results using session student_id (secure - ensures student can only access their own results)
  const results = await getStudentResults(
    sessionStudentId, // Always from session, never from params
    academicYear,
    semester,
    student.stage,
    student.studyType
  );

  return { results };
}

export async function getAllBatches(): Promise<ResultsBatchRow[]> {
  const res = await query(
    `SELECT id, department_code, academic_year, semester, stage, study_type, attempt, file_name, file_hash,
            rows_count, imported_count, skipped_count, meta_subjects_json, errors_json, created_at, created_by
     FROM results_batches
     ORDER BY created_at DESC`
  );
  return res.rows.map(mapBatchRow);
}

export async function getBatchById(batchId: string): Promise<ResultsBatchRow | null> {
  const res = await query(
    `SELECT id, department_code, academic_year, semester, stage, study_type, attempt, file_name, file_hash,
            rows_count, imported_count, skipped_count, meta_subjects_json, errors_json, created_at, created_by
     FROM results_batches
     WHERE id = $1`,
    [batchId]
  );
  if (res.rows.length === 0) return null;
  return mapBatchRow(res.rows[0]);
}

export async function findBatchByHash(
  departmentCode: string,
  attempt: string,
  academicYear: string,
  semester: string,
  fileHash: string
): Promise<ResultsBatchRow | null> {
  const res = await query(
    `SELECT id, department_code, academic_year, semester, stage, study_type, attempt, file_name, file_hash,
            rows_count, imported_count, skipped_count, meta_subjects_json, errors_json, created_at, created_by
     FROM results_batches
     WHERE department_code = $1 AND attempt = $2 AND academic_year = $3 AND semester = $4 AND file_hash = $5
     ORDER BY created_at DESC
     LIMIT 1`,
    [departmentCode, attempt, academicYear, semester, fileHash]
  );
  if (res.rows.length === 0) return null;
  return mapBatchRow(res.rows[0]);
}

/**
 * Delete a batch and ALL related results
 * عند حذف الاستيراد يتم حذف سجلات النتائج المستوردة لتجنب التراكم والتداخل
 */
export async function deleteBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, delete all results that were imported in this batch
    await query(
      `DELETE FROM results WHERE uploaded_batch_id = $1`,
      [batchId]
    );

    // Then delete the batch record
    const res = await query(
      `DELETE FROM results_batches WHERE id = $1 RETURNING id`,
      [batchId]
    );

    if (res.rows.length === 0) {
      return { success: false, error: "الاستيراد غير موجود" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting batch:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف الاستيراد" 
    };
  }
}

/**
 * حذف سجلات النتائج اليتيمة (التي لا ترتبط بأي دفعة استيراد)
 */
export async function deleteOrphanedResults(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const res = await query(
      `DELETE FROM results WHERE uploaded_batch_id IS NULL RETURNING id`
    );
    return { success: true, deletedCount: res.rowCount ?? 0 };
  } catch (error) {
    console.error("Error deleting orphaned results:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف السجلات",
    };
  }
}

export async function getOrphanedResultsCount(): Promise<number> {
  const res = await query(
    `SELECT COUNT(*) AS cnt FROM results WHERE uploaded_batch_id IS NULL`
  );
  return parseInt(res.rows[0]?.cnt ?? "0", 10);
}

export type ResultsStats = {
  totalUploads: number;
  uploadedDepartments: number;
  totalImportedStudents: number;
  lastUpload: {
    createdAt: string;
    fileName: string;
    departmentCode: string;
    importedCount: number;
  } | null;
};

export async function getResultsStats(): Promise<ResultsStats> {
  const batchesRes = await query(
    `SELECT 
       COUNT(*) as total_uploads,
       COUNT(DISTINCT department_code) as uploaded_departments,
       COALESCE(SUM(imported_count), 0) as total_imported,
       MAX(created_at) as last_upload_at
     FROM results_batches`
  );

  const stats = batchesRes.rows[0];
  const totalUploads = Number(stats.total_uploads || 0);
  const uploadedDepartments = Number(stats.uploaded_departments || 0);
  const totalImportedStudents = Number(stats.total_imported || 0);

  let lastUpload = null;
  if (stats.last_upload_at) {
    const lastBatchRes = await query(
      `SELECT created_at, file_name, department_code, imported_count
       FROM results_batches
       WHERE created_at = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [stats.last_upload_at]
    );
    if (lastBatchRes.rows.length > 0) {
      const lastBatch = lastBatchRes.rows[0];
      lastUpload = {
        createdAt: new Date(lastBatch.created_at as string).toISOString(),
        fileName: String(lastBatch.file_name),
        departmentCode: String(lastBatch.department_code),
        importedCount: Number(lastBatch.imported_count || 0),
      };
    }
  }

  return {
    totalUploads,
    uploadedDepartments,
    totalImportedStudents,
    lastUpload,
  };
}
