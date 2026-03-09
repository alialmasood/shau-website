import { query } from "./db";

export type StudentAccountsBatchRow = {
  id: string;
  departmentCode: string;
  fileName: string;
  fileHash: string | null;
  rowsCount: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorsJson: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
};

export type CreateStudentAccountsBatchInput = {
  departmentCode: string;
  fileName: string;
  fileHash?: string | null;
  rowsCount: number;
  importedCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  errorsJson?: Record<string, unknown> | null;
  createdBy?: string | null;
};

function mapBatchRow(r: { [k: string]: unknown }): StudentAccountsBatchRow {
  return {
    id: String(r.id),
    departmentCode: String(r.department_code),
    fileName: String(r.file_name),
    fileHash: r.file_hash ? String(r.file_hash) : null,
    rowsCount: Number(r.rows_count),
    importedCount: Number(r.imported_count || 0),
    updatedCount: Number(r.updated_count || 0),
    skippedCount: Number(r.skipped_count || 0),
    errorsJson: r.errors_json ? (r.errors_json as Record<string, unknown>) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    createdBy: r.created_by ? String(r.created_by) : null,
  };
}

export async function createStudentAccountsBatch(input: CreateStudentAccountsBatchInput): Promise<string> {
  const res = await query(
    `INSERT INTO student_accounts_batches (department_code, file_name, file_hash, rows_count, imported_count, updated_count, skipped_count, errors_json, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      input.departmentCode,
      input.fileName,
      input.fileHash || null,
      input.rowsCount,
      input.importedCount || 0,
      input.updatedCount || 0,
      input.skippedCount || 0,
      input.errorsJson ? JSON.stringify(input.errorsJson) : null,
      input.createdBy || null,
    ]
  );
  return String(res.rows[0].id);
}

export async function updateStudentAccountsBatch(
  batchId: string,
  updates: { 
    importedCount?: number; 
    updatedCount?: number;
    skippedCount?: number; 
    errorsJson?: Record<string, unknown> 
  }
): Promise<void> {
  const updatesList: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.importedCount !== undefined) {
    updatesList.push(`imported_count = $${paramIndex++}`);
    params.push(updates.importedCount);
  }
  if (updates.updatedCount !== undefined) {
    updatesList.push(`updated_count = $${paramIndex++}`);
    params.push(updates.updatedCount);
  }
  if (updates.skippedCount !== undefined) {
    updatesList.push(`skipped_count = $${paramIndex++}`);
    params.push(updates.skippedCount);
  }
  if (updates.errorsJson !== undefined) {
    updatesList.push(`errors_json = $${paramIndex++}`);
    params.push(updates.errorsJson ? JSON.stringify(updates.errorsJson) : null);
  }

  if (updatesList.length === 0) return;

  params.push(batchId);
  await query(
    `UPDATE student_accounts_batches SET ${updatesList.join(", ")} WHERE id = $${paramIndex}`,
    params
  );
}

export async function getAllStudentAccountsBatches(): Promise<StudentAccountsBatchRow[]> {
  const res = await query(
    `SELECT id, department_code, file_name, file_hash, rows_count, imported_count, updated_count, skipped_count, errors_json, created_at, created_by
     FROM student_accounts_batches
     ORDER BY created_at DESC`
  );
  return res.rows.map(mapBatchRow);
}

export async function getStudentAccountsBatchById(batchId: string): Promise<StudentAccountsBatchRow | null> {
  const res = await query(
    `SELECT id, department_code, file_name, file_hash, rows_count, imported_count, updated_count, skipped_count, errors_json, created_at, created_by
     FROM student_accounts_batches
     WHERE id = $1`,
    [batchId]
  );
  if (res.rows.length === 0) return null;
  return mapBatchRow(res.rows[0]);
}

export async function findStudentAccountsBatchByHash(
  departmentCode: string,
  fileHash: string
): Promise<StudentAccountsBatchRow | null> {
  const res = await query(
    `SELECT id, department_code, file_name, file_hash, rows_count, imported_count, updated_count, skipped_count, errors_json, created_at, created_by
     FROM student_accounts_batches
     WHERE department_code = $1 AND file_hash = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [departmentCode, fileHash]
  );
  if (res.rows.length === 0) return null;
  return mapBatchRow(res.rows[0]);
}

export async function deleteStudentAccountsBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, DELETE all student accounts that were imported in this batch
    await query(
      `DELETE FROM student_users WHERE uploaded_batch_id = $1`,
      [batchId]
    );

    // Then delete the batch record
    const res = await query(
      `DELETE FROM student_accounts_batches WHERE id = $1 RETURNING id`,
      [batchId]
    );

    if (res.rows.length === 0) {
      return { success: false, error: "الاستيراد غير موجود" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting student accounts batch:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف الاستيراد" 
    };
  }
}

/**
 * حذف حسابات الطلاب اليتيمة (التي تشير لدفعات محذوفة)
 */
export async function deleteOrphanedStudentAccounts(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const res = await query(
      `DELETE FROM student_users 
       WHERE uploaded_batch_id IS NOT NULL 
       AND uploaded_batch_id NOT IN (SELECT id FROM student_accounts_batches)
       RETURNING id`
    );
    return { success: true, deletedCount: res.rowCount ?? 0 };
  } catch (error) {
    console.error("Error deleting orphaned student accounts:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف السجلات",
    };
  }
}

export async function getOrphanedStudentAccountsCount(): Promise<number> {
  const res = await query(
    `SELECT COUNT(*) AS cnt FROM student_users 
     WHERE uploaded_batch_id IS NOT NULL 
     AND uploaded_batch_id NOT IN (SELECT id FROM student_accounts_batches)`
  );
  return parseInt(res.rows[0]?.cnt ?? "0", 10);
}
