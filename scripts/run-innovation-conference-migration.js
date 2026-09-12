/**
 * تشغيل هجرة جداول مؤتمر الابتكار 2026.
 * الاستخدام (محلي فقط بعد موافقة صريحة):
 *   node scripts/run-innovation-conference-migration.js
 *
 * لا يشغّل seed تلقائياً.
 * لا تستخدمه على Production دون أمر صريح.
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442", 10),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

const migrationPath = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260911120000_innovation_conference",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة innovation_conference...\n");
  console.log("الملف:", migrationPath);
  const sql = fs.readFileSync(migrationPath, "utf8");

  // تنفيذ الملف كاملاً لدعم كتل DO $$ ... $$
  try {
    await pool.query(sql);
    console.log("تم تطبيق هجرة innovation_conference بنجاح.");
  } catch (e) {
    if (
      e.code === "42P07" ||
      e.code === "42710" ||
      (e.message && /already exists/i.test(e.message))
    ) {
      console.log("تخطي جزئي (موجود مسبقاً):", e.message);
      return;
    }
    console.error("خطأ:", e.message);
    throw e;
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
  .finally(() => pool.end());
