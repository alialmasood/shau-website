/**
 * تشغيل migration لجدول كودات الطلبة الامتحانية
 */
require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const migrationFile = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260126120000_add_student_exam_codes",
  "migration.sql"
);

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL database");

    const sql = fs.readFileSync(migrationFile, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.replace(/^\s*--[^\n]*\n?/gm, "").trim())
      .filter((s) => s.length > 0);

    console.log(`📄 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ";";
      try {
        await client.query(stmt);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
