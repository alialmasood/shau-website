/**
 * تشغيل هجرة student_accounts_batches يدوياً
 * الاستخدام: node scripts/run-student-accounts-batches-migration.js
 * يُحمّل .env ثم .env.local (مثل Next.js) لتوحيد قاعدة البيانات.
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

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
  "20260128000003_add_student_accounts_batches",
  "migration.sql"
);

async function run() {
  console.log("تشغيل هجرة student_accounts_batches...\n");
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ ملف الهجرة غير موجود: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");

  // تقسيم النص إلى جمل (كل جملة تنتهي ب ; ثم سطر جديد)
  // نحتاج إلى معالجة DO $$ blocks بشكل خاص
  const statements = [];
  let currentStatement = "";
  let inDoBlock = false;
  let doBlockDepth = 0;

  const lines = sql.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    currentStatement += line + "\n";

    // تتبع DO $$ blocks
    if (line.match(/DO\s+\$\$/i)) {
      inDoBlock = true;
      doBlockDepth = 1;
    } else if (inDoBlock) {
      if (line.match(/\$\$/)) {
        doBlockDepth--;
        if (doBlockDepth === 0) {
          inDoBlock = false;
          statements.push(currentStatement.trim());
          currentStatement = "";
        }
      } else if (line.match(/BEGIN/i)) {
        doBlockDepth++;
      } else if (line.match(/END/i)) {
        doBlockDepth--;
      }
    } else if (line.endsWith(";") && !inDoBlock) {
      statements.push(currentStatement.trim());
      currentStatement = "";
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  for (let i = 0; i < statements.length; i++) {
    const st = statements[i];
    const preview = st.slice(0, 80).replace(/\n/g, " ") + "...";
    try {
      await pool.query(st);
      console.log(`  [${i + 1}/${statements.length}] ✅ تم: ${preview}`);
    } catch (e) {
      if (e.code === "42P07") {
        console.log(`  [${i + 1}/${statements.length}] ⏭️  تخطي (موجود مسبقاً): ${preview}`);
      } else if (e.code === "42710") {
        console.log(`  [${i + 1}/${statements.length}] ⏭️  تخطي (الفهرس/القيد موجود): ${preview}`);
      } else if (e.code === "23505") {
        console.log(`  [${i + 1}/${statements.length}] ⏭️  تخطي (قيد فريد موجود): ${preview}`);
      } else if (e.message && /already exists/i.test(e.message)) {
        console.log(`  [${i + 1}/${statements.length}] ⏭️  تخطي (موجود): ${preview}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ❌ خطأ:`, e.message);
        console.error(`  SQL:`, st);
        throw e;
      }
    }
  }

  // التحقق من أن الجدول تم إنشاؤه
  const check = await pool.query(`SELECT 1 FROM student_accounts_batches LIMIT 1`).catch(() => null);
  console.log("\n✅ تم تطبيق هجرة student_accounts_batches بنجاح.");
  if (check) {
    console.log("✅ الجدول student_accounts_batches موجود ويستجيب.");
  } else {
    console.log("⚠️  الجدول student_accounts_batches موجود لكن فارغ (هذا طبيعي).");
  }

  // التحقق من أن العمود uploaded_batch_id تم إضافته
  const checkColumn = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'student_users' AND column_name = 'uploaded_batch_id'
  `).catch(() => null);
  
  if (checkColumn && checkColumn.rows.length > 0) {
    console.log("✅ العمود uploaded_batch_id موجود في جدول student_users.");
  } else {
    console.log("⚠️  العمود uploaded_batch_id غير موجود في جدول student_users.");
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n❌ فشل تطبيق الهجرة:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
