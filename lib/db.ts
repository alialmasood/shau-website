import { Pool } from "pg";

// إنشاء connection pool للاتصال بقاعدة البيانات
// ملاحظة: Prisma يعتمد على DATABASE_URL، لذلك نفضّل استخدامه هنا أيضاً لتجنب اختلاف إعدادات dev/prod.
const connectionString = process.env.DATABASE_URL;

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  (process.env.NODE_ENV === "production" && process.env.DB_SSL !== "false");

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      // إعدادات إضافية للأداء
      max: 20, // الحد الأقصى لعدد الاتصالات في الـ pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442"),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
      // إعدادات إضافية للأداء
      max: 20, // الحد الأقصى لعدد الاتصالات في الـ pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

// اختبار الاتصال بقاعدة البيانات
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  // لا نوقف العملية داخل بيئات serverless/Next runtime
});

// دالة لتنفيذ استعلامات SQL
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error", error);
    throw error;
  }
}

// دالة للحصول على العميل من الـ pool
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// تصدير الـ pool للاستخدام المباشر إذا لزم الأمر
export default pool;
