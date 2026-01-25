import { query } from "@/lib/db";

export type CreateApplicationInput = {
  full_name: string;
  graduation_year: number;
  school_name: string;
  phone: string;
  email?: string | null;
  address: string;
  category: string;
  department_id: string;
  study_type: "morning" | "evening";
  average: number;
  total?: number | null;
  notes?: string | null;
  ip?: string | null;
  user_agent?: string | null;
};

export type ApplicationListRow = {
  id: string;
  full_name: string;
  average: string;
  department_name: string;
  category: string;
  phone: string;
  status: string;
  created_at: string;
};

/** قائمة طلبات التقديم (للأدمن) مع اسم القسم */
export async function getAllApplications(): Promise<ApplicationListRow[]> {
  const res = await query(
    `SELECT a.id, a.full_name, a.average, a.category, a.phone, a.status, a.created_at,
            COALESCE(d.display_name, d.display_name_en, d.department_slug) AS department_name
     FROM applications a
     LEFT JOIN department_fees d ON d.id = a.department_id
     ORDER BY a.created_at DESC`
  );
  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    full_name: String(r.full_name ?? ""),
    average: String(r.average ?? ""),
    department_name: String(r.department_name ?? "—"),
    category: String(r.category ?? ""),
    phone: String(r.phone ?? ""),
    status: String(r.status ?? "new"),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
  }));
}

/** التحقق من وجود قسم نشط بالـ id */
export async function isActiveDepartmentId(id: string): Promise<boolean> {
  const s = String(id || "").trim();
  if (!s) return false;
  const res = await query(
    `SELECT 1 FROM department_fees WHERE id = $1::uuid AND is_active = true LIMIT 1`,
    [s]
  );
  return (res.rows?.length ?? 0) > 0;
}

/** إنشاء طلب تقديم. يُرجع id الطلب. */
export async function createApplication(data: CreateApplicationInput): Promise<string> {
  const res = await query(
    `INSERT INTO applications (
      full_name, graduation_year, school_name, phone, email, address,
      category, department_id, study_type, average, total, notes,
      status, ip, user_agent, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::uuid, $9, $10, $11, $12,
      'new', $13, $14, NOW()
    ) RETURNING id`,
    [
      data.full_name.trim(),
      data.graduation_year,
      data.school_name.trim(),
      data.phone.trim(),
      data.email?.trim() || null,
      data.address.trim(),
      data.category,
      data.department_id,
      data.study_type,
      data.average,
      data.total ?? null,
      data.notes?.trim() || null,
      data.ip || null,
      data.user_agent || null,
    ]
  );
  return String(res.rows[0]?.id ?? "");
}
