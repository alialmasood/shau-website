/**
 * تشغيل هجرة تحويل حقول VARCHAR(500/400) إلى TEXT في department_fees.
 * معالجة خطأ: value too long for type character varying(500)
 *
 * الاستخدام: node scripts/run-varchar-to-text-migration.js
 * يُحمّل .env ثم .env.local (مثل Next.js).
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
  "20260125100000_department_fees_varchar_to_text",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة varchar-to-text (department_fees)...\n");
  let sql = fs.readFileSync(migrationPath, "utf8");
  sql = sql.replace(/^\s*--[^\n]*$/gm, "").trim();

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^ALTER\s+TABLE/i.test(s));

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i] + ";";
    const preview = st.slice(0, 70).replace(/\n/g, " ");
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
    } catch (e) {
      console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
      throw e;
    }
  }

  console.log("\nتم تطبيق هجرة varchar-to-text بنجاح.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
