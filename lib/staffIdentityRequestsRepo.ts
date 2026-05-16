import { query } from "./db";
import { generateUniqueStaffIdentityNumber } from "./staffIdentityNumber";

export type StaffIdentityRequestRow = {
  id: string;
  identity_number: string | null;
  name_ar: string;
  name_en: string;
  date_of_birth: string;
  academic_title: string | null;
  workplace: string;
  position: string | null;
  phone: string;
  university_email: string;
  photo_media_id: string | null;
  locale: string | null;
  created_at: string;
};

const SELECT_FIELDS = `id, identity_number, name_ar, name_en, date_of_birth::text, academic_title, workplace, position,
            phone, university_email, photo_media_id::text, locale, created_at`;

function mapRow(r: Record<string, unknown>): StaffIdentityRequestRow {
  return {
    id: String(r.id),
    identity_number: r.identity_number != null ? String(r.identity_number) : null,
    name_ar: String(r.name_ar),
    name_en: String(r.name_en),
    date_of_birth: String(r.date_of_birth),
    academic_title: r.academic_title != null ? String(r.academic_title) : null,
    workplace: String(r.workplace),
    position: r.position != null ? String(r.position) : null,
    phone: String(r.phone),
    university_email: String(r.university_email),
    photo_media_id: r.photo_media_id != null ? String(r.photo_media_id) : null,
    locale: r.locale != null ? String(r.locale) : null,
    created_at: r.created_at ? new Date(r.created_at as string | Date).toISOString() : "",
  };
}

export type CreateStaffIdentityRequestInput = {
  nameAr: string;
  nameEn: string;
  dateOfBirth: string; // YYYY-MM-DD
  academicTitle: string | null;
  workplace: string;
  position: string | null;
  phone: string;
  universityEmail: string;
  photoMediaId: string;
  locale: string | null;
};

export async function createStaffIdentityRequest(
  input: CreateStaffIdentityRequestInput
): Promise<string> {
  const res = await query(
    `INSERT INTO staff_identity_requests (
       name_ar, name_en, date_of_birth, academic_title, workplace, position,
       phone, university_email, photo_media_id, locale
     )
     VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9::uuid, $10)
     RETURNING id`,
    [
      input.nameAr,
      input.nameEn,
      input.dateOfBirth,
      input.academicTitle?.trim() || null,
      input.workplace,
      input.position?.trim() || null,
      input.phone,
      input.universityEmail,
      input.photoMediaId,
      input.locale?.trim() || null,
    ]
  );
  return String(res.rows[0].id);
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function getStaffIdentityRequestById(id: string): Promise<StaffIdentityRequestRow | null> {
  if (!isUuid(id)) return null;
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM staff_identity_requests
     WHERE id = $1::uuid
     LIMIT 1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export async function getStaffIdentityRequestByIdentityNumber(
  identityNumber: string
): Promise<StaffIdentityRequestRow | null> {
  const num = String(identityNumber || "").trim();
  if (!num) return null;
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM staff_identity_requests
     WHERE identity_number = $1
     LIMIT 1`,
    [num]
  );
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

/** يُنشئ رقم هوية عشوائي (SHxxxxxxxx) عند الحاجة — غير تسلسلي */
export async function ensureStaffIdentityNumber(id: string): Promise<string> {
  const existing = await getStaffIdentityRequestById(id);
  if (!existing) throw new Error("السجل غير موجود");
  if (existing.identity_number) return existing.identity_number;

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = await generateUniqueStaffIdentityNumber();
    const updated = await query(
      `UPDATE staff_identity_requests
       SET identity_number = $1
       WHERE id = $2::uuid AND identity_number IS NULL
       RETURNING identity_number`,
      [candidate, id]
    );
    if (updated.rows.length > 0) {
      return String(updated.rows[0].identity_number);
    }
    const again = await getStaffIdentityRequestById(id);
    if (again?.identity_number) return again.identity_number;
  }
  throw new Error("تعذر تعيين رقم الهوية");
}

export async function listStaffIdentityRequests(): Promise<StaffIdentityRequestRow[]> {
  const res = await query(
    `SELECT ${SELECT_FIELDS}
     FROM staff_identity_requests
     ORDER BY created_at DESC`
  );
  return res.rows.map((r) => mapRow(r));
}

export async function mediaExists(id: string): Promise<boolean> {
  const res = await query(`SELECT 1 FROM media WHERE id = $1::uuid LIMIT 1`, [id]);
  return res.rows.length > 0;
}
