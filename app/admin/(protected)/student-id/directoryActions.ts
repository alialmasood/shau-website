"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { upsertStudentDirectory } from "@/lib/studentDirectoryRepo";

type ImportDirectoryResult = {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
};

function normalizeHeader(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function parseDob(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  // دعم صيغة: 31/7/2005 أو 31-7-2005
  const parts = raw.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => Number(p));
    if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export async function importStudentDirectory(fileBase64: string): Promise<ImportDirectoryResult> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("student-id", "create"));
  if (!hasAccess) {
    throw new Error("ليس لديك صلاحية لاستيراد دليل الطلبة");
  }

  const buffer = Buffer.from(fileBase64, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];

  if (rows.length < 2) {
    return { success: false, imported: 0, skipped: 0, errors: [{ row: 1, error: "الملف فارغ" }] };
  }

  const headerRow = rows[0];
  const headerMap = new Map<string, number>();
  headerRow.forEach((cell: any, idx: number) => {
    const original = String(cell ?? "").trim();
    if (!original) return;
    headerMap.set(original, idx);
    headerMap.set(normalizeHeader(original), idx);
  });

  const required = ["name_ar", "name_en", "dob", "address", "blood_type", "department", "stage"];
  const missing = required.filter((key) => !headerMap.has(key));
  if (missing.length > 0) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [{ row: 1, error: `أعمدة مفقودة: ${missing.join(", ")}` }],
    };
  }

  let imported = 0;
  let skipped = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => String(cell ?? "").trim() === "")) {
      continue;
    }

    const getValue = (key: string): string => {
      const colIndex = headerMap.get(key);
      if (colIndex === undefined) return "";
      return String(row[colIndex] ?? "").trim();
    };

    const nameAr = getValue("name_ar");
    const nameEn = getValue("name_en");
    const dobRaw = row[headerMap.get("dob") as number];
    const address = getValue("address");
    const bloodType = getValue("blood_type");
    const department = getValue("department");
    const stage = getValue("stage");

    const dob = parseDob(dobRaw);
    if (!nameAr || !nameEn || !dob || !address || !bloodType || !department || !stage) {
      skipped++;
      errors.push({ row: i + 1, error: "بيانات ناقصة أو تاريخ ميلاد غير صالح" });
      continue;
    }

    await upsertStudentDirectory({
      nameAr,
      nameEn,
      dob,
      address,
      bloodType,
      department,
      stage,
    });
    imported++;
  }

  revalidatePath("/admin/student-id");
  return { success: true, imported, skipped, errors };
}
