import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { generateUniqueCode, insertStudentExamCode } from "@/lib/studentExamCodesRepo";

export const dynamic = "force-dynamic";

function normalizeHeader(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function normalizeStage(v: string): string {
  const s = String(v || "").trim();
  const map: Record<string, string> = {
    first: "الاولى",
    second: "الثانية",
    third: "الثالثة",
    fourth: "الرابعة",
    الأولى: "الاولى",
    الثانية: "الثانية",
    الثالثة: "الثالثة",
    الرابعة: "الرابعة",
  };
  return map[s.toLowerCase()] || map[s] || s;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hasAccess =
    String(user.role || "").toUpperCase() === "ADMIN" ||
    (await canAdmin("student-accounts", "access"));
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let buffer: Buffer;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as unknown[][];

  if (rows.length < 2) {
    return NextResponse.json({ error: "الملف فارغ أو يحتوي على header فقط", imported: 0 });
  }

  const headerRow = (rows[0] as unknown[]).map((c) => String(c ?? "").trim());
  const headerMap = new Map<string, number>();
  headerRow.forEach((cell, idx) => {
    if (!cell) return;
    headerMap.set(cell, idx);
    headerMap.set(normalizeHeader(cell), idx);
  });

  const nameIdx =
    headerMap.get(normalizeHeader("Student name")) ??
    headerMap.get("student name") ??
    headerMap.get("name") ??
    headerMap.get("اسم الطالب");
  const deptIdx = headerMap.get(normalizeHeader("department")) ?? headerMap.get("department") ?? headerMap.get("القسم");
  const stageIdx = headerMap.get(normalizeHeader("stage")) ?? headerMap.get("stage") ?? headerMap.get("المرحلة");
  if (nameIdx === undefined || deptIdx === undefined || stageIdx === undefined) {
    return NextResponse.json({
      error: "أعمدة مطلوبة: Student name, department, stage",
      imported: 0,
    });
  }

  let imported = 0;
  const errors: { row: number; error: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const name = String(row[nameIdx] ?? "").trim();
    const department = String(row[deptIdx] ?? "").trim();
    const stage = normalizeStage(String(row[stageIdx] ?? ""));

    if (!name) {
      errors.push({ row: i + 1, error: "اسم الطالب فارغ" });
      continue;
    }

    try {
      const code = await generateUniqueCode();
      await insertStudentExamCode({ code, nameAr: name, department, stage, studyType: "" });
      imported++;
    } catch (err) {
      errors.push({ row: i + 1, error: err instanceof Error ? err.message : "خطأ غير متوقع" });
    }
  }

  return NextResponse.json({ imported, errors, success: true });
}
