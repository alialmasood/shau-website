import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - الحصول على عدد الزوار الحالي
export async function GET() {
  try {
    // الحصول على العدد الحالي أو إنشاء سجل جديد إذا لم يكن موجوداً
    let result = await query(
      `SELECT count FROM visitor_count ORDER BY updated_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      // إنشاء سجل جديد بقيمة 1680
      const insertResult = await query(
        `INSERT INTO visitor_count (count, updated_at) VALUES (1680, NOW()) RETURNING count`
      );
      console.log("✅ Created new visitor_count record with value 1680");
      return NextResponse.json({ count: 1680 });
    }

    const count = Number(result.rows[0].count);
    console.log(`📊 Current visitor count: ${count.toLocaleString()}`);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Error fetching visitor count:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitor count", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - زيادة عدد الزوار
export async function POST(request: NextRequest) {
  try {
    // زيادة العدد بمقدار 1
    const result = await query(
      `UPDATE visitor_count 
       SET count = count + 1, updated_at = NOW() 
       WHERE id = (SELECT id FROM visitor_count ORDER BY updated_at DESC LIMIT 1)
       RETURNING count`
    );

    // إذا لم يكن هناك سجل، أنشئ واحداً جديداً
    if (result.rowCount === 0) {
      console.log("⚠️ No visitor_count record found, creating new one with value 1680");
      const newResult = await query(
        `INSERT INTO visitor_count (count, updated_at) VALUES (1680, NOW()) RETURNING count`
      );
      const count = Number(newResult.rows[0].count);
      console.log(`✅ Created new visitor_count record, count: ${count.toLocaleString()}`);
      return NextResponse.json({ count });
    }

    const count = Number(result.rows[0].count);
    console.log(`✅ Visitor count incremented to: ${count.toLocaleString()}`);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Error updating visitor count:", error);
    return NextResponse.json(
      { error: "Failed to update visitor count", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
