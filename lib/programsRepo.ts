import { query } from "@/lib/db";

export type ProgramTableItem = {
  stage: 1 | 2 | 3 | 4;
  shift: "morning" | "evening";
  pdf_id: string | null;
  image_ids: string[];
  html_ar: string | null;
  html_en: string | null;
};

function parseTableItems(val: unknown): ProgramTableItem[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
    .map((x) => {
      const imageIds = Array.isArray(x.image_ids)
        ? (x.image_ids as unknown[]).filter((id): id is string => typeof id === "string")
        : typeof x.image_id === "string"
          ? [x.image_id]
          : [];
      return {
        stage: [1, 2, 3, 4].includes(Number(x.stage)) ? (Number(x.stage) as 1 | 2 | 3 | 4) : 1,
        shift: x.shift === "evening" ? "evening" : "morning",
        pdf_id: typeof x.pdf_id === "string" ? x.pdf_id : null,
        image_ids: imageIds,
        html_ar: typeof x.html_ar === "string" ? x.html_ar : null,
        html_en: typeof x.html_en === "string" ? x.html_en : null,
      };
    });
}

export type ProgramRow = {
  id: string;
  slug: string;
  nameAr: string | null;
  nameEn: string | null;
  briefAr: string | null;
  briefEn: string | null;
  lecturesTables: ProgramTableItem[];
  examsTables: ProgramTableItem[];
  studyShift: string;
  image1Id: string | null;
  image2Id: string | null;
  image3Id: string | null;
  image4Id: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

function mapRow(r: { [k: string]: unknown }): ProgramRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    nameAr: r.name_ar ? String(r.name_ar) : null,
    nameEn: r.name_en ? String(r.name_en) : null,
    briefAr: r.brief_ar ? String(r.brief_ar) : null,
    briefEn: r.brief_en ? String(r.brief_en) : null,
    lecturesTables: parseTableItems(r.lectures_tables),
    examsTables: parseTableItems(r.exams_tables),
    studyShift: ["morning", "evening", "both"].includes(String(r.study_shift)) ? String(r.study_shift) : "both",
    image1Id: r.image_1_id ? String(r.image_1_id) : null,
    image2Id: r.image_2_id ? String(r.image_2_id) : null,
    image3Id: r.image_3_id ? String(r.image_3_id) : null,
    image4Id: r.image_4_id ? String(r.image_4_id) : null,
    sortOrder: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

const COLS = `id, slug, name_ar, name_en, brief_ar, brief_en, lectures_tables, exams_tables,
  study_shift, image_1_id, image_2_id, image_3_id, image_4_id, sort_order, is_active, updated_at`;

/** للإدارة: كل السجلات */
export async function getAllPrograms(): Promise<ProgramRow[]> {
  const res = await query(`SELECT ${COLS} FROM programs ORDER BY sort_order ASC, created_at ASC`);
  return res.rows.map(mapRow);
}

/** للصفحة العامة والهوم: is_active فقط */
export async function getActivePrograms(): Promise<ProgramRow[]> {
  const res = await query(
    `SELECT ${COLS} FROM programs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC`
  );
  return res.rows.map(mapRow);
}

/** بالـ slug (للصفحة التفصيلية) */
export async function getProgramBySlug(slug: string): Promise<ProgramRow | null> {
  const s = String(slug || "").trim();
  if (!s) return null;
  const res = await query(`SELECT ${COLS} FROM programs WHERE slug = $1 AND is_active = true LIMIT 1`, [s]);
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/** بالـ id (للإدارة/تعديل) */
export async function getProgramById(id: string): Promise<ProgramRow | null> {
  const s = String(id || "").trim();
  if (!s) return null;
  const res = await query(`SELECT ${COLS} FROM programs WHERE id = $1 LIMIT 1`, [s]);
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export type CreateProgramInput = {
  slug: string;
  name_ar?: string | null;
  name_en?: string | null;
  brief_ar?: string | null;
  brief_en?: string | null;
  lectures_tables?: ProgramTableItem[];
  exams_tables?: ProgramTableItem[];
  study_shift?: string;
  image_1_id?: string | null;
  image_2_id?: string | null;
  image_3_id?: string | null;
  image_4_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

function tableItemsToJson(items: ProgramTableItem[] | undefined): string {
  if (!items || !Array.isArray(items)) return "[]";
  return JSON.stringify(
    items.map((x) => ({
      stage: x.stage,
      shift: x.shift,
      pdf_id: x.pdf_id || null,
      image_ids: Array.isArray(x.image_ids) ? x.image_ids : [],
      html_ar: x.html_ar || null,
      html_en: x.html_en || null,
    }))
  );
}

export async function createProgram(data: CreateProgramInput): Promise<string> {
  const studyShift = ["morning", "evening", "both"].includes(String(data.study_shift || ""))
    ? data.study_shift
    : "both";
  const lecturesJson = tableItemsToJson(data.lectures_tables);
  const examsJson = tableItemsToJson(data.exams_tables);
  const res = await query(
    `INSERT INTO programs (slug, name_ar, name_en, brief_ar, brief_en, lectures_tables, exams_tables,
       study_shift, image_1_id, image_2_id, image_3_id, image_4_id, sort_order, is_active, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, NOW())
     RETURNING id`,
    [
      data.slug,
      data.name_ar || null,
      data.name_en || null,
      data.brief_ar || null,
      data.brief_en || null,
      lecturesJson,
      examsJson,
      studyShift,
      data.image_1_id || null,
      data.image_2_id || null,
      data.image_3_id || null,
      data.image_4_id || null,
      Number(data.sort_order) || 0,
      data.is_active !== false,
    ]
  );
  return String(res.rows[0]?.id ?? "");
}

export type UpdateProgramInput = Partial<CreateProgramInput>;

export async function updateProgram(id: string, data: UpdateProgramInput): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const d = data as Record<string, unknown>;
  const push = (col: string, val: unknown) => {
    if (!(col in d)) return;
    sets.push(`${col}=$${i}`);
    values.push(val);
    i++;
  };
  push("name_ar", data.name_ar ?? null);
  push("name_en", data.name_en ?? null);
  push("brief_ar", data.brief_ar ?? null);
  push("brief_en", data.brief_en ?? null);
  if (data.lectures_tables !== undefined) {
    sets.push(`lectures_tables=$${i}::jsonb`);
    values.push(tableItemsToJson(data.lectures_tables));
    i++;
  }
  if (data.exams_tables !== undefined) {
    sets.push(`exams_tables=$${i}::jsonb`);
    values.push(tableItemsToJson(data.exams_tables));
    i++;
  }
  if (data.study_shift != null && ["morning", "evening", "both"].includes(data.study_shift)) {
    sets.push(`study_shift=$${i}`);
    values.push(data.study_shift);
    i++;
  }
  push("image_1_id", data.image_1_id ?? null);
  push("image_2_id", data.image_2_id ?? null);
  push("image_3_id", data.image_3_id ?? null);
  push("image_4_id", data.image_4_id ?? null);
  push("sort_order", data.sort_order);
  push("is_active", data.is_active);
  if (data.slug != null) {
    sets.push(`slug=$${i}`);
    values.push(data.slug);
    i++;
  }
  if (sets.length === 0) return;
  sets.push("updated_at=NOW()");
  values.push(id);
  await query(`UPDATE programs SET ${sets.join(", ")} WHERE id=$${i}`, values);
}

export async function deleteProgram(id: string): Promise<void> {
  await query(`DELETE FROM programs WHERE id = $1`, [id]);
}
