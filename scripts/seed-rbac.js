/**
 * Seed بيانات RBAC (صفحات الإدارة والصلاحيات)
 * يتم اكتشاف الصفحات تلقائياً من بنية المجلدات
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { discoverAllPages } = require("./discover-admin-pages");

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

async function seed() {
  console.log("🌱 بدء seed قاعدة البيانات...\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. اكتشاف صفحات الإدارة تلقائياً من بنية المجلدات
    console.log("🔍 اكتشاف صفحات الإدارة من بنية المجلدات...");
    const discoveredPages = discoverAllPages();
    console.log(`✅ تم اكتشاف ${discoveredPages.length} صفحة:\n`);
    discoveredPages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.code} - ${page.nameAr}`);
    });
    console.log();
    
    const pages = discoveredPages;

    console.log("📄 إنشاء صفحات الإدارة...");
    for (const page of pages) {
      try {
        // ملاحظة: parentCode لا يُحفظ في قاعدة البيانات حالياً
        // يمكن إضافته لاحقاً إذا لزم الأمر
        await client.query(
          `INSERT INTO admin_pages (code, name_ar, name_en, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (code) DO UPDATE SET
             name_ar = EXCLUDED.name_ar,
             name_en = EXCLUDED.name_en,
             updated_at = NOW()`,
          [page.code, page.nameAr, page.nameEn || null]
        );
        const parentInfo = page.parentCode ? ` (تحت: ${page.parentCode})` : "";
        console.log(`   ✅ ${page.code} - ${page.nameAr}${parentInfo}`);
      } catch (error) {
        console.error(`   ❌ خطأ في إضافة صفحة ${page.code}:`, error.message);
      }
    }
    console.log(`\n✅ تم إنشاء/تحديث ${pages.length} صفحة\n`);

    // 2. البحث عن المستخدم admin@shau.edu.iq أو إنشاؤه
    console.log("👤 البحث عن المستخدم admin@shau.edu.iq...");
    let adminUserResult = await client.query(
      `SELECT id, email FROM admin_users WHERE email = $1`,
      ["admin@shau.edu.iq"]
    );

    let adminUserId;
    if (adminUserResult.rows.length === 0) {
      console.log("🔐 إنشاء المستخدم admin@shau.edu.iq...");
      const hashedPassword = await bcrypt.hash("Admin@2024", 10);
      const insertResult = await client.query(
        `INSERT INTO admin_users (email, password_hash, role, full_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        ["admin@shau.edu.iq", hashedPassword, "ADMIN", "المدير الرئيسي", true]
      );
      adminUserId = insertResult.rows[0].id;
      console.log("✅ تم إنشاء المستخدم\n");
    } else {
      adminUserId = adminUserResult.rows[0].id;
      console.log("✅ المستخدم موجود بالفعل\n");
    }

    // 3. إعطاء صلاحيات كاملة للمستخدم admin على جميع الصفحات
    console.log("🔑 إعطاء صلاحيات كاملة للمستخدم admin...");
    const allPagesResult = await client.query(`SELECT id FROM admin_pages ORDER BY code`);

    for (const pageRow of allPagesResult.rows) {
      await client.query(
        `INSERT INTO admin_page_permissions 
         (admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at)
         VALUES ($1, $2, true, true, true, true, true, true, true, true, NOW(), NOW())
         ON CONFLICT (admin_user_id, page_id) DO UPDATE SET
           can_access = true,
           can_view = true,
           can_create = true,
           can_edit = true,
           can_delete = true,
           can_upload = true,
           can_export = true,
           can_publish = true,
           updated_at = NOW()`,
        [adminUserId, pageRow.id]
      );
    }
    console.log(`✅ تم إعطاء صلاحيات كاملة على ${allPagesResult.rows.length} صفحة\n`);

    await client.query("COMMIT");
    console.log("✅ اكتمل seed قاعدة البيانات بنجاح!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ خطأ في seed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
