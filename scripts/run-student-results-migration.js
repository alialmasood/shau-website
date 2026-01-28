/**
 * تشغيل migration لإضافة جداول نتائج الطلاب
 */
require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const migrationFile = path.join(__dirname, "..", "prisma", "migrations", "20260128000000_add_student_results", "migration.sql");

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL database");

    const sql = fs.readFileSync(migrationFile, "utf8");
    
    // تقسيم SQL إلى statements مع معالجة DO $$ blocks
    const statements = [];
    let currentStatement = "";
    let inDoBlock = false;
    let dollarTag = "";

    const lines = sql.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith("DO $$")) {
        inDoBlock = true;
        dollarTag = "$$";
        currentStatement = line + "\n";
        continue;
      }
      
      if (inDoBlock) {
        currentStatement += line + "\n";
        if (line.endsWith("$$;") || line === "$$;") {
          inDoBlock = false;
          statements.push(currentStatement.trim());
          currentStatement = "";
        }
        continue;
      }
      
      if (line && !line.startsWith("--")) {
        currentStatement += line + "\n";
        if (line.endsWith(";")) {
          statements.push(currentStatement.trim());
          currentStatement = "";
        }
      }
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📄 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt || stmt.trim().length === 0) continue;
      
      try {
        await client.query(stmt);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (error) {
        // تجاهل الأخطاء المتعلقة بالموجود مسبقاً
        if (error.message.includes("already exists") || 
            error.message.includes("duplicate key") ||
            error.message.includes("relation") && error.message.includes("already exists")) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}/${statements.length}:`, error.message);
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
