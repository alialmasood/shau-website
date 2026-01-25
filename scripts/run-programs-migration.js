/**
 * تشغيل هجرة programs (برامج الكلية) يدوياً.
 * الاستخدام: node scripts/run-programs-migration.js
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

const migrationPath = path.join(__dirname, "..", "prisma", "migrations", "20260126000000_add_programs", "migration.sql");

async function run() {
  console.log("تشغيل هجرة programs...\n");
  let sql = fs.readFileSync(migrationPath, "utf8");
  sql = sql.replace(/^\s*--[^\n]*$/gm, "").trim();

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i] + ";";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم`);
    } catch (e) {
      if (e.code === "42P07" || e.code === "42710" || (e.message && /already exists/i.test(e.message))) {
        console.log(`  [${i + 1}/${statements.length}] تخطي (موجود)`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
        throw e;
      }
    }
  }
  console.log("\nتم تطبيق هجرة programs بنجاح.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
