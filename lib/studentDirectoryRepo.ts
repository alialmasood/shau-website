import { query } from "./db";

export type StudentDirectoryRow = {
  id: string;
  nameAr: string;
  nameEn: string;
  dob: string;
  address: string;
  bloodType: string;
  department: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
};

type UpsertStudentDirectoryInput = {
  nameAr: string;
  nameEn: string;
  dob: Date;
  address: string;
  bloodType: string;
  department: string;
  stage: string;
};

function mapRow(r: { [k: string]: unknown }): StudentDirectoryRow {
  return {
    id: String(r.id),
    nameAr: String(r.name_ar),
    nameEn: String(r.name_en),
    dob: r.dob ? new Date(r.dob as string).toISOString() : "",
    address: String(r.address),
    bloodType: String(r.blood_type),
    department: String(r.department),
    stage: String(r.stage),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function upsertStudentDirectory(input: UpsertStudentDirectoryInput): Promise<StudentDirectoryRow> {
  const res = await query(
    `INSERT INTO student_directory
      (name_ar, name_en, dob, address, blood_type, department, stage, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (name_ar, dob, department) DO UPDATE SET
       name_en = EXCLUDED.name_en,
       address = EXCLUDED.address,
       blood_type = EXCLUDED.blood_type,
       stage = EXCLUDED.stage,
       updated_at = NOW()
     RETURNING id, name_ar, name_en, dob, address, blood_type, department, stage, created_at, updated_at`,
    [
      input.nameAr,
      input.nameEn,
      input.dob,
      input.address,
      input.bloodType,
      input.department,
      input.stage,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function searchStudentDirectory(queryText: string, limit = 10): Promise<StudentDirectoryRow[]> {
  const q = String(queryText || "").trim();
  if (!q) return [];
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const res = await query(
    `SELECT id, name_ar, name_en, dob, address, blood_type, department, stage, created_at, updated_at
     FROM student_directory
     WHERE name_ar ILIKE $1 OR name_en ILIKE $1
     ORDER BY name_ar ASC
     LIMIT $2`,
    [`%${q}%`, safeLimit]
  );
  return res.rows.map(mapRow);
}

export async function getStudentDirectoryStats(): Promise<{ total: number }> {
  const res = await query(`SELECT COUNT(*)::int AS total FROM student_directory`);
  return { total: Number(res.rows[0]?.total ?? 0) };
}
