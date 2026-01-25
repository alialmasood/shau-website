/**
 * إضافة دعم رفع صورة لجدول المحاضرات وجدول الامتحانات في برامج الكلية.
 * الاستخدام: node scripts/run-programs-lectures-exams-images-migration.js
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

const migrationPath = path.join(__dirname, "..", "prisma", "migrations", "20260126100000_programs_lectures_exams_images", "migration.sql");

async function run() {
  console.log("تشغيل هجرة lectures_image_id و exams_image_id...\n");
  let sql = fs.readFileSync(migrationPath, "utf8");
  sql = sql.replace(/^\s*--[^\n]*\n?/gm, "").trim();
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const raw = statements[i].trim();
    const st = raw.endsWith(";") ? raw : raw + ";";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم`);
    } catch (e) {
      const code = e?.code;
      const msg = String(e?.message || "");
      if (code === "42701" || /duplicate column|already exists/i.test(msg)) {
        console.log(`  [${i + 1}/${statements.length}] تخطي (العمود موجود)`);
      } else if (code === "42P07" || /duplicate key|already exists/i.test(msg)) {
        console.log(`  [${i + 1}/${statements.length}] تخطي (القيد موجود)`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
        throw e;
      }
    }
  }
  console.log("\nتم تطبيق الهجرة بنجاح.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
