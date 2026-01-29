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

const migrationPath = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260127000003_add_parent_code_to_admin_pages",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة إضافة parent_code إلى admin_pages...\n");
  
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
      // عد علامات $$
      const dollarMatches = (line.match(/\$\$/g) || []).length;
      doBlockDepth += dollarMatches;
      
      // إذا كان عدد $$ زوجي، انتهى الـ block
      if (doBlockDepth >= 2 && trimmed.match(/END\s*;\s*$/i)) {
        inDoBlock = false;
        doBlockDepth = 0;
      }
    }
    
    // إذا لم نكن في DO block وانتهى السطر بـ ;، أضف statement
    if (!inDoBlock && trimmed.endsWith(";")) {
      const st = currentStatement.trim();
      if (st) {
        statements.push(st);
      }
      currentStatement = "";
    }
  }
  
  // أضف آخر statement إن وجد
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i];
    const preview = st.slice(0, 70).replace(/\n/g, " ") + "...";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] تم: ${preview}`);
    } catch (e) {
      if (e.code === "42P07" || e.code === "42710" || (e.message && /already exists|does not exist/i.test(e.message))) {
        console.log(`  [${i + 1}/${statements.length}] تخطي: ${preview}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] خطأ:`, e.message);
        throw e;
      }
    }
  }

  console.log("\n✅ تم تطبيق هجرة parent_code بنجاح.");
}

run()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ فشل تطبيق الهجرة:", err);
    pool.end();
    process.exit(1);
  });
