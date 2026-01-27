/**
 * تشغيل migration لإضافة جداول RBAC
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
  const migrationPath = path.join(__dirname, "../prisma/migrations/20260127000002_add_rbac_pages/migration.sql");
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ ملف migration غير موجود: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  
  // تقسيم SQL بشكل ذكي - تجنب تقسيم DO $$ ... END $$;
  const statements = [];
  let currentStatement = "";
  let inDoBlock = false;
  let doBlockDepth = 0;
  
  const lines = sql.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // تخطي التعليقات والأسطر الفارغة
    if (!trimmed || trimmed.startsWith("--")) {
      continue;
    }
    
    currentStatement += line + "\n";
    
    // تتبع DO $$ blocks
    if (trimmed.match(/DO\s+\$\$/i)) {
      inDoBlock = true;
      doBlockDepth = 0;
    }
    
    if (inDoBlock) {
      // حساب عمق الأقواس
      const openCount = (trimmed.match(/\$\$/g) || []).length;
      if (openCount > 0) {
        doBlockDepth += openCount;
      }
      
      // إذا وجدنا END $$;، انتهى الـ block
      if (trimmed.match(/END\s+\$\$/i)) {
        inDoBlock = false;
        doBlockDepth = 0;
      }
    }
    
    // إذا انتهى statement (ليس داخل DO block)
    if (!inDoBlock && trimmed.endsWith(";")) {
      const stmt = currentStatement.trim();
      if (stmt) {
        statements.push(stmt);
      }
      currentStatement = "";
    }
  }
  
  // إضافة آخر statement إن وجد
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  console.log("🚀 بدء تشغيل migration RBAC...\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`📝 تنفيذ statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
          console.log(`✅ تم تنفيذ statement ${i + 1}\n`);
        } catch (error) {
          // تجاهل الأخطاء المتعلقة بـ "already exists"
          if (error.message.includes("already exists") || 
              error.message.includes("duplicate") ||
              error.message.includes("relation") && error.message.includes("already exists")) {
            console.log(`⚠️  تم تخطي statement ${i + 1} (موجود بالفعل)\n`);
          } else {
            console.error(`❌ خطأ في statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    await client.query("COMMIT");
    console.log("✅ اكتمل migration RBAC بنجاح!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ خطأ في migration:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
