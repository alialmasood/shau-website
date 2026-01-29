/**
 * Script to clear all student-related data for testing
 * WARNING: This will delete ALL students, results, and batches!
 * 
 * Usage: node scripts/clear-student-data.js
 */

require("dotenv/config");
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

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function clearStudentData() {
  console.log("⚠️  WARNING: This will delete ALL student data!");
  console.log("Starting deletion...\n");

  try {
    // Delete in order: results -> student_users -> students -> batches
    // (to respect foreign key constraints)

    console.log("1. Deleting results...");
    const resultsRes = await query("DELETE FROM results RETURNING id");
    console.log(`   ✅ Deleted ${resultsRes.rowCount} results`);

    console.log("2. Deleting student users...");
    const usersRes = await query("DELETE FROM student_users RETURNING id");
    console.log(`   ✅ Deleted ${usersRes.rowCount} student users`);

    console.log("3. Deleting students...");
    const studentsRes = await query("DELETE FROM students RETURNING id");
    console.log(`   ✅ Deleted ${studentsRes.rowCount} students`);

    console.log("4. Deleting results batches...");
    const batchesRes = await query("DELETE FROM results_batches RETURNING id");
    console.log(`   ✅ Deleted ${batchesRes.rowCount} batches`);

    console.log("\n✅ All student data cleared successfully!");
    console.log("\nYou can now start fresh with new imports.");
  } catch (error) {
    console.error("\n❌ Error clearing data:", error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the script
clearStudentData();
