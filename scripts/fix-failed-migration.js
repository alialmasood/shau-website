/**
 * Script لإصلاح migrations الفاشلة في قاعدة البيانات
 * الاستخدام: 
 *   node scripts/fix-failed-migration.js                    - لإصلاح جميع migrations الفاشلة
 *   node scripts/fix-failed-migration.js <migration_name>   - لإصلاح migration محدد
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442"),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

async function fixFailedMigration(migrationName = null) {
  console.log("جارٍ التحقق من migrations الفاشلة...\n");

  try {
    let checkRes;
    
    if (migrationName) {
      // التحقق من migration محدد
      checkRes = await pool.query(
        `SELECT migration_name, finished_at, applied_steps_count, started_at
         FROM "_prisma_migrations"
         WHERE migration_name = $1 AND finished_at IS NULL`,
        [migrationName]
      );
    } else {
      // البحث عن جميع migrations الفاشلة
      checkRes = await pool.query(
        `SELECT migration_name, finished_at, applied_steps_count, started_at
         FROM "_prisma_migrations"
         WHERE finished_at IS NULL
         ORDER BY started_at DESC`
      );
    }

    if (checkRes.rows.length === 0) {
      console.log("✅ لا يوجد migrations فاشلة. كل شيء على ما يرام.");
      return;
    }

    console.log(`تم العثور على ${checkRes.rows.length} migration(s) فاشل(ة):\n`);
    checkRes.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.migration_name}`);
      console.log(`   بدأ في: ${row.started_at}`);
      console.log(`   خطوات مطبقة: ${row.applied_steps_count}\n`);
    });

    console.log("جارٍ حذف السجلات الفاشلة...\n");

    // حذف جميع migrations الفاشلة
    for (const row of checkRes.rows) {
      const deleteRes = await pool.query(
        `DELETE FROM "_prisma_migrations"
         WHERE migration_name = $1 AND finished_at IS NULL
         RETURNING migration_name`,
        [row.migration_name]
      );

      if (deleteRes.rows.length > 0) {
        console.log(`✅ تم حذف migration الفاشل: ${deleteRes.rows[0].migration_name}`);
      }
    }

    console.log("\n✅ تم حذف جميع migrations الفاشلة بنجاح!");
    console.log("\nيمكنك الآن تشغيل: npx prisma migrate deploy");
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    throw error;
  }
}

// الحصول على migration name من arguments إذا كان موجوداً
const migrationName = process.argv[2] || null;

fixFailedMigration(migrationName)
  .then(() => {
    console.log("\n✅ تم إصلاح المشكلة بنجاح!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("\n❌ فشل إصلاح المشكلة:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
