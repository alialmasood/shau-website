import { query } from "./db";

export type StudentRow = {
  id: string;
  studentId: string;
  fullName: string;
  departmentCode: string;
  stage: string;
  studyType: string;
  academicYear: string;
  semester: string;
  financialClearance: boolean;
  clearanceUpdatedAt: string | null;
  clearanceUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type CreateStudentInput = {
  studentId: string;
  fullName: string;
  departmentCode: string;
  stage: string;
  studyType: string;
  academicYear: string;
  semester: string;
  financialClearance?: boolean;
};

export type UpdateStudentInput = {
  studentId: string;
  financialClearance?: boolean;
  updatedBy?: string;
  clearanceUpdatedBy?: string;
};

function mapRow(r: { [k: string]: unknown }): StudentRow {
  return {
    id: String(r.id),
    studentId: String(r.student_id),
    fullName: String(r.full_name),
    departmentCode: String(r.department_code),
    stage: String(r.stage),
    studyType: String(r.study_type || ""),
    academicYear: String(r.academic_year),
    semester: String(r.semester),
    financialClearance: Boolean(r.financial_clearance),
    clearanceUpdatedAt: r.clearance_updated_at ? new Date(r.clearance_updated_at as string).toISOString() : null,
    clearanceUpdatedBy: r.clearance_updated_by ? String(r.clearance_updated_by) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
    updatedBy: r.updated_by ? String(r.updated_by) : null,
  };
}

export async function getStudentById(studentId: string): Promise<StudentRow | null> {
  const s = String(studentId || "").trim();
  if (!s) return null;
  const res = await query(
    `SELECT id, student_id, full_name, department_code, stage, study_type, academic_year, semester, 
            financial_clearance, clearance_updated_at, clearance_updated_by, created_at, updated_at, updated_by
     FROM students WHERE student_id = $1 LIMIT 1`,
    [s]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export async function upsertStudent(input: CreateStudentInput): Promise<string> {
  const res = await query(
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
     RETURNING id`,
    [
      input.studentId,
      input.fullName,
      input.departmentCode,
      input.stage,
      input.studyType,
      input.academicYear,
      input.semester,
      input.financialClearance ?? false,
    ]
  );
  return String(res.rows[0].id);
}

export async function updateStudentFinancialClearance(
  studentId: string,
  financialClearance: boolean,
  updatedBy: string
): Promise<boolean> {
  const res = await query(
    `UPDATE students 
     SET financial_clearance = $1, 
         clearance_updated_by = $2, 
         clearance_updated_at = NOW(),
         updated_by = $2, 
         updated_at = NOW()
     WHERE student_id = $3
     RETURNING id`,
    [financialClearance, updatedBy, studentId]
  );
  return res.rows.length > 0;
}

export async function getAllStudents(filters?: {
  departmentCode?: string;
  stage?: string;
  studyType?: string;
  financialClearance?: boolean;
  search?: string;
  batchId?: string; // Filter by batch ID - show only students imported in this batch
  page?: number;
  pageSize?: number;
}): Promise<{ students: StudentRow[]; total: number }> {
  // IMPORTANT: We need to show students from RESULTS table, not just STUDENTS table
  // Because the same student can have results in different departments
  // We'll join students with results to get all unique (student_id, department_code) combinations
  
  // Build WHERE clause for results and students together
  let whereSql = `WHERE r.student_id = s.student_id`;
  const params: unknown[] = [];
  let paramIndex = 1;

  // If batchId is provided, filter by students who have results in that batch
  if (filters?.batchId) {
    whereSql += ` AND r.uploaded_batch_id = $${paramIndex++}`;
    params.push(filters.batchId);
  }

  if (filters?.departmentCode) {
    whereSql += ` AND r.department_code = $${paramIndex++}`;
    params.push(filters.departmentCode);
  }
  if (filters?.stage) {
    whereSql += ` AND r.stage = $${paramIndex++}`;
    params.push(filters.stage);
  }
  if (filters?.studyType) {
    whereSql += ` AND r.study_type = $${paramIndex++}`;
    params.push(filters.studyType);
  }

  if (filters?.financialClearance !== undefined) {
    whereSql += ` AND s.financial_clearance = $${paramIndex++}`;
    params.push(filters.financialClearance);
  }
  if (filters?.search) {
    whereSql += ` AND (s.full_name ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Get total count: Count distinct (student_id, department_code) from results
  const countSql = `
    SELECT COUNT(DISTINCT r.student_id || '|' || r.department_code) as total
    FROM results r
    INNER JOIN students s ON r.student_id = s.student_id
    ${whereSql}
  `;
  const countRes = await query(countSql, params);
  const total = Number(countRes.rows[0]?.total || 0);

  // Get paginated results
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Get distinct students with their department from results
  // Use the department_code from results (not from students table) to show all departments
  let dataSql = `
    SELECT DISTINCT ON (r.student_id, r.department_code)
      s.id,
      r.student_id,
      s.full_name,
      r.department_code,  -- Use department_code from results, not students
      r.stage,
      r.study_type,
      r.academic_year,
      r.semester,
      s.financial_clearance,
      s.clearance_updated_at,
      s.clearance_updated_by,
      s.created_at,
      s.updated_at,
      s.updated_by
    FROM results r
    INNER JOIN students s ON r.student_id = s.student_id
    ${whereSql}
    ORDER BY r.student_id, r.department_code, r.uploaded_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  const dataParams = [...params, pageSize, offset];

  console.log(`📊 getAllStudents query: page=${page}, pageSize=${pageSize}, total=${total}, batchId=${filters?.batchId || "none"}, departmentCode=${filters?.departmentCode || "all"}`);
  
  const res = await query(dataSql, dataParams);
  
  console.log(`✅ getAllStudents returned ${res.rows.length} rows out of ${total} total`);
  
  return {
    students: res.rows.map(mapRow),
    total,
  };
}
