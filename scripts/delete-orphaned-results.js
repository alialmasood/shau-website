/**
 * حذف سجلات النتائج اليتيمة (التي لا ترتبط بأي دفعة استيراد)
 * هذه السجلات بقيت بسبب السلوك القديم لـ deleteBatch الذي كان يلغي الربط فقط دون حذف النتائج
 *
 * Usage: node scripts/delete-orphaned-results.js
 */

require("dotenv/config");
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

async function query(text, params) {
  return pool.query(text, params);
}

async function deleteOrphanedResults() {
  console.log("🔍 البحث عن سجلات النتائج اليتيمة (uploaded_batch_id IS NULL)...\n");

  try {
    const countRes = await query(
      "SELECT COUNT(*) AS cnt FROM results WHERE uploaded_batch_id IS NULL"
    );
    const count = parseInt(countRes.rows[0]?.cnt || "0", 10);

    if (count === 0) {
      console.log("✅ لا توجد سجلات يتيمة لحذفها.");
      return;
    }

    console.log(`📋 عدد السجلات اليتيمة: ${count}`);
    console.log("🗑️  جاري الحذف...\n");

    const deleteRes = await query(
      "DELETE FROM results WHERE uploaded_batch_id IS NULL RETURNING id"
    );

    console.log(`✅ تم حذف ${deleteRes.rowCount} سجل بنجاح.`);
  } catch (error) {
    console.error("\n❌ خطأ أثناء الحذف:", error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

deleteOrphanedResults();
