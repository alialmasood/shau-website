import { query } from "@/lib/db";

export type DepartmentFeeRow = {
  id: string;
  departmentSlug: string;
  displayName: string | null;
  displayNameEn: string | null;
  categories: string[];
  cardImageId: string | null;
  brief: string | null;
  briefEn: string | null;
  morningPrice: string;
  eveningPrice: string;
  currency: string;
  registrationFee: string | null;
  extraFees: string | null;
  extraFeesEn: string | null;
  feesNotes: string | null;
  feesNotesEn: string | null;
  morningMinGpa: string;
  eveningMinGpa: string;
  admissionNotes: string | null;
  admissionNotesEn: string | null;
  showApplyButton: boolean;
  applyTypes: string[];
  applyUrl: string | null;
  applyUrlExternal: string | null;
  applyUrlWhatsapp: string | null;
  applyButtonText: string | null;
  applyButtonTextEn: string | null;
  requiredDocs: Array<{ ar: string; en: string }>;
  applicationStart: string | null;
  applicationEnd: string | null;
  featured: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

function parseRequiredDocs(val: unknown): Array<{ ar: string; en: string }> {
  if (!val) return [];
  try {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return (arr || []).map((x: any) => ({
      ar: typeof x?.ar === "string" ? x.ar : "",
      en: typeof x?.en === "string" ? x.en : "",
    }));
  } catch {
    return [];
  }
}

function parseCategories(val: unknown): string[] {
  if (!val) return [];
  try {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return (arr || []).filter((x: unknown): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function parseApplyTypes(val: unknown): string[] {
  if (!val) return [];
  try {
    const arr = Array.isArray(val) ? val : JSON.parse(String(val));
    return (arr || []).filter((x: unknown): x is string => typeof x === "string" && ["external_link", "internal_page", "whatsapp"].includes(x));
  } catch {
    return [];
  }
}

/** تحويل أي قيمة إلى yyyy-MM-dd فقط (لحقول type="date" و PostgreSQL DATE) */
function toDateOnly(v: unknown): string | null {
  if (v == null || (typeof v === "string" && v.trim() === "")) return null;
  const s = typeof v === "string" ? v.trim() : String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = v instanceof Date ? v : new Date(v as string | number);
  return isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

function mapRow(r: any): DepartmentFeeRow {
  return {
    id: String(r.id),
    departmentSlug: String(r.department_slug),
    displayName: r.display_name ? String(r.display_name) : null,
    displayNameEn: r.display_name_en ? String(r.display_name_en) : null,
    categories: parseCategories(r.categories),
    cardImageId: r.card_image_id ? String(r.card_image_id) : null,
    brief: r.brief ? String(r.brief) : null,
    briefEn: r.brief_en ? String(r.brief_en) : null,
    morningPrice: String(r.morning_price ?? "0"),
    eveningPrice: String(r.evening_price ?? "0"),
    currency: String(r.currency ?? "د.ع"),
    registrationFee: r.registration_fee != null ? String(r.registration_fee) : null,
    extraFees: r.extra_fees ? String(r.extra_fees) : null,
    extraFeesEn: r.extra_fees_en ? String(r.extra_fees_en) : null,
    feesNotes: r.fees_notes ? String(r.fees_notes) : null,
    feesNotesEn: r.fees_notes_en ? String(r.fees_notes_en) : null,
    morningMinGpa: String(r.morning_min_gpa ?? "0"),
    eveningMinGpa: String(r.evening_min_gpa ?? "0"),
    admissionNotes: r.admission_notes ? String(r.admission_notes) : null,
    admissionNotesEn: r.admission_notes_en ? String(r.admission_notes_en) : null,
    showApplyButton: Boolean(r.show_apply_button),
    applyTypes: parseApplyTypes(r.apply_types),
    applyUrl: r.apply_url ? String(r.apply_url) : null,
    applyUrlExternal: r.apply_url_external ? String(r.apply_url_external) : null,
    applyUrlWhatsapp: r.apply_url_whatsapp ? String(r.apply_url_whatsapp) : null,
    applyButtonText: r.apply_button_text ? String(r.apply_button_text) : null,
    applyButtonTextEn: r.apply_button_text_en ? String(r.apply_button_text_en) : null,
    requiredDocs: parseRequiredDocs(r.required_docs),
    applicationStart: toDateOnly(r.application_start),
    applicationEnd: toDateOnly(r.application_end),
    featured: Boolean(r.featured),
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : "",
  };
}

const COLS = `id, department_slug, display_name, display_name_en, categories, card_image_id, brief, brief_en,
  morning_price, evening_price, currency, registration_fee, extra_fees, extra_fees_en, fees_notes, fees_notes_en,
  morning_min_gpa, evening_min_gpa, admission_notes, admission_notes_en,
  show_apply_button, apply_types, apply_url, apply_url_external, apply_url_whatsapp, apply_button_text, apply_button_text_en, required_docs,
  application_start, application_end, featured, sort_order, is_active, updated_at`;

/** للإدارة: كل السجلات مرتبة */
export async function getAllDepartmentFees(): Promise<DepartmentFeeRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM department_fees ORDER BY sort_order ASC, created_at ASC`
  );
  return res.rows.map(mapRow);
}

/** للهوم: featured + is_active فقط */
export async function getDepartmentFeesForHome(): Promise<DepartmentFeeRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM department_fees
     WHERE is_active = true AND featured = true
     ORDER BY sort_order ASC, created_at ASC`
  );
  return res.rows.map(mapRow);
}

/** لصفحة الرسوم والـ Modal: is_active فقط */
export async function getDepartmentFeesForPage(): Promise<DepartmentFeeRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM department_fees
     WHERE is_active = true
     ORDER BY sort_order ASC, created_at ASC`
  );
  return res.rows.map(mapRow);
}

/** سجل واحد (للتفاصيل/تعديل) */
export async function getDepartmentFeeById(id: string): Promise<DepartmentFeeRow | null> {
  const s = typeof id === "string" ? id.trim() : "";
  if (!s) return null;
  const res = await query(`SELECT ${COLS} FROM department_fees WHERE id = $1 LIMIT 1`, [s]);
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

export type CreateDeptFeeInput = {
  department_slug: string;
  display_name?: string | null;
  display_name_en?: string | null;
  categories: string[];
  card_image_id?: string | null;
  brief?: string | null;
  brief_en?: string | null;
  morning_price: number;
  evening_price: number;
  currency?: string;
  registration_fee?: number | null;
  extra_fees?: string | null;
  extra_fees_en?: string | null;
  fees_notes?: string | null;
  fees_notes_en?: string | null;
  morning_min_gpa: number;
  evening_min_gpa: number;
  admission_notes?: string | null;
  admission_notes_en?: string | null;
  show_apply_button?: boolean;
  apply_types: string[];
  apply_url?: string | null;
  apply_url_external?: string | null;
  apply_url_whatsapp?: string | null;
  apply_button_text?: string | null;
  apply_button_text_en?: string | null;
  required_docs?: Array<{ ar: string; en: string }> | null;
  application_start?: string | null;
  application_end?: string | null;
  featured?: boolean;
  sort_order?: number;
  is_active?: boolean;
};

export async function createDepartmentFee(data: CreateDeptFeeInput): Promise<string> {
  const requiredDocs = data.required_docs && data.required_docs.length > 0
    ? JSON.stringify(data.required_docs)
    : null;
  const appStart = toDateOnly(data.application_start);
  const appEnd = toDateOnly(data.application_end);

  const categoriesJson = Array.isArray(data.categories) && data.categories.length > 0
    ? JSON.stringify(data.categories)
    : "[]";
  const applyTypesJson = Array.isArray(data.apply_types) && data.apply_types.length > 0
    ? JSON.stringify(data.apply_types)
    : "[]";
  const res = await query(
    `INSERT INTO department_fees (
      department_slug, display_name, display_name_en, categories, card_image_id, brief, brief_en,
      morning_price, evening_price, currency, registration_fee, extra_fees, extra_fees_en, fees_notes, fees_notes_en,
      morning_min_gpa, evening_min_gpa, admission_notes, admission_notes_en,
      show_apply_button, apply_types, apply_url, apply_url_external, apply_url_whatsapp, apply_button_text, apply_button_text_en, required_docs,
      application_start, application_end, featured, sort_order, is_active, updated_at
    ) VALUES (
      $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21::jsonb, $22, $23, $24, $25, $26, $27::jsonb,
      $28::date, $29::date, $30, $31, $32, NOW()
    ) RETURNING id`,
    [
      data.department_slug,
      data.display_name || null,
      data.display_name_en || null,
      categoriesJson,
      data.card_image_id || null,
      data.brief || null,
      data.brief_en || null,
      data.morning_price,
      data.evening_price,
      data.currency ?? "د.ع",
      data.registration_fee ?? null,
      data.extra_fees || null,
      data.extra_fees_en || null,
      data.fees_notes || null,
      data.fees_notes_en || null,
      data.morning_min_gpa,
      data.evening_min_gpa,
      data.admission_notes || null,
      data.admission_notes_en || null,
      data.show_apply_button !== false,
      applyTypesJson,
      data.apply_url || null,
      data.apply_url_external || null,
      data.apply_url_whatsapp || null,
      data.apply_button_text || null,
      data.apply_button_text_en || null,
      requiredDocs,
      appStart,
      appEnd,
      data.featured ?? false,
      data.sort_order ?? 0,
      data.is_active !== false,
    ]
  );
  return String(res.rows[0]?.id ?? "");
}

export type UpdateDeptFeeInput = Partial<CreateDeptFeeInput>;

export async function updateDepartmentFee(id: string, data: UpdateDeptFeeInput): Promise<void> {
  const allowed = new Set(Object.keys(data));
  const sets: string[] = [];
  const values: any[] = [];
  let i = 1;

  const push = (col: string, val: any, cast?: string) => {
    if (!(col in data)) return;
    sets.push(`${col}=$${i}${cast ? `::${cast}` : ""}`);
    values.push(val);
    i++;
  };

  push("display_name", data.display_name ?? null);
  push("display_name_en", data.display_name_en ?? null);
  push("categories", (Array.isArray(data.categories) && data.categories.length > 0) ? JSON.stringify(data.categories) : "[]", "jsonb");
  push("card_image_id", data.card_image_id ?? null);
  push("brief", data.brief ?? null);
  push("brief_en", data.brief_en ?? null);
  push("morning_price", data.morning_price);
  push("evening_price", data.evening_price);
  push("currency", data.currency ?? "د.ع");
  push("registration_fee", data.registration_fee ?? null);
  push("extra_fees", data.extra_fees ?? null);
  push("extra_fees_en", data.extra_fees_en ?? null);
  push("fees_notes", data.fees_notes ?? null);
  push("fees_notes_en", data.fees_notes_en ?? null);
  push("morning_min_gpa", data.morning_min_gpa);
  push("evening_min_gpa", data.evening_min_gpa);
  push("admission_notes", data.admission_notes ?? null);
  push("admission_notes_en", data.admission_notes_en ?? null);
  push("show_apply_button", data.show_apply_button);
  push("apply_types", (Array.isArray(data.apply_types) && data.apply_types.length > 0) ? JSON.stringify(data.apply_types) : "[]", "jsonb");
  push("apply_url", data.apply_url ?? null);
  push("apply_url_external", data.apply_url_external ?? null);
  push("apply_url_whatsapp", data.apply_url_whatsapp ?? null);
  push("apply_button_text", data.apply_button_text ?? null);
  push("apply_button_text_en", data.apply_button_text_en ?? null);
  push("required_docs", (data.required_docs && data.required_docs.length > 0) ? JSON.stringify(data.required_docs) : null, "jsonb");
  push("application_start", toDateOnly(data.application_start), "date");
  push("application_end", toDateOnly(data.application_end), "date");
  push("featured", data.featured);
  push("sort_order", data.sort_order);
  push("is_active", data.is_active);

  if (sets.length === 0) return;
  sets.push(`updated_at=NOW()`);
  values.push(id);
  await query(
    `UPDATE department_fees SET ${sets.join(", ")} WHERE id=$${i}`,
    values
  );
}

export async function deleteDepartmentFee(id: string): Promise<void> {
  await query(`DELETE FROM department_fees WHERE id = $1`, [id]);
}
