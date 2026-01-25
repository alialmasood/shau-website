/**
 * تشغيل هجرة lectures_tables و exams_tables (المرحلة 1-4 × صباحي/مسائي).
 * الاستخدام: node scripts/run-programs-tables-by-stage-shift-migration.js
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
  "20260126200000_programs_tables_by_stage_shift",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة programs (lectures_tables / exams_tables)...\n");
  let sql = fs.readFileSync(migrationPath, "utf8");
  sql = sql.replace(/^\s*--[^\n]*$/gm, "").trim();

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i] + ";";
    const preview = st.slice(0, 65).replace(/\n/g, " ") + "...";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
    } catch (e) {
      if (e.code === "42701") {
        console.log(`  [${i + 1}/${statements.length}] تخطي (العمود موجود مسبقاً): ${preview}`);
      } else if (e.code === "42P07" || e.message?.includes("already exists")) {
        console.log(`  [${i + 1}/${statements.length}] تخطي (موجود): ${preview}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
        throw e;
      }
    }
  }

  console.log("\nتم تطبيق هجرة programs (lectures_tables / exams_tables) بنجاح.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
