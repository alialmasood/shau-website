/**
 * إنشاء مستخدم مدير افتراضي في النظام
 * 
 * الاستخدام:
 *   npm run admin:create-default
 * 
 * هذا السكريبت ينشئ مستخدم مدير افتراضي إذا لم يكن هناك أي مستخدمين في النظام.
 * البريد الافتراضي: admin@shau.edu.iq
 * كلمة المرور الافتراضية: Admin@2024
 * 
 * ⚠️  يجب تغيير كلمة المرور بعد أول تسجيل دخول!
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const bcrypt = require("bcryptjs");
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

const DEFAULT_ADMIN_EMAIL = "admin@shau.edu.iq";
const DEFAULT_ADMIN_PASSWORD = "Admin@2024"; // يجب تغييرها بعد أول تسجيل دخول
const DEFAULT_ADMIN_NAME = "المدير الرئيسي";

async function checkIfUsersExist() {
  const res = await pool.query(`SELECT COUNT(*) as count FROM admin_users`);
  return parseInt(res.rows[0].count, 10) > 0;
}

async function checkIfAdminExists() {
  const res = await pool.query(
    `SELECT id FROM admin_users WHERE lower(email) = lower($1) LIMIT 1`,
    [DEFAULT_ADMIN_EMAIL]
  );
  return res.rows.length > 0;
}

async function createDefaultAdmin() {
  try {
    // التحقق من وجود مستخدمين
    const usersExist = await checkIfUsersExist();
    if (usersExist) {
      console.log("⚠️  يوجد مستخدمين في النظام بالفعل.");
      const adminExists = await checkIfAdminExists();
      if (adminExists) {
        console.log(`✅ المستخدم المدير الافتراضي موجود بالفعل: ${DEFAULT_ADMIN_EMAIL}`);
        console.log("   إذا كنت تريد إعادة تعيين كلمة المرور، استخدم:");
        console.log(`   node scripts/reset-admin-password.js ${DEFAULT_ADMIN_EMAIL} <كلمة_المرور_الجديدة>`);
        await pool.end();
        process.exit(0);
      }
    }

    // تشفير كلمة المرور
    console.log("🔐 جاري تشفير كلمة المرور...");
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // إنشاء المستخدم المدير
    console.log("👤 جاري إنشاء المستخدم المدير الافتراضي...");
    const res = await pool.query(
      `INSERT INTO admin_users (email, password_hash, role, full_name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, role`,
      [DEFAULT_ADMIN_EMAIL, hashedPassword, "ADMIN", DEFAULT_ADMIN_NAME, true]
    );

    const userId = res.rows[0].id;
    console.log(`✅ تم إنشاء المستخدم المدير بنجاح!`);
    console.log(`   البريد الإلكتروني: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   كلمة المرور الافتراضية: ${DEFAULT_ADMIN_PASSWORD}`);
    console.log(`   ⚠️  يرجى تغيير كلمة المرور بعد أول تسجيل دخول!`);
    console.log(`   الدور: ADMIN`);
    console.log(`   الاسم: ${DEFAULT_ADMIN_NAME}`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ خطأ أثناء إنشاء المستخدم المدير:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      console.error(`   المستخدم بالبريد ${DEFAULT_ADMIN_EMAIL} موجود بالفعل.`);
    }
    await pool.end();
    process.exit(1);
  }
}

// تشغيل السكريبت
createDefaultAdmin();
