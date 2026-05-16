import { query } from "./db";
import { generateUniqueEmployeeIdentityNumber } from "./employeeIdentityNumber";

export type EmployeeIdentityRequestRow = {
  id: string;
  identity_number: string | null;
  name_ar: string;
  name_en: string;
  date_of_birth: string;
  address: string;
  phone: string;
  blood_type: string;
  education_level: string | null;
  workplace: string;
  job_category: string;
  position: string | null;
  official_email: string | null;
  photo_media_id: string | null;
  locale: string | null;
  created_at: string;
};

const SELECT_FIELDS = `id, identity_number, name_ar, name_en, date_of_birth::text, address, phone, blood_type, education_level, workplace,
            job_category, position, official_email, photo_media_id::text, locale, created_at`;

function mapRow(r: Record<string, unknown>): EmployeeIdentityRequestRow {
  return {
    id: String(r.id),
    identity_number: r.identity_number != null ? String(r.identity_number) : null,
    name_ar: String(r.name_ar),
    name_en: String(r.name_en),
    date_of_birth: String(r.date_of_birth),
    address: String(r.address),
    phone: String(r.phone),
    blood_type: String(r.blood_type),
    education_level: r.education_level != null ? String(r.education_level) : null,
    workplace: String(r.workplace),
    job_category: String(r.job_category),
    position: r.position != null ? String(r.position) : null,
    official_email: r.official_email != null ? String(r.official_email) : null,
    photo_media_id: r.photo_media_id != null ? String(r.photo_media_id) : null,
    locale: r.locale != null ? String(r.locale) : null,
    created_at: r.created_at ? new Date(r.created_at as string | Date).toISOString() : "",
  };
}

export type CreateEmployeeIdentityRequestInput = {
  nameAr: string;
  nameEn: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  bloodType: string;
  educationLevel: string;
  workplace: string;
  jobCategory: string;
  position: string | null;
  officialEmail: string | null;
  photoMediaId: string;
  locale: string | null;
};

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function createEmployeeIdentityRequest(
  input: CreateEmployeeIdentityRequestInput
): Promise<string> {
  const res = await query(
    `INSERT INTO employee_identity_requests (
       name_ar, name_en, date_of_birth, address, phone, blood_type, education_level, workplace,
       job_category, position, official_email, photo_media_id, locale
     )
     VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12::uuid, $13)
     RETURNING id`,
    [
      input.nameAr,
      input.nameEn,
      input.dateOfBirth,
      input.address,
      input.phone,
      input.bloodType,
      input.educationLevel,
      input.workplace,
      input.jobCategory,
      input.position,
      input.officialEmail,
      input.photoMediaId,
      input.locale,
    ]
  );
  return String(res.rows[0].id);
}

export async function getEmployeeIdentityRequestById(id: string): Promise<EmployeeIdentityRequestRow | null> {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM employee_identity_requests
     WHERE id = $1::uuid
     LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function getEmployeeIdentityRequestByIdentityNumber(
  identityNumber: string
): Promise<EmployeeIdentityRequestRow | null> {
  const num = String(identityNumber || "").trim();
  if (!num) return null;
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM employee_identity_requests
     WHERE identity_number = $1
     LIMIT 1`,
    [num]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function ensureEmployeeIdentityNumber(id: string): Promise<string> {
  const existing = await getEmployeeIdentityRequestById(id);
  if (!existing) throw new Error("السجل غير موجود");
  if (existing.identity_number) return existing.identity_number;

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = await generateUniqueEmployeeIdentityNumber();
    const updated = await query(
      `UPDATE employee_identity_requests
       SET identity_number = $1
       WHERE id = $2::uuid AND identity_number IS NULL
       RETURNING identity_number`,
      [candidate, id]
    );
    if (updated.rows.length > 0) {
      return String(updated.rows[0].identity_number);
    }
    const again = await getEmployeeIdentityRequestById(id);
    if (again?.identity_number) return again.identity_number;
  }
  throw new Error("تعذر تعيين رقم الهوية");
}

export async function listEmployeeIdentityRequests(): Promise<EmployeeIdentityRequestRow[]> {
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM employee_identity_requests
     ORDER BY created_at DESC`
  );
  return res.rows.map((r) => mapRow(r));
}

export async function employeeMediaExists(id: string): Promise<boolean> {
  const res = await query(`SELECT 1 FROM media WHERE id = $1::uuid LIMIT 1`, [id]);
  return res.rows.length > 0;
}
