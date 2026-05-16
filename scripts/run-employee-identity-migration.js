/**
 * تشغيل migration لجدول employee_identity_requests
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
    "../prisma/migrations/20260517120000_employee_identity_requests/migration.sql",
    "../prisma/migrations/20260517130000_employee_identity_number/migration.sql",
    "../prisma/migrations/20260517140000_employee_education_level/migration.sql",
  ].map((p) => path.join(__dirname, p));

  const client = await pool.connect();
  try {
    for (const migrationPath of migrationPaths) {
      if (!fs.existsSync(migrationPath)) {
        console.error("❌ ملف migration غير موجود:", migrationPath);
        process.exit(1);
      }
      const sql = fs.readFileSync(migrationPath, "utf8");
      await client.query(sql);
      console.log("✅", path.basename(path.dirname(migrationPath)));
    }
    console.log("✅ تم تنفيذ migrations هويات الموظفين بنجاح");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((e) => {
  console.error("❌ فشل migration:", e);
  process.exit(1);
});
