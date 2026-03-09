import bcrypt from "bcryptjs";
import { query } from "./db";

export type StudentUserRow = {
  id: string;
  username: string;
  passwordHash: string;
  studentId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudentUserInput = {
  username: string;
  password: string;
  studentId: string;
};

function mapRow(r: { [k: string]: unknown }): StudentUserRow {
  return {
    id: String(r.id),
    username: String(r.username),
    passwordHash: String(r.password_hash),
    studentId: String(r.student_id),
    isActive: Boolean(r.is_active),
    mustChangePassword: Boolean(r.must_change_password || false),
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at as string).toISOString() : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function getStudentUserByUsername(username: string): Promise<StudentUserRow | null> {
  const s = String(username || "").trim();
  if (!s) return null;
  const res = await query(
    `SELECT id, username, password_hash, student_id, is_active, must_change_password, last_login_at, created_at, updated_at
     FROM student_users WHERE username = $1 LIMIT 1`,
    [s]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export async function getStudentUserByStudentId(studentId: string): Promise<StudentUserRow | null> {
  const s = String(studentId || "").trim();
  if (!s) return null;
  const res = await query(
    `SELECT id, username, password_hash, student_id, is_active, must_change_password, last_login_at, created_at, updated_at
     FROM student_users WHERE student_id = $1 LIMIT 1`,
    [s]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export async function createStudentUser(input: CreateStudentUserInput & { mustChangePassword?: boolean }): Promise<string> {
  const hashedPassword = await bcrypt.hash(input.password, 10);
  const res = await query(
    `INSERT INTO student_users (username, password_hash, student_id, must_change_password)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.username, hashedPassword, input.studentId, input.mustChangePassword || false]
  );
  return String(res.rows[0].id);
}

export async function updateStudentUserLastLogin(username: string): Promise<void> {
  await query(
    `UPDATE student_users SET last_login_at = NOW() WHERE username = $1`,
    [username]
  );
}

export async function resetStudentPassword(username: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query(
    `UPDATE student_users SET password_hash = $1, must_change_password = true, updated_at = NOW() WHERE username = $2`,
    [hashedPassword, username]
  );
}

/**
 * Update student password - used for change password flow
 * Verifies current password, updates to new password, and clears must_change_password flag
 */
export async function updateStudentPassword(
  studentId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Get user by student_id (from session)
  const user = await getStudentUserByStudentId(studentId);
  if (!user || !user.isActive) {
    return { success: false, error: "الحساب غير موجود أو غير مفعل" };
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "كلمة المرور الحالية غير صحيحة" };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear must_change_password flag
  await query(
    `UPDATE student_users 
     SET password_hash = $1, must_change_password = false, updated_at = NOW() 
     WHERE student_id = $2`,
    [hashedPassword, studentId]
  );

  return { success: true };
}

export async function toggleStudentUserActive(username: string): Promise<boolean> {
  const res = await query(
    `UPDATE student_users SET is_active = NOT is_active WHERE username = $1 RETURNING is_active`,
    [username]
  );
  return res.rows.length > 0 ? Boolean(res.rows[0].is_active) : false;
}

export async function getAllStudentUsers(filters?: {
  batchId?: string; // Filter by batch ID - show only users imported in this batch
}): Promise<StudentUserRow[]> {
  let whereSql = `WHERE 1=1`;
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.batchId) {
    whereSql += ` AND uploaded_batch_id = $${paramIndex++}`;
    params.push(filters.batchId);
  } else {
    // Show only accounts that belong to existing imports (exclude orphaned accounts)
    whereSql += ` AND uploaded_batch_id IS NOT NULL AND uploaded_batch_id IN (SELECT id FROM student_accounts_batches)`;
  }

  const res = await query(
    `SELECT id, username, password_hash, student_id, is_active, must_change_password, last_login_at, created_at, updated_at
     FROM student_users
     ${whereSql}
     ORDER BY created_at DESC`,
    params
  );
  console.log(`[getAllStudentUsers] Found ${res.rows.length} student users in database${filters?.batchId ? ` (filtered by batch: ${filters.batchId})` : ""}`);
  return res.rows.map(mapRow);
}

export async function getStudentUsersCount(): Promise<number> {
  const res = await query(`SELECT COUNT(*) as count FROM student_users`);
  return Number(res.rows[0]?.count || 0);
}

export async function verifyStudentCredentials(
  username: string,
  password: string,
  studentId: string
): Promise<StudentUserRow | null> {
  const user = await getStudentUserByUsername(username);
  if (!user || !user.isActive) return null;
  
  // التحقق من student_id
  if (user.studentId !== studentId) return null;
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}
