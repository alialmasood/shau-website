/**
 * تشغيل migration لجدول conference_hall_requests
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const fs = require("fs");
const path = require("path");
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

async function runMigration() {
  const migrationPaths = [
    "../prisma/migrations/20260321000001_add_conference_hall_requests/migration.sql",
    "../prisma/migrations/20260321000002_conference_hall_multi_departments/migration.sql",
    "../prisma/migrations/20260321000003_conference_hall_status_completed/migration.sql",
    "../prisma/migrations/20260321000004_conference_hall_activity_title_brief/migration.sql",
  ].map((p) => path.join(__dirname, p));

  for (const migrationPath of migrationPaths) {
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ ملف migration غير موجود: ${migrationPath}`);
      process.exit(1);
    }
  }

  console.log("تشغيل هجرات conference_hall_requests...\n");
  for (const migrationPath of migrationPaths) {
    const sql = fs.readFileSync(migrationPath, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`ملف: ${path.basename(path.dirname(migrationPath))}`);
    for (let i = 0; i < statements.length; i++) {
      const st = statements[i];
      const preview = st.slice(0, 70).replace(/\n/g, " ") + "...";
      try {
        await pool.query(st);
        console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
      } catch (e) {
        if (
          e.code === "42P07" ||
          e.code === "42710" ||
          (e.message && /already exists/i.test(e.message))
        ) {
          console.log(`  [${i + 1}/${statements.length}] تخطي: ${preview}`);
        } else {
          console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
          throw e;
        }
      }
    }
  }
  console.log("\n✅ تم تطبيق هجرات conference_hall_requests بنجاح.");
}

runMigration()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ فشل تطبيق الهجرة:", err);
    pool.end();
    process.exit(1);
  });
