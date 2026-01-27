/**
 * التحقق من حالة RBAC في قاعدة البيانات
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

async function checkRBACStatus() {
  console.log("🔍 التحقق من حالة RBAC...\n");

  const client = await pool.connect();
  try {
    // 1. التحقق من وجود الجداول
    console.log("📊 التحقق من الجداول...");
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_pages', 'admin_page_permissions')
      ORDER BY table_name
    `);
    
    const existingTables = tablesCheck.rows.map((r) => r.table_name);
    console.log(`✅ الجداول الموجودة: ${existingTables.join(", ") || "لا يوجد"}`);
    
    if (!existingTables.includes("admin_pages")) {
      console.error("❌ جدول admin_pages غير موجود! يجب تشغيل migration أولاً.");
      return;
    }
    if (!existingTables.includes("admin_page_permissions")) {
      console.error("❌ جدول admin_page_permissions غير موجود! يجب تشغيل migration أولاً.");
      return;
    }

    // 2. التحقق من الصفحات
    console.log("\n📄 التحقق من صفحات الإدارة...");
    const pagesResult = await client.query(`SELECT code, name_ar FROM admin_pages ORDER BY code`);
    console.log(`✅ عدد الصفحات: ${pagesResult.rows.length}`);
    if (pagesResult.rows.length > 0) {
      pagesResult.rows.forEach((p) => {
        console.log(`   - ${p.code}: ${p.name_ar}`);
      });
    } else {
      console.warn("⚠️  لا توجد صفحات! يجب تشغيل seed.");
    }

    // 3. التحقق من المستخدم admin
    console.log("\n👤 التحقق من المستخدم admin...");
    const adminResult = await client.query(
      `SELECT id, email, role, is_active FROM admin_users WHERE email = $1`,
      ["admin@shau.edu.iq"]
    );
    
    if (adminResult.rows.length === 0) {
      console.error("❌ المستخدم admin@shau.edu.iq غير موجود!");
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log(`✅ المستخدم موجود:`);
    console.log(`   - ID: ${admin.id}`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Role: ${admin.role}`);
    console.log(`   - Active: ${admin.is_active}`);

    // 4. التحقق من صلاحيات admin
    console.log("\n🔑 التحقق من صلاحيات admin...");
    const permissionsResult = await client.query(
      `SELECT ap.code, ap.name_ar, app.can_access
       FROM admin_page_permissions app
       INNER JOIN admin_pages ap ON app.page_id = ap.id
       WHERE app.admin_user_id = $1
       ORDER BY ap.code`,
      [admin.id]
    );
    
    console.log(`✅ عدد الصلاحيات: ${permissionsResult.rows.length}`);
    if (permissionsResult.rows.length === 0) {
      console.error("❌ لا توجد صلاحيات للمستخدم admin! يجب تشغيل seed.");
    } else {
      permissionsResult.rows.forEach((p) => {
        console.log(`   - ${p.code} (${p.name_ar}): ${p.can_access ? "✅" : "❌"}`);
      });
    }

    // 5. التحقق من صفحة "users" و "required-documents" تحديداً
    console.log("\n🎯 التحقق من صفحات محددة...");
    
    // صفحة users
    const usersPageResult = await client.query(
      `SELECT id, code, name_ar FROM admin_pages WHERE code = 'users'`
    );
    
    if (usersPageResult.rows.length === 0) {
      console.error("❌ صفحة 'users' غير موجودة!");
    } else {
      const usersPage = usersPageResult.rows[0];
      console.log(`✅ صفحة 'users' موجودة: ${usersPage.name_ar}`);
      
      const usersPermissionResult = await client.query(
        `SELECT can_access FROM admin_page_permissions app
         INNER JOIN admin_pages ap ON app.page_id = ap.id
         WHERE app.admin_user_id = $1 AND ap.code = 'users'`,
        [admin.id]
      );
      
      if (usersPermissionResult.rows.length === 0) {
        console.error("❌ لا توجد صلاحيات للمستخدم admin على صفحة 'users'!");
      } else {
        const perm = usersPermissionResult.rows[0];
        console.log(`✅ صلاحيات admin على صفحة 'users': can_access = ${perm.can_access}`);
      }
    }
    
    // صفحة required-documents
    const reqDocsPageResult = await client.query(
      `SELECT id, code, name_ar FROM admin_pages WHERE code = 'required-documents'`
    );
    
    if (reqDocsPageResult.rows.length === 0) {
      console.warn("⚠️  صفحة 'required-documents' غير موجودة! يجب تشغيل seed.");
    } else {
      const reqDocsPage = reqDocsPageResult.rows[0];
      console.log(`✅ صفحة 'required-documents' موجودة: ${reqDocsPage.name_ar}`);
      
      const reqDocsPermissionResult = await client.query(
        `SELECT can_access FROM admin_page_permissions app
         INNER JOIN admin_pages ap ON app.page_id = ap.id
         WHERE app.admin_user_id = $1 AND ap.code = 'required-documents'`,
        [admin.id]
      );
      
      if (reqDocsPermissionResult.rows.length === 0) {
        console.warn("⚠️  لا توجد صلاحيات للمستخدم admin على صفحة 'required-documents'! يجب تشغيل seed.");
      } else {
        const perm = reqDocsPermissionResult.rows[0];
        console.log(`✅ صلاحيات admin على صفحة 'required-documents': can_access = ${perm.can_access}`);
      }
    }

    console.log("\n✅ اكتمل التحقق!");
  } catch (error) {
    console.error("❌ خطأ:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRBACStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
