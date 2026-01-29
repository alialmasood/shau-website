/**
 * ضبط صلاحيات مستخدم accounts@shau.edu.iq
 * - تحديث الدور إلى ACCOUNTS
 * - منح صلاحيات كاملة لصفحة accounts
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl = process.env.DB_SSL === "true";

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442"),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

const TARGET_EMAIL = "accounts@shau.edu.iq";
const PAGE_CODE = "accounts";

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      `SELECT id, email, role FROM admin_users WHERE email = $1 LIMIT 1`,
      [TARGET_EMAIL]
    );
    if (userRes.rows.length === 0) {
      throw new Error(`المستخدم غير موجود: ${TARGET_EMAIL}`);
    }
    const userId = userRes.rows[0].id;

    await client.query(
      `UPDATE admin_users SET role = 'ACCOUNTS' WHERE id = $1`,
      [userId]
    );

    const pageRes = await client.query(
      `SELECT id FROM admin_pages WHERE code = $1 LIMIT 1`,
      [PAGE_CODE]
    );
    if (pageRes.rows.length === 0) {
      throw new Error(`صفحة الحسابات غير موجودة في admin_pages: ${PAGE_CODE}`);
    }
    const pageId = pageRes.rows[0].id;

    await client.query(
      `INSERT INTO admin_page_permissions
        (admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at)
       VALUES ($1, $2, true, true, true, true, true, true, true, true, NOW(), NOW())
       ON CONFLICT (admin_user_id, page_id) DO UPDATE SET
         can_access = true,
         can_view = true,
         can_create = true,
         can_edit = true,
         can_delete = true,
         can_upload = true,
         can_export = true,
         can_publish = true,
         updated_at = NOW()`,
      [userId, pageId]
    );

    await client.query("COMMIT");
    console.log("✅ تم ضبط المستخدم بنجاح:");
    console.log(`- البريد: ${TARGET_EMAIL}`);
    console.log(`- الدور: ACCOUNTS`);
    console.log(`- الصلاحيات: كاملة على صفحة accounts`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ فشل ضبط المستخدم:", error.message || error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("❌ خطأ غير متوقع:", err);
  process.exit(1);
});
