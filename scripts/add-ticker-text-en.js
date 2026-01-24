/**
 * إضافة العمود text_en لجدول ticker_items إن لم يكن موجوداً.
 * التشغيل: node scripts/add-ticker-text-en.js
 * (يُحمّل .env تلقائياً إن وُجد في جذر المشروع)
 */
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442", 10),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

async function run() {
  try {
    // التحقق إن العمود موجود مسبقاً
    const check = await pool.query(`
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'ticker_items' AND column_name = 'text_en'
    `);
    if (check.rows.length > 0) {
      console.log("✅ العمود text_en موجود مسبقاً. لا حاجة لأي تغيير.");
      return;
    }

    await pool.query(`
      ALTER TABLE "ticker_items" ADD COLUMN "text_en" VARCHAR(400)
    `);
    console.log("✅ تم إضافة العمود text_en إلى جدول ticker_items بنجاح.");
  } catch (e) {
    console.error("❌ خطأ:", e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
