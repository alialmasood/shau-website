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
  page?: number;
  pageSize?: number;
}): Promise<{ students: StudentRow[]; total: number }> {
  // Build WHERE clause
  let whereSql = `WHERE 1=1`;
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.departmentCode) {
    whereSql += ` AND department_code = $${paramIndex++}`;
    params.push(filters.departmentCode);
  }
  if (filters?.stage) {
    whereSql += ` AND stage = $${paramIndex++}`;
    params.push(filters.stage);
  }
  if (filters?.studyType) {
    whereSql += ` AND study_type = $${paramIndex++}`;
    params.push(filters.studyType);
  }
  if (filters?.financialClearance !== undefined) {
    whereSql += ` AND financial_clearance = $${paramIndex++}`;
    params.push(filters.financialClearance);
  }
  if (filters?.search) {
    whereSql += ` AND (full_name ILIKE $${paramIndex} OR student_id ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM students ${whereSql}`;
  const countRes = await query(countSql, params);
  const total = Number(countRes.rows[0]?.total || 0);

  // Get paginated results
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  let dataSql = `SELECT id, student_id, full_name, department_code, stage, study_type, academic_year, semester, 
                        financial_clearance, clearance_updated_at, clearance_updated_by, created_at, updated_at, updated_by
                 FROM students ${whereSql}
                 ORDER BY updated_at DESC, created_at DESC`;
  
  // Always add pagination (default pageSize = 25)
  dataSql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(pageSize, offset);

  console.log(`📊 getAllStudents query: page=${page}, pageSize=${pageSize}, total=${total}, whereSql=${whereSql}`);
  
  const res = await query(dataSql, params);
  
  console.log(`✅ getAllStudents returned ${res.rows.length} rows out of ${total} total`);
  
  return {
    students: res.rows.map(mapRow),
    total,
  };
}
