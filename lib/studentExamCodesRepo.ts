import { query } from "./db";

export type StudentExamCodeRow = {
  id: string;
  code: string;
  nameAr: string;
  department: string;
  stage: string;
  studyType: string;
  createdAt: string;
  updatedAt: string;
};

const CODE_MIN = 10000;
const CODE_MAX = 99999;
const MAX_ATTEMPTS = 50;

function mapRow(r: { [k: string]: unknown }): StudentExamCodeRow {
  return {
    id: String(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
    department: String(r.department),
    stage: String(r.stage),
    studyType: String(r.study_type),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

/** توليد كود 5 أرقام فريد (لا يتكرر في الجدول) */
export async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = String(Math.floor(CODE_MIN + Math.random() * (CODE_MAX - CODE_MIN + 1)));
    const res = await query(
      `SELECT 1 FROM student_exam_codes WHERE code = $1 LIMIT 1`,
      [code]
    );
    if (res.rows.length === 0) return code;
  }
  throw new Error("تعذر توليد كود فريد بعد عدة محاولات");
}

export async function insertStudentExamCode(row: {
  code: string;
  nameAr: string;
  department: string;
  stage: string;
  studyType: string;
}): Promise<StudentExamCodeRow> {
  const res = await query(
    `INSERT INTO student_exam_codes (code, name_ar, department, stage, study_type, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, code, name_ar, department, stage, study_type, created_at, updated_at`,
    [row.code, row.nameAr, row.department, row.stage, row.studyType]
  );
  return mapRow(res.rows[0]);
}

export async function getStudentExamCodeById(id: string): Promise<StudentExamCodeRow | null> {
  const res = await query(
    `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
     FROM student_exam_codes WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function getStudentExamCodeByCode(code: string): Promise<StudentExamCodeRow | null> {
  const c = String(code || "").trim();
  if (!c) return null;
  const res = await query(
    `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
     FROM student_exam_codes WHERE code = $1 LIMIT 1`,
    [c]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

/** جلب كود الامتحان التجريبي للطالب بالاسم (وع optional القسم) — لعرضه في لوحة الطالب */
export async function getExamCodeByStudentName(
  nameAr: string,
  departmentArabic?: string
): Promise<StudentExamCodeRow | null> {
  const name = String(nameAr ?? "").trim();
  if (!name) return null;
  const dept = departmentArabic ? String(departmentArabic).trim() : "";
  if (dept) {
    const res = await query(
      `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
       FROM student_exam_codes
       WHERE TRIM(name_ar) = $1 AND (department = $2 OR TRIM(department) = $2)
       LIMIT 1`,
      [name, dept]
    );
    if (res.rows.length > 0) return mapRow(res.rows[0]);
  }
  const res = await query(
    `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
     FROM student_exam_codes WHERE TRIM(name_ar) = $1 LIMIT 1`,
    [name]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function updateStudentExamCode(
  id: string,
  data: { nameAr?: string; department?: string; stage?: string; studyType?: string }
): Promise<StudentExamCodeRow | null> {
  const updates: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [];
  let idx = 1;
  if (data.nameAr !== undefined) {
    updates.push(`name_ar = $${idx++}`);
    params.push(data.nameAr);
  }
  if (data.department !== undefined) {
    updates.push(`department = $${idx++}`);
    params.push(data.department);
  }
  if (data.stage !== undefined) {
    updates.push(`stage = $${idx++}`);
    params.push(data.stage);
  }
  if (data.studyType !== undefined) {
    updates.push(`study_type = $${idx++}`);
    params.push(data.studyType);
  }
  if (params.length === 0) return getStudentExamCodeById(id);
  params.push(id);
  const res = await query(
    `UPDATE student_exam_codes SET ${updates.join(", ")} WHERE id = $${idx}
     RETURNING id, code, name_ar, department, stage, study_type, created_at, updated_at`,
    params
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function deleteStudentExamCode(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM student_exam_codes WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function deleteByDepartment(department: string): Promise<number> {
  const res = await query(`DELETE FROM student_exam_codes WHERE department = $1`, [department]);
  return res.rowCount ?? 0;
}

export async function deleteAll(): Promise<number> {
  const res = await query(`DELETE FROM student_exam_codes`);
  return res.rowCount ?? 0;
}

export async function getStudentExamCodesList(params: {
  limit?: number;
  offset?: number;
  department?: string;
  stage?: string;
  studyType?: string;
  search?: string;
}): Promise<StudentExamCodeRow[]> {
  const limit = Math.max(1, Math.min(500, params.limit ?? 100));
  const offset = Math.max(0, params.offset ?? 0);
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;
  if (params.department?.trim()) {
    conditions.push(`department = $${idx++}`);
    queryParams.push(params.department.trim());
  }
  if (params.stage?.trim()) {
    conditions.push(`stage = $${idx++}`);
    queryParams.push(params.stage.trim());
  }
  if (params.studyType?.trim()) {
    conditions.push(`study_type = $${idx++}`);
    queryParams.push(params.studyType.trim());
  }
  if (params.search?.trim()) {
    conditions.push(`(name_ar ILIKE $${idx} OR code = $${idx})`);
    queryParams.push(`%${params.search.trim()}%`);
    idx++;
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  queryParams.push(limit, offset);
  const res = await query(
    `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
     FROM student_exam_codes ${where}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    queryParams
  );
  return res.rows.map(mapRow);
}

export async function getStudentExamCodesCount(params: {
  department?: string;
  stage?: string;
  studyType?: string;
  search?: string;
}): Promise<number> {
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;
  if (params.department?.trim()) {
    conditions.push(`department = $${idx++}`);
    queryParams.push(params.department.trim());
  }
  if (params.stage?.trim()) {
    conditions.push(`stage = $${idx++}`);
    queryParams.push(params.stage.trim());
  }
  if (params.studyType?.trim()) {
    conditions.push(`study_type = $${idx++}`);
    queryParams.push(params.studyType.trim());
  }
  if (params.search?.trim()) {
    conditions.push(`(name_ar ILIKE $${idx} OR code = $${idx})`);
    queryParams.push(`%${params.search.trim()}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const res = await query(
    `SELECT COUNT(*)::int AS total FROM student_exam_codes ${where}`,
    queryParams
  );
  return Number(res.rows[0]?.total ?? 0);
}

export async function getStats(): Promise<{
  total: number;
  departmentsCount: number;
  byDepartment: { department: string; total: number }[];
}> {
  const countRes = await query(`SELECT COUNT(*)::int AS total FROM student_exam_codes`);
  const total = Number(countRes.rows[0]?.total ?? 0);
  const deptRes = await query(
    `SELECT department, COUNT(*)::int AS total
     FROM student_exam_codes
     GROUP BY department
     ORDER BY total DESC, department ASC`
  );
  const byDepartment = deptRes.rows.map((r) => ({
    department: String(r.department),
    total: Number(r.total) ?? 0,
  }));
  return { total, departmentsCount: byDepartment.length, byDepartment };
}

export async function getAllForExport(params: {
  department?: string;
  stage?: string;
  studyType?: string;
}): Promise<StudentExamCodeRow[]> {
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;
  if (params.department?.trim()) {
    conditions.push(`department = $${idx++}`);
    queryParams.push(params.department.trim());
  }
  if (params.stage?.trim()) {
    conditions.push(`stage = $${idx++}`);
    queryParams.push(params.stage.trim());
  }
  if (params.studyType?.trim()) {
    conditions.push(`study_type = $${idx++}`);
    queryParams.push(params.studyType.trim());
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const res = await query(
    `SELECT id, code, name_ar, department, stage, study_type, created_at, updated_at
     FROM student_exam_codes ${where}
     ORDER BY department, stage, name_ar`,
    queryParams
  );
  return res.rows.map(mapRow);
}
