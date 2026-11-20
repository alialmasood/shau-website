import { query } from "@/lib/db";
import {
  CONFERENCE_HALL_ALL_DEPARTMENTS_KEY,
  type ConferenceHallActivityType,
  type ConferenceHallStage,
  type ConferenceHallStatus,
  type ConferenceHallStudyType,
} from "@/lib/conferenceHallConfig";
import { getActivePrograms } from "@/lib/programsRepo";
import { getDepartmentFeesForPage } from "@/lib/departmentFeeRepo";

export type ConferenceHallDepartmentOption = {
  key: string;
  nameAr: string;
  nameEn: string;
};

export type ConferenceHallRequestRow = {
  id: string;
  departmentKey: string;
  departmentKeys: string[];
  departmentNameAr: string;
  departmentNameEn: string;
  stage: string;
  studyType: string;
  activityType: string;
  activityTitle: string;
  activityBrief: string;
  organizers: string;
  dateFrom: string;
  dateTo: string;
  status: ConferenceHallStatus;
  locale: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusyDay = {
  date: string;
  kinds: Array<"booking" | "event">;
  labels: string[];
};

function toDateOnly(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = v instanceof Date ? v : new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKeys(raw: unknown, fallbackKey: string): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  return fallbackKey ? [fallbackKey] : [];
}

function mapRow(r: Record<string, unknown>): ConferenceHallRequestRow {
  const departmentKey = String(r.department_key ?? "");
  return {
    id: String(r.id),
    departmentKey,
    departmentKeys: parseKeys(r.department_keys, departmentKey),
    departmentNameAr: String(r.department_name_ar),
    departmentNameEn: String(r.department_name_en ?? ""),
    stage: String(r.stage),
    studyType: String(r.study_type),
    activityType: String(r.activity_type),
    activityTitle: String(r.activity_title ?? ""),
    activityBrief: String(r.activity_brief ?? ""),
    organizers: String(r.organizers),
    dateFrom: toDateOnly(r.date_from),
    dateTo: toDateOnly(r.date_to),
    status: String(r.status) as ConferenceHallStatus,
    locale: r.locale ? String(r.locale) : null,
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

/** أقسام دراسية من البرامج + رسوم الأقسام النشطة */
export async function getConferenceHallDepartments(): Promise<ConferenceHallDepartmentOption[]> {
  const [programs, fees] = await Promise.all([
    getActivePrograms().catch(() => []),
    getDepartmentFeesForPage().catch(() => []),
  ]);

  const map = new Map<string, ConferenceHallDepartmentOption>();

  for (const p of programs) {
    const nameAr = (p.nameAr || p.nameEn || p.slug || "").trim();
    if (!nameAr) continue;
    const key = `program:${p.id}`;
    map.set(key, {
      key,
      nameAr,
      nameEn: (p.nameEn || p.nameAr || p.slug || "").trim(),
    });
  }

  for (const d of fees) {
    const nameAr = (d.displayName || d.displayNameEn || d.departmentSlug || "").trim();
    if (!nameAr) continue;
    const key = `fee:${d.id}`;
    map.set(key, {
      key,
      nameAr,
      nameEn: (d.displayNameEn || d.displayName || d.departmentSlug || "").trim(),
    });
  }

  return Array.from(map.values()).sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}

export type CreateConferenceHallInput = {
  departmentKeys: string[];
  allDepartments: boolean;
  departmentNameAr: string;
  departmentNameEn: string;
  stage: ConferenceHallStage;
  studyType: ConferenceHallStudyType;
  activityType: ConferenceHallActivityType;
  activityTitle: string;
  activityBrief: string;
  organizers: string;
  dateFrom: string;
  dateTo: string;
  locale?: string | null;
};

export async function createConferenceHallRequest(
  input: CreateConferenceHallInput
): Promise<ConferenceHallRequestRow> {
  const keys = input.allDepartments
    ? [CONFERENCE_HALL_ALL_DEPARTMENTS_KEY]
    : input.departmentKeys.filter(Boolean);
  const primaryKey = keys[0] || CONFERENCE_HALL_ALL_DEPARTMENTS_KEY;

  const res = await query(
    `INSERT INTO conference_hall_requests
      (department_key, department_keys, department_name_ar, department_name_en, stage, study_type, activity_type,
       activity_title, activity_brief, organizers, date_from, date_to, status, locale, created_at, updated_at)
     VALUES ($1,$2::text[],$3,$4,$5,$6,$7,$8,$9,$10,$11::date,$12::date,'pending',$13,NOW(),NOW())
     RETURNING *`,
    [
      primaryKey,
      keys,
      input.departmentNameAr,
      input.departmentNameEn,
      input.stage,
      input.studyType,
      input.activityType,
      input.activityTitle,
      input.activityBrief,
      input.organizers,
      input.dateFrom,
      input.dateTo,
      input.locale ?? null,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function listConferenceHallRequests(limit = 200): Promise<ConferenceHallRequestRow[]> {
  const safe = Math.max(1, Math.min(1000, Number(limit) || 200));
  const res = await query(
    `SELECT * FROM conference_hall_requests
     ORDER BY created_at DESC
     LIMIT $1`,
    [safe]
  );
  return res.rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function updateConferenceHallRequestStatus(
  id: string,
  status: ConferenceHallStatus
): Promise<ConferenceHallRequestRow | null> {
  const requestId = String(id || "").trim();
  if (!requestId) return null;
  const res = await query(
    `UPDATE conference_hall_requests
     SET status = $2, updated_at = NOW()
     WHERE id = $1::uuid
     RETURNING *`,
    [requestId, status]
  );
  if (!res.rows.length) return null;
  return mapRow(res.rows[0] as Record<string, unknown>);
}

export async function getConferenceHallRequestById(
  id: string
): Promise<ConferenceHallRequestRow | null> {
  const requestId = String(id || "").trim();
  if (!requestId) return null;
  const res = await query(`SELECT * FROM conference_hall_requests WHERE id = $1::uuid LIMIT 1`, [
    requestId,
  ]);
  if (!res.rows.length) return null;
  return mapRow(res.rows[0] as Record<string, unknown>);
}

/** حجوزات/طلبات متداخلة مع المدى (pending + approved) */
export async function findOverlappingBookings(
  dateFrom: string,
  dateTo: string,
  excludeId?: string
): Promise<ConferenceHallRequestRow[]> {
  const params: Array<string> = [dateFrom, dateTo];
  let excludeSql = "";
  if (excludeId) {
    params.push(excludeId);
    excludeSql = ` AND id <> $${params.length}`;
  }
  const res = await query(
    `SELECT * FROM conference_hall_requests
     WHERE status IN ('pending', 'approved')
       AND date_from <= $2::date
       AND date_to >= $1::date
       ${excludeSql}
     ORDER BY date_from ASC`,
    params
  );
  return res.rows.map((r) => mapRow(r as Record<string, unknown>));
}

function eachDateInclusive(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** أيام مشغولة ضمن شهر/مدى للتقويم: حجوزات القاعة + أحداث الموقع */
export async function getBusyDaysForRange(
  rangeFrom: string,
  rangeTo: string,
  locale: "ar" | "en" = "ar"
): Promise<BusyDay[]> {
  const map = new Map<string, BusyDay>();

  const bookings = await findOverlappingBookings(rangeFrom, rangeTo);
  for (const b of bookings) {
    const label =
      locale === "en"
        ? `${b.departmentNameEn || b.departmentNameAr} — booking`
        : `${b.departmentNameAr} — حجز قاعة`;
    for (const day of eachDateInclusive(b.dateFrom, b.dateTo)) {
      const row = map.get(day) || { date: day, kinds: [], labels: [] };
      if (!row.kinds.includes("booking")) row.kinds.push("booking");
      row.labels.push(label);
      map.set(day, row);
    }
  }

  try {
    const eventsRes = await query(
      `SELECT title_ar, title_en, starts_at, ends_at
       FROM events
       WHERE is_published = true
         AND starts_at::date <= $2::date
         AND COALESCE(ends_at, starts_at)::date >= $1::date`,
      [rangeFrom, rangeTo]
    );
    for (const ev of eventsRes.rows) {
      const from = toDateOnly(ev.starts_at);
      const to = toDateOnly(ev.ends_at) || from;
      if (!from) continue;
      const title =
        locale === "en"
          ? String(ev.title_en || ev.title_ar || "Event")
          : String(ev.title_ar || ev.title_en || "حدث");
      for (const day of eachDateInclusive(from, to < from ? from : to)) {
        if (day < rangeFrom || day > rangeTo) continue;
        const row = map.get(day) || { date: day, kinds: [], labels: [] };
        if (!row.kinds.includes("event")) row.kinds.push("event");
        row.labels.push(title);
        map.set(day, row);
      }
    }
  } catch {
    // جدول الأحداث قد لا يكون متاحًا — نكتفي بالحجوزات
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
