/**
 * إعادة تعيين كلمة مرور الأدمن أو عرض حسابات الأدمن.
 *
 * الاستخدام:
 *   node scripts/reset-admin-password.js
 *     → يعرض قائمة بريد الأدمن المسجّل في الجدول admin_users
 *
 *   node scripts/reset-admin-password.js <البريد> <كلمة_المرور_الجديدة>
 *     → يحدّث كلمة مرور الحساب المطابق للبريد
 *
 * مثال:
 *   node scripts/reset-admin-password.js admin@shau.edu.iq MyNewPassword123
 *
 * يُحمّل .env ثم .env.local لمتغيرات قاعدة البيانات.
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

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

async function listAdmins() {
  const res = await pool.query(
    `SELECT id, email, role, created_at FROM admin_users ORDER BY created_at ASC`
  );
  if (res.rows.length === 0) {
    console.log("لا يوجد أي حساب أدمن في الجدول admin_users.");
    return;
  }
  console.log("حسابات الأدمن المسجّلة:\n");
  res.rows.forEach((r, i) => {
    console.log(`  ${i + 1}. البريد: ${r.email}  |  الدور: ${r.role}  |  أنشئ: ${r.created_at}`);
  });
  console.log("\nلا يمكن استرجاع كلمة المرور (مشفّرة). لتعيين كلمة جديدة:");
  console.log('  node scripts/reset-admin-password.js "البريد" "كلمة_المرور_الجديدة"');
}

async function resetPassword(email, newPassword) {
  const e = String(email || "").trim();
  const p = String(newPassword || "");

  if (!e || !p) {
    console.error("يجب تمرير البريد وكلمة المرور: node scripts/reset-admin-password.js <البريد> <كلمة_المرور>");
    process.exit(1);
  }

  if (p.length < 6) {
    console.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(p, 10);
  const res = await pool.query(
    `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE lower(email) = lower($2) RETURNING id, email`,
    [hash, e]
  );

  if (res.rows.length === 0) {
    console.error(`لم يُعثر على حساب أدمن بالبريد: ${e}`);
    console.error("شغّل: node scripts/reset-admin-password.js  لعرض القائمة.");
    process.exit(1);
  }

  console.log(`تم تحديث كلمة المرور بنجاح للحساب: ${res.rows[0].email}`);
}

async function run() {
  const [, , email, newPassword] = process.argv;

  if (!email) {
    await listAdmins();
  } else {
    await resetPassword(email, newPassword);
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
