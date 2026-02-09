/**
 * تشغيل migration لإضافة جدول student_id_cards
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
    "../prisma/migrations/20260128000006_add_student_id_cards/migration.sql",
    "../prisma/migrations/20260128000007_add_student_id_address_en/migration.sql",
    "../prisma/migrations/20260128000008_add_student_id_department_en/migration.sql",
    "../prisma/migrations/20260128000009_add_student_id_stage_en/migration.sql",
    "../prisma/migrations/20260128000010_add_student_directory/migration.sql",
  ].map((p) => path.join(__dirname, p));

  for (const migrationPath of migrationPaths) {
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ ملف migration غير موجود: ${migrationPath}`);
      process.exit(1);
    }
  }

  console.log("تشغيل هجرات student_id_cards...\n");
  for (const migrationPath of migrationPaths) {
    const sql = fs.readFileSync(migrationPath, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (let i = 0; i < statements.length; i++) {
      const st = statements[i];
      const preview = st.slice(0, 70).replace(/\n/g, " ") + "...";
      try {
        await pool.query(st);
        console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
      } catch (e) {
        if (e.code === "42P07" || e.code === "42710" || (e.message && /already exists/i.test(e.message))) {
          console.log(`  [${i + 1}/${statements.length}] تخطي: ${preview}`);
        } else {
          console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
          throw e;
        }
      }
    }
  }

  console.log("\n✅ تم تطبيق هجرات student_id_cards بنجاح.");
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
