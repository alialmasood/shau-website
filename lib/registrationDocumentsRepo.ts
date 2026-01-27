import { query } from "./db";

export type RegistrationDocumentRow = {
  id: string;
  fullName: string;
  department: string;
  stage: string;
  studyType: string;
  phone: string;
  personalPhotoId: string | null;
  studentIdFrontId: string | null;
  studentIdBackId: string | null;
  fatherIdFrontId: string | null;
  fatherIdBackId: string | null;
  motherIdFrontId: string | null;
  motherIdBackId: string | null;
  residenceCardFrontId: string | null;
  residenceCardBackId: string | null;
  highSchoolCertificateId: string | null;
  barcodeDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(r: { [k: string]: unknown }): RegistrationDocumentRow {
  return {
    id: String(r.id),
    fullName: String(r.full_name),
    department: String(r.department),
    stage: String(r.stage),
    studyType: r.study_type ? String(r.study_type) : "",
    phone: String(r.phone),
    personalPhotoId: r.personal_photo_id ? String(r.personal_photo_id) : null,
    studentIdFrontId: r.student_id_front_id ? String(r.student_id_front_id) : null,
    studentIdBackId: r.student_id_back_id ? String(r.student_id_back_id) : null,
    fatherIdFrontId: r.father_id_front_id ? String(r.father_id_front_id) : null,
    fatherIdBackId: r.father_id_back_id ? String(r.father_id_back_id) : null,
    motherIdFrontId: r.mother_id_front_id ? String(r.mother_id_front_id) : null,
    motherIdBackId: r.mother_id_back_id ? String(r.mother_id_back_id) : null,
    residenceCardFrontId: r.residence_card_front_id ? String(r.residence_card_front_id) : null,
    residenceCardBackId: r.residence_card_back_id ? String(r.residence_card_back_id) : null,
    highSchoolCertificateId: r.high_school_certificate_id ? String(r.high_school_certificate_id) : null,
    barcodeDocumentId: r.barcode_document_id ? String(r.barcode_document_id) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

const COLS = `id, full_name, department, stage, study_type, phone,
  personal_photo_id, student_id_front_id, student_id_back_id,
  father_id_front_id, father_id_back_id,
  mother_id_front_id, mother_id_back_id,
  residence_card_front_id, residence_card_back_id,
  high_school_certificate_id, barcode_document_id,
  created_at, updated_at`;

export async function getAllRegistrationDocuments(): Promise<RegistrationDocumentRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM registration_documents ORDER BY created_at DESC`
  );
  return res.rows.map(mapRow);
}

export async function getRegistrationDocumentById(id: string): Promise<RegistrationDocumentRow | null> {
  const s = String(id || "").trim();
  if (!s) return null;
  const res = await query(`SELECT ${COLS} FROM registration_documents WHERE id = $1 LIMIT 1`, [s]);
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export type CreateRegistrationDocumentInput = {
  fullName: string;
  department: string;
  stage: string;
  studyType: string;
  phone: string;
  personalPhotoId: string | null;
  studentIdFrontId: string | null;
  studentIdBackId: string | null;
  fatherIdFrontId: string | null;
  fatherIdBackId: string | null;
  motherIdFrontId: string | null;
  motherIdBackId: string | null;
  residenceCardFrontId: string | null;
  residenceCardBackId: string | null;
  highSchoolCertificateId: string | null;
  barcodeDocumentId: string | null;
};

export async function createRegistrationDocument(
  input: CreateRegistrationDocumentInput
): Promise<string> {
  const res = await query(
    `INSERT INTO registration_documents (
      full_name, department, stage, study_type, phone,
      personal_photo_id, student_id_front_id, student_id_back_id,
      father_id_front_id, father_id_back_id,
      mother_id_front_id, mother_id_back_id,
      residence_card_front_id, residence_card_back_id,
      high_school_certificate_id, barcode_document_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id`,
    [
      input.fullName,
      input.department,
      input.stage,
      input.studyType,
      input.phone,
      input.personalPhotoId,
      input.studentIdFrontId,
      input.studentIdBackId,
      input.fatherIdFrontId,
      input.fatherIdBackId,
      input.motherIdFrontId,
      input.motherIdBackId,
      input.residenceCardFrontId,
      input.residenceCardBackId,
      input.highSchoolCertificateId,
      input.barcodeDocumentId,
    ]
  );
  return String(res.rows[0].id);
}

export async function deleteRegistrationDocument(id: string): Promise<boolean> {
  try {
    const s = String(id || "").trim();
    if (!s) return false;
    
    const res = await query(
      `DELETE FROM registration_documents WHERE id = $1 RETURNING id`,
      [s]
    );
    
    return res.rows.length > 0;
  } catch (error) {
    console.error("Error in deleteRegistrationDocument:", error);
    throw error;
  }
}
