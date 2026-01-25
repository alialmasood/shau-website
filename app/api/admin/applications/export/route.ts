import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAllApplications } from "@/lib/applicationsRepo";
import { getCategoryLabel } from "@/lib/deptFeeCategories";

function csvEscape(val: string): string {
  const s = String(val ?? "");
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  let rows: Awaited<ReturnType<typeof getAllApplications>> = [];
  try {
    rows = await getAllApplications();
  } catch {
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }

  const headers = ["الاسم", "المعدل", "القسم", "التصنيف", "رقم الهاتف"];
  const lines: string[] = [headers.map(csvEscape).join(",")];

  for (const r of rows) {
    const cat = r.category ? getCategoryLabel(r.category, "ar") : "—";
    lines.push(
      [r.full_name || "—", r.average || "—", r.department_name, cat, r.phone || "—"].map(csvEscape).join(",")
    );
  }

  const bom = "\uFEFF";
  const csv = bom + lines.join("\r\n");
  const bytes = Buffer.from(csv, "utf-8");

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="applications.csv"',
    },
  });
}
