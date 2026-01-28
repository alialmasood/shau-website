require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running student user fields migration...");
    
    const migrationPath = path.join(
      __dirname,
      "../prisma/migrations/20260128000003_add_student_user_fields/migration.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");
    
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
