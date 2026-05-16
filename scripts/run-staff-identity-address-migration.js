/**
 * إضافة address و blood_type لجدول staff_identity_requests
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
      port: parseInt(process.env.DB_PORT || "5442", 10),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    "../prisma/migrations/20260517150000_staff_identity_address_blood/migration.sql"
  );
  if (!fs.existsSync(migrationPath)) {
    console.error("❌ ملف migration غير موجود:", migrationPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ تم تطبيق migration: staff_identity address + blood_type");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
