import { query } from "@/lib/db";

export type DashboardStats = {
  newsCount: number;
  programsCount: number;
  applicationsCount: number;
  lastUpdated: string | null;
};

/**
 * إحصائيات لوحة التحكم: عدد الأخبار، البرامج، طلبات التقديم، وآخر تحديث.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [newsRes, programsRes, appsRes, lastRes] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM news`),
    query(`SELECT COUNT(*)::int AS c FROM programs`),
    query(`SELECT COUNT(*)::int AS c FROM applications`),
    query(`
      SELECT GREATEST(
        (SELECT MAX(updated_at) FROM news),
        (SELECT MAX(updated_at) FROM programs),
        (SELECT MAX(updated_at) FROM applications)
      ) AS ts
    `),
  ]);

  const newsCount = Math.max(0, Number(newsRes.rows[0]?.c ?? 0));
  const programsCount = Math.max(0, Number(programsRes.rows[0]?.c ?? 0));
  const applicationsCount = Math.max(0, Number(appsRes.rows[0]?.c ?? 0));
  const raw = lastRes.rows[0]?.ts;
  const lastUpdated = raw ? String(raw) : null;

  return { newsCount, programsCount, applicationsCount, lastUpdated };
}
