/**
 * التحقق من المستخدمين في قاعدة البيانات
 * 
 * الاستخدام:
 *   npm run admin:check-users
 * 
 * يعرض قائمة بجميع المستخدمين في قاعدة البيانات
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

async function checkUsers() {
  try {
    console.log("🔍 جاري التحقق من المستخدمين في قاعدة البيانات...\n");
    
    const res = await pool.query(
      `SELECT id, email, role, full_name, is_active, custom_url, created_at, updated_at
       FROM admin_users
       ORDER BY created_at DESC`
    );

    if (res.rows.length === 0) {
      console.log("❌ لا يوجد مستخدمين في قاعدة البيانات.");
      console.log("\n💡 لإنشاء مستخدم مدير افتراضي، شغّل:");
      console.log("   npm run admin:create-default");
      await pool.end();
      process.exit(0);
    }

    console.log(`✅ تم العثور على ${res.rows.length} مستخدم:\n`);
    
    res.rows.forEach((user, index) => {
      console.log(`${index + 1}. البريد: ${user.email}`);
      console.log(`   الدور: ${user.role}`);
      console.log(`   الاسم: ${user.full_name || "—"}`);
      console.log(`   الحالة: ${user.is_active ? "✅ نشط" : "❌ معطل"}`);
      console.log(`   الرابط المخصص: ${user.custom_url || "—"}`);
      console.log(`   أنشئ: ${new Date(user.created_at).toLocaleString('ar-IQ')}`);
      console.log(`   آخر تحديث: ${new Date(user.updated_at).toLocaleString('ar-IQ')}`);
      console.log(`   ID: ${user.id}`);
      console.log("");
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ خطأ أثناء التحقق من المستخدمين:", error);
    if (error.code === "42P01") {
      console.error("   الجدول admin_users غير موجود. تأكد من تشغيل migrations.");
    } else if (error.code === "ECONNREFUSED") {
      console.error("   فشل الاتصال بقاعدة البيانات. تحقق من إعدادات DATABASE_URL.");
    }
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
