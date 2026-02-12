import { query } from "./db";

export type StudentIdCardRow = {
  serial: string;
  nameAr: string;
  nameEn: string;
  dob: string;
  address: string;
  addressEn: string;
  bloodType: string;
  department: string;
  departmentEn: string;
  stage: string;
  stageEn: string;
  expiryDate: string;
  photoMediaId: string | null;
  createdAt: string;
  updatedAt: string;
};

type UpsertStudentIdCardInput = {
  serial: string;
  nameAr: string;
  nameEn: string;
  dob: string;
  address: string;
  addressEn: string;
  bloodType: string;
  department: string;
  departmentEn: string;
  stage: string;
  stageEn: string;
  expiryDate: string;
  photoMediaId?: string | null;
};

function toDateOnly(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(s)) return s.slice(0, 10);
  const d = v instanceof Date ? v : new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapRow(r: { [k: string]: unknown }): StudentIdCardRow {
  return {
    serial: String(r.serial),
    nameAr: String(r.name_ar),
    nameEn: String(r.name_en),
    dob: toDateOnly(r.dob),
    address: String(r.address),
    addressEn: String(r.address_en ?? ""),
    bloodType: String(r.blood_type),
    department: String(r.department),
    departmentEn: String(r.department_en ?? ""),
    stage: String(r.stage),
    stageEn: String(r.stage_en ?? ""),
    expiryDate: toDateOnly(r.expiry_date),
    photoMediaId: r.photo_media_id ? String(r.photo_media_id) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function upsertStudentIdCard(input: UpsertStudentIdCardInput): Promise<StudentIdCardRow> {
  const res = await query(
    `INSERT INTO student_id_cards
      (serial, name_ar, name_en, dob, address, address_en, blood_type, department, department_en, stage, stage_en, expiry_date, photo_media_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
     ON CONFLICT (serial) DO UPDATE SET
       name_ar = EXCLUDED.name_ar,
       name_en = EXCLUDED.name_en,
       dob = EXCLUDED.dob,
       address = EXCLUDED.address,
       address_en = EXCLUDED.address_en,
       blood_type = EXCLUDED.blood_type,
       department = EXCLUDED.department,
       department_en = EXCLUDED.department_en,
       stage = EXCLUDED.stage,
       stage_en = EXCLUDED.stage_en,
       expiry_date = EXCLUDED.expiry_date,
       photo_media_id = EXCLUDED.photo_media_id,
       updated_at = NOW()
    RETURNING serial, name_ar, name_en, dob, address, address_en, blood_type, department, department_en, stage, stage_en, expiry_date, photo_media_id, created_at, updated_at`,
    [
      input.serial,
      input.nameAr,
      input.nameEn,
      input.dob,
      input.address,
      input.addressEn,
      input.bloodType,
      input.department,
      input.departmentEn,
      input.stage,
      input.stageEn,
      input.expiryDate,
      input.photoMediaId ?? null,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function getStudentIdCardBySerial(serial: string): Promise<StudentIdCardRow | null> {
  const s = String(serial || "").trim();
  if (!s) return null;
  const res = await query(
    `SELECT serial, name_ar, name_en, dob, address, address_en, blood_type, department, department_en, stage, stage_en, expiry_date, photo_media_id, created_at, updated_at
     FROM student_id_cards
     WHERE serial = $1
     LIMIT 1`,
    [s]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

/** يتحقق إن كان طالب (نفس الاسم + تاريخ الميلاد + القسم) لديه هوية مصدرة، ويرجع البطاقة إن وُجدت */
export async function getStudentIdCardByStudent(
  nameAr: string,
  dob: string,
  department: string
): Promise<StudentIdCardRow | null> {
  const name = String(nameAr ?? "").trim();
  const dept = String(department ?? "").trim();
  const dateOnly = toDateOnly(dob);
  if (!name || !dateOnly || !dept) return null;
  const res = await query(
    `SELECT serial, name_ar, name_en, dob, address, address_en, blood_type, department, department_en, stage, stage_en, expiry_date, photo_media_id, created_at, updated_at
     FROM student_id_cards
     WHERE TRIM(name_ar) = $1 AND department = $2 AND (dob::text LIKE $3 OR dob = $4::date)
     LIMIT 1`,
    [name, dept, `${dateOnly}%`, dateOnly]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function getStudentIdCardsCount(): Promise<number> {
  const res = await query(`SELECT COUNT(*)::int AS total FROM student_id_cards`);
  return Number(res.rows[0]?.total ?? 0);
}

export async function getStudentIdCardsList({
  limit = 50,
  search,
  department,
  stage,
}: {
  limit?: number;
  search?: string;
  department?: string;
  stage?: string;
} = {}): Promise<StudentIdCardRow[]> {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const q = String(search || "").trim();
  const dept = String(department || "").trim();
  const stg = String(stage || "").trim();

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(name_ar ILIKE $${idx} OR name_en ILIKE $${idx} OR serial ILIKE $${idx})`);
  }
  if (dept) {
    params.push(dept);
    conditions.push(`department = $${params.length}`);
  }
  if (stg) {
    params.push(stg);
    conditions.push(`stage = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(safeLimit);
  const limitIdx = params.length;

  const res = await query(
    `SELECT serial, name_ar, name_en, dob, address, address_en, blood_type, department, department_en, stage, stage_en, expiry_date, photo_media_id, created_at, updated_at
     FROM student_id_cards
     ${where}
     ORDER BY created_at DESC
     LIMIT $${limitIdx}`,
    params
  );
  return res.rows.map(mapRow);
}

export async function getStudentIdDepartmentsStats(): Promise<{ department: string; total: number }[]> {
  const res = await query(
    `SELECT department, COUNT(*)::int AS total
     FROM student_id_cards
     GROUP BY department
     ORDER BY total DESC, department ASC`
  );
  return res.rows.map((row) => ({
    department: String(row.department),
    total: Number(row.total) || 0,
  }));
}

export async function getStudentIdStagesList(): Promise<string[]> {
  const res = await query(
    `SELECT DISTINCT stage
     FROM student_id_cards
     WHERE stage IS NOT NULL AND stage <> ''
     ORDER BY stage ASC`
  );
  return res.rows.map((row) => String(row.stage));
}

export async function deleteStudentIdCard(serial: string): Promise<boolean> {
  const s = String(serial || "").trim();
  if (!s) return false;
  const res = await query(
    `DELETE FROM student_id_cards WHERE serial = $1 RETURNING serial`,
    [s]
  );
  return res.rows.length > 0;
}
