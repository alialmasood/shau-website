const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testLoginRedirect() {
  try {
    const email = "registration@shau.edu.iq";
    
    const res = await pool.query(
      `SELECT id, email, custom_url, full_name 
       FROM admin_users 
       WHERE lower(email) = lower($1) 
       LIMIT 1`,
      [email]
    );
    
    if (res.rows.length === 0) {
      console.log("❌ المستخدم غير موجود");
      return;
    }
    
    const user = res.rows[0];
    console.log("\n📋 بيانات المستخدم:");
    console.log(`   البريد: ${user.email}`);
    console.log(`   الاسم: ${user.full_name || "(غير محدد)"}`);
    console.log(`   custom_url: ${user.custom_url || "(فارغ)"}`);
    console.log(`   custom_url type: ${typeof user.custom_url}`);
    console.log(`   custom_url length: ${user.custom_url ? user.custom_url.length : 0}`);
    
    if (user.custom_url) {
      const trimmed = String(user.custom_url).trim();
      console.log(`   trimmed: "${trimmed}"`);
      console.log(`   starts with /admin: ${trimmed.startsWith("/admin")}`);
      console.log(`   Should redirect to: ${trimmed}`);
    } else {
      console.log("   ⚠️  custom_url فارغ - سيتم التوجيه إلى /admin");
    }
    
    await pool.end();
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    await pool.end();
    process.exit(1);
  }
}

testLoginRedirect();
