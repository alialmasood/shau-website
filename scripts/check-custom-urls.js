const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCustomUrls() {
  try {
    const res = await pool.query(
      `SELECT id, email, custom_url, full_name FROM admin_users ORDER BY created_at DESC LIMIT 10`
    );
    
    console.log("\n📋 المستخدمون وروابطهم المخصصة:\n");
    res.rows.forEach((r, i) => {
      console.log(`${i + 1}. ${r.email}`);
      console.log(`   الاسم: ${r.full_name || "(غير محدد)"}`);
      console.log(`   الرابط المخصص: ${r.custom_url || "(فارغ)"}`);
      console.log("");
    });
    
    await pool.end();
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    await pool.end();
    process.exit(1);
  }
}

checkCustomUrls();
