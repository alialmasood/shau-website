/**
 * إضافة الصفحات المفقودة إلى جدول admin_pages
 * الصفحات: results, accounts, student-accounts
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

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

const pagesToAdd = [
  {
    code: "results",
    nameAr: "إدارة النتائج",
    nameEn: "Results Management",
    parentCode: null,
  },
  {
    code: "grades",
    nameAr: "إدارة الدرجات",
    nameEn: "Grades Management",
    parentCode: null,
  },
  {
    code: "accounts",
    nameAr: "الحسابات",
    nameEn: "Accounts",
    parentCode: null,
  },
  {
    code: "student-accounts",
    nameAr: "حسابات الطلاب",
    nameEn: "Student Accounts",
    parentCode: null,
  },
];

async function addPages() {
  console.log("🌱 إضافة الصفحات المفقودة إلى admin_pages...\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const page of pagesToAdd) {
      try {
        // التحقق من وجود العمود parent_code أولاً
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'admin_pages' AND column_name = 'parent_code'
        `);

        if (columnCheck.rows.length === 0) {
          console.log(`⚠️  تحذير: عمود parent_code غير موجود. سيتم إضافة الصفحة بدون parent_code.`);
        }

        // إضافة الصفحة
        const insertQuery = columnCheck.rows.length > 0
          ? `INSERT INTO admin_pages (code, name_ar, name_en, parent_code, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (code) DO UPDATE SET
               name_ar = EXCLUDED.name_ar,
               name_en = EXCLUDED.name_en,
               parent_code = EXCLUDED.parent_code,
               updated_at = NOW()`
          : `INSERT INTO admin_pages (code, name_ar, name_en, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (code) DO UPDATE SET
               name_ar = EXCLUDED.name_ar,
               name_en = EXCLUDED.name_en,
               updated_at = NOW()`;

        const params = columnCheck.rows.length > 0
          ? [page.code, page.nameAr, page.nameEn, page.parentCode]
          : [page.code, page.nameAr, page.nameEn];

        await client.query(insertQuery, params);
        console.log(`   ✅ ${page.code} - ${page.nameAr}`);
      } catch (error) {
        console.error(`   ❌ خطأ في إضافة صفحة ${page.code}:`, error.message);
        throw error;
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ تم إضافة/تحديث ${pagesToAdd.length} صفحة بنجاح!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ خطأ في إضافة الصفحات:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
