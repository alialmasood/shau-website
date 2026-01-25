/**
 * تشغيل هجرة department_fees يدوياً (بديل عن npx prisma migrate deploy عند مشاكل الشبكة).
 * الاستخدام: node scripts/run-dept-fees-migration.js
 * يُحمّل .env ثم .env.local (مثل Next.js) لتوحيد قاعدة البيانات.
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442"),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

const migrationPath = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260124160000_add_department_fees",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة department_fees...\n");
  const sql = fs.readFileSync(migrationPath, "utf8");

  // تقسيم النص إلى جمل (كل جملة تنتهي ب ; ثم سطر جديد)
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i] + ";";
    const preview = st.slice(0, 60).replace(/\n/g, " ") + "...";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
    } catch (e) {
      if (e.code === "42P07") {
        console.log(`  [${i + 1}/${statements.length}] تخطي (موجود مسبقاً): ${preview}`);
      } else if (e.code === "42710") {
        console.log(`  [${i + 1}/${statements.length}] تخطي (الفهرس/القيد موجود): ${preview}`);
      } else if (e.message && /already exists/i.test(e.message)) {
        console.log(`  [${i + 1}/${statements.length}] تخطي (موجود): ${preview}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
        throw e;
      }
    }
  }

  const check = await pool.query(`SELECT 1 FROM department_fees LIMIT 1`).catch(() => null);
  console.log("\nتم تطبيق هجرة department_fees بنجاح.");
  if (check) console.log("الجدول department_fees موجود ويستجيب.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
