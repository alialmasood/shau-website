"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { upsertStudent } from "@/lib/studentsRepo";
import { createStudentUser, getAllStudentUsers, resetStudentPassword, toggleStudentUserActive } from "@/lib/studentUsersRepo";
import { createStudentAccountsBatch, updateStudentAccountsBatch, findStudentAccountsBatchByHash, getAllStudentAccountsBatches, deleteStudentAccountsBatch } from "@/lib/studentAccountsBatchesRepo";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";

function generateRandomPassword(length: number = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

type ImportRow = {
  studentId: string;
  fullName: string;
  username?: string;
  password?: string;
};

type ImportResult = {
  success: boolean;
  error?: string;
  imported: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
  credentials: Array<{ studentId: string; username: string; password: string }>;
  generatedCredentials: Array<{ studentId: string; fullName: string; username: string; tempPassword: string }>;
};

export async function importStudentAccounts(
  fileBase64: string,
  fileName: string,
  departmentCode: string,
  forceReimport: boolean = false
): Promise<ImportResult> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لاستيراد حسابات الطلاب");
  }

  try {
    const fileBuffer = Buffer.from(fileBase64, "base64");
    
    // Calculate file hash (SHA-256) for duplicate detection
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
    console.log(`🔐 File hash (SHA-256): ${fileHash}`);

    // Check for duplicate batch (same department, file_hash)
    if (!forceReimport) {
      const existingBatch = await findStudentAccountsBatchByHash(departmentCode, fileHash);
      
      if (existingBatch) {
        return {
          success: false,
          error: "DUPLICATE_FILE",
          imported: 0,
          updated: 0,
          errors: [`تم استيراد هذا الملف مسبقاً في ${new Date(existingBatch.createdAt).toLocaleDateString("ar-IQ")}`],
          credentials: [],
          generatedCredentials: [],
        };
      }
    }

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];
    
    if (rows.length < 2) {
      return {
        success: false,
        error: "الملف فارغ أو لا يحتوي على بيانات",
        imported: 0,
        updated: 0,
        errors: [],
        credentials: [],
        generatedCredentials: [],
      };
    }

    // Find header row
    let headerRowIndex = -1;
    let headerMap = new Map<string, number>();
    
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      const normalizedRow = row.map((cell: any) => String(cell ?? "").trim().toLowerCase());
      if (normalizedRow.includes("student_id") && normalizedRow.includes("full_name")) {
        headerRowIndex = i;
        row.forEach((cell: any, colIndex: number) => {
          const header = String(cell ?? "").trim().toLowerCase();
          if (header) {
            headerMap.set(header, colIndex);
            headerMap.set(header.replace(/_/g, ""), colIndex);
          }
        });
        break;
      }
    }

    if (headerRowIndex === -1) {
      return {
        success: false,
        error: "لم يتم العثور على صف الرؤوس (يجب أن يحتوي على student_id و full_name)",
        imported: 0,
        updated: 0,
        errors: [],
        credentials: [],
        generatedCredentials: [],
      };
    }

    const dataRows = rows.slice(headerRowIndex + 1);
    const records: ImportRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    dataRows.forEach((row, index) => {
      const rowNum = headerRowIndex + 2 + index;
      const getValue = (key: string): string => {
        const colIndex = headerMap.get(key) ?? headerMap.get(key.replace(/_/g, ""));
        if (colIndex === undefined) return "";
        return String(row[colIndex] ?? "").trim();
      };

      const studentId = getValue("student_id");
      const fullName = getValue("full_name");
      const username = getValue("username");
      const password = getValue("password");

      if (!studentId || !fullName) {
        errors.push({ row: rowNum, error: "student_id أو full_name مفقود" });
        return;
      }

      records.push({
        studentId,
        fullName,
        username: username || undefined,
        password: password || undefined,
      });
    });

    if (records.length === 0) {
      return {
        success: false,
        error: "لا توجد سجلات صالحة للاستيراد",
        imported: 0,
        updated: 0,
        errors,
        credentials: [],
        generatedCredentials: [],
      };
    }

    // Create batch (before processing rows)
    const batchId = await createStudentAccountsBatch({
      departmentCode,
      fileName,
      fileHash,
      rowsCount: records.length,
      importedCount: 0, // Will be updated after processing
      updatedCount: 0,
      skippedCount: errors.length,
      errorsJson: errors.length > 0 
        ? { errors: errors.map((e) => ({ row: e.row, error: e.error })) } 
        : undefined,
      createdBy: currentUser.id,
    });

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const credentials: Array<{ studentId: string; username: string; password: string }> = [];
    const generatedCredentials: Array<{ studentId: string; fullName: string; username: string; tempPassword: string }> = [];

    // Process each record
    for (const record of records) {
      try {
        // Upsert student (we need department_code, stage, study_type - use defaults or from existing)
        const existingStudent = await query(
          `SELECT department_code, stage, study_type FROM students WHERE student_id = $1`,
          [record.studentId]
        );

        const departmentCode = existingStudent.rows.length > 0 
          ? String(existingStudent.rows[0].department_code)
          : "DENTAL_TECH"; // Default
        const stage = existingStudent.rows.length > 0
          ? String(existingStudent.rows[0].stage)
          : "المرحلة الأولى"; // Default
        const studyType = existingStudent.rows.length > 0
          ? String(existingStudent.rows[0].study_type || "")
          : "صباحي"; // Default

        // Upsert student - IMPORTANT: Do NOT update department_code on conflict
        // This preserves existing department data when importing different departments
        await upsertStudent({
          studentId: record.studentId,
          fullName: record.fullName,
          departmentCode, // Will be used for new students, but not updated for existing ones
          stage,
          studyType,
          academicYear: ACADEMIC_YEAR,
          semester: SEMESTER,
        });

        // Determine username and password
        const username = record.username || record.studentId;
        const passwordWasGenerated = !record.password;
        const password = record.password || generateRandomPassword();

        // Check if user exists (by username OR student_id - both are unique)
        const existingUser = await query(
          `SELECT id, username, student_id FROM student_users WHERE username = $1 OR student_id = $2`,
          [username, record.studentId]
        );

        if (existingUser.rows.length > 0) {
          // Update existing user
          const hashedPassword = await bcrypt.hash(password, 10);
          const updateRes = await query(
            `UPDATE student_users 
             SET password_hash = $1, 
                 must_change_password = $2, 
                 username = $3,
                 uploaded_batch_id = $4,
                 updated_at = NOW() 
             WHERE student_id = $5
             RETURNING id`,
            [hashedPassword, passwordWasGenerated, username, batchId, record.studentId]
          );
          console.log(`[importStudentAccounts] Updated user: student_id=${record.studentId}, username=${username}, rows=${updateRes.rows.length}`);
          updated++;
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(password, 10);
          const insertRes = await query(
            `INSERT INTO student_users (username, password_hash, student_id, must_change_password, uploaded_batch_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [username, hashedPassword, record.studentId, passwordWasGenerated, batchId]
          );
          console.log(`[importStudentAccounts] Created user: student_id=${record.studentId}, username=${username}, id=${insertRes.rows[0]?.id}`);
          imported++;
        }

        credentials.push({
          studentId: record.studentId,
          username,
          password,
        });

        // Store generated credentials for CSV export (only if password was generated)
        if (passwordWasGenerated) {
          generatedCredentials.push({
            studentId: record.studentId,
            fullName: record.fullName,
            username,
            tempPassword: password,
          });
        }
      } catch (error) {
        skipped++;
        errors.push({
          row: records.indexOf(record) + headerRowIndex + 2,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        });
      }
    }

    // Update batch with final counts
    await updateStudentAccountsBatch(batchId, {
      importedCount: imported,
      updatedCount: updated,
      skippedCount: skipped + errors.length,
      errorsJson: errors.length > 0 
        ? { errors: errors.map((e) => ({ row: e.row, error: e.error })) } 
        : undefined,
    });

    // Revalidate the page
    revalidatePath("/admin/student-accounts");

    return {
      success: true,
      imported,
      updated,
      errors,
      credentials,
      generatedCredentials,
    };
  } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ أثناء الاستيراد",
        imported: 0,
        updated: 0,
        errors: [],
        credentials: [],
        generatedCredentials: [],
      };
  }
}

export async function getStudentAccounts(batchId?: string) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لعرض حسابات الطلاب");
  }

  const users = await getAllStudentUsers({ batchId });
  console.log(`[getStudentAccounts] Retrieved ${users.length} users from getAllStudentUsers()${batchId ? ` (filtered by batch: ${batchId})` : ""}`);
  
  // Get student info for each user
  const accountsWithStudent = await Promise.all(
    users.map(async (user) => {
      const studentRes = await query(
        `SELECT full_name FROM students WHERE student_id = $1`,
        [user.studentId]
      );
      const fullName = studentRes.rows.length > 0 
        ? String(studentRes.rows[0].full_name)
        : "غير معروف";
      return { ...user, fullName };
    })
  );

  console.log(`[getStudentAccounts] Returning ${accountsWithStudent.length} accounts with student info`);
  return accountsWithStudent;
}

export async function getStudentAccountsStats() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لعرض الإحصائيات");
  }

  const { getStudentUsersCount } = await import("@/lib/studentUsersRepo");
  
  const [studentUsersCount, studentsCount] = await Promise.all([
    getStudentUsersCount(),
    query(`SELECT COUNT(*) as count FROM students`).then(res => Number(res.rows[0]?.count || 0)),
  ]);

  return {
    studentUsersCount,
    studentsCount,
  };
}

export async function resetPasswordAction(username: string): Promise<{ success: boolean; password?: string; error?: string }> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لإعادة تعيين كلمة المرور" };
  }

  try {
    const newPassword = generateRandomPassword();
    await resetStudentPassword(username, newPassword);
    return { success: true, password: newPassword };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء إعادة تعيين كلمة المرور",
    };
  }
}

export async function toggleActiveAction(username: string): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لتغيير حالة الحساب" };
  }

  try {
    const isActive = await toggleStudentUserActive(username);
    return { success: true, isActive };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تغيير حالة الحساب",
    };
  }
}

export async function deleteStudentAccountsBatchAction(batchId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لحذف الاستيرادات" };
  }

  const result = await deleteStudentAccountsBatch(batchId);
  
  if (result.success) {
    revalidatePath("/admin/student-accounts");
  }

  return result;
}

export async function bulkResetPasswords(): Promise<{ 
  success: boolean; 
  error?: string; 
  credentials?: Array<{ studentId: string; fullName: string; username: string; tempPassword: string }> 
}> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (currentUser.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لإعادة تعيين كلمات المرور" };
  }

  try {
    // Get all student users
    const usersRes = await query(
      `SELECT su.student_id, su.username, s.full_name
       FROM student_users su
       LEFT JOIN students s ON s.student_id = su.student_id
       ORDER BY su.created_at DESC`
    );

    const credentials: Array<{ studentId: string; fullName: string; username: string; tempPassword: string }> = [];

    for (const row of usersRes.rows) {
      const studentId = String(row.student_id);
      const username = String(row.username);
      const fullName = String(row.full_name || "غير معروف");
      const tempPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await query(
        `UPDATE student_users 
         SET password_hash = $1, 
             must_change_password = true, 
             updated_at = NOW() 
         WHERE student_id = $2`,
        [hashedPassword, studentId]
      );

      credentials.push({
        studentId,
        fullName,
        username,
        tempPassword,
      });
    }

    return {
      success: true,
      credentials,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء إعادة تعيين كلمات المرور",
    };
  }
}
