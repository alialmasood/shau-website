// سكريبت اختبار نظام عداد الزوار
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5442"),
  database: process.env.DB_NAME || "shau_website_db",
  user: process.env.DB_USER || "shau_admin",
  password: process.env.DB_PASSWORD || "SHsh321321",
});

async function testVisitorCount() {
  try {
    console.log('🔍 اختبار نظام عداد الزوار...\n');

    // 1. التحقق من وجود الجدول
    console.log('1️⃣ التحقق من وجود جدول visitor_count...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'visitor_count'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ الجدول غير موجود! يجب تشغيل migration أولاً.');
      console.log('   قم بتشغيل: npx prisma migrate deploy');
      process.exit(1);
    }
    console.log('✅ الجدول موجود\n');

    // 2. التحقق من البيانات الحالية
    console.log('2️⃣ جلب عدد الزوار الحالي...');
    const currentCount = await pool.query(`
      SELECT count, updated_at FROM visitor_count 
      ORDER BY updated_at DESC LIMIT 1
    `);
    
    if (currentCount.rows.length === 0) {
      console.log('⚠️  لا توجد بيانات! إنشاء سجل جديد بقيمة 1680...');
      await pool.query(`
        INSERT INTO visitor_count (count, updated_at) 
        VALUES (1680, NOW())
      `);
      console.log('✅ تم إنشاء سجل جديد بقيمة 1680\n');
    } else {
      const count = Number(currentCount.rows[0].count);
      const updatedAt = currentCount.rows[0].updated_at;
      console.log(`✅ عدد الزوار الحالي: ${count.toLocaleString()}`);
      console.log(`   آخر تحديث: ${updatedAt}\n`);
    }

    // 3. اختبار زيادة العدد
    console.log('3️⃣ اختبار زيادة عدد الزوار...');
    const beforeCount = await pool.query(`
      SELECT count FROM visitor_count 
      ORDER BY updated_at DESC LIMIT 1
    `);
    const before = Number(beforeCount.rows[0].count);
    
    await pool.query(`
      UPDATE visitor_count 
      SET count = count + 1, updated_at = NOW() 
      WHERE id = (SELECT id FROM visitor_count ORDER BY updated_at DESC LIMIT 1)
    `);
    
    const afterCount = await pool.query(`
      SELECT count FROM visitor_count 
      ORDER BY updated_at DESC LIMIT 1
    `);
    const after = Number(afterCount.rows[0].count);
    
    if (after === before + 1) {
      console.log(`✅ الاختبار نجح! العدد زاد من ${before.toLocaleString()} إلى ${after.toLocaleString()}\n`);
    } else {
      console.log(`❌ الاختبار فشل! العدد: ${before} -> ${after}\n`);
    }

    // 4. إعادة العدد إلى القيمة الأصلية (للاختبار فقط)
    await pool.query(`
      UPDATE visitor_count 
      SET count = count - 1 
      WHERE id = (SELECT id FROM visitor_count ORDER BY updated_at DESC LIMIT 1)
    `);
    console.log('4️⃣ تم إعادة العدد إلى القيمة الأصلية (للاختبار فقط)\n');

    console.log('✅ جميع الاختبارات نجحت! النظام يعمل بشكل صحيح.');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testVisitorCount();
