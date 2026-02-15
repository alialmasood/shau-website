import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { upsertStudentIdCard } from "@/lib/studentIdCardsRepo";

type StudentIdBody = {
  serial: string;
  nameAr: string;
  nameEn: string;
  dob: string;
  address: string;
  addressEn: string;
  bloodType: string;
  department: string;
  departmentEn: string;
  stage: string;
  stageEn: string;
  expiryDate?: string;
  photoMediaId?: string | null;
};

export async function POST(request: Request) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" ||
    (await canAdmin("student-id", "create")) ||
    (await canAdmin("student-id", "edit"));

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as StudentIdBody;
  const serial = String(body?.serial ?? "").trim();
  const nameAr = String(body?.nameAr ?? "").trim();
  const nameEn = String(body?.nameEn ?? "").trim();
  const dobRaw = String(body?.dob ?? "").trim();
  const address = String(body?.address ?? "").trim();
  const addressEn = String(body?.addressEn ?? "").trim();
  const bloodType = String(body?.bloodType ?? "").trim();
  const department = String(body?.department ?? "").trim();
  const departmentEn = String(body?.departmentEn ?? "").trim();
  const stage = String(body?.stage ?? "").trim();
  const stageEn = String(body?.stageEn ?? "").trim();
  const expiryRaw = String(body?.expiryDate ?? "").trim();
  const photoMediaId = body?.photoMediaId ? String(body.photoMediaId) : null;

  if (
    !serial ||
    !nameAr ||
    !nameEn ||
    !dobRaw ||
    !address ||
    !addressEn ||
    !bloodType ||
    !department ||
    !departmentEn ||
    !stage ||
    !stageEn
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  function toDateOnlyString(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function normalizeDateOnly(value: string): string | null {
    const raw = String(value || "").trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parts = raw.split(/[\/\-]/).map((p) => p.trim());
    if (parts.length === 3) {
      const [d, m, y] = parts.map((p) => Number(p));
      if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
        const mm = String(m).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
      }
    }
    const fallback = new Date(raw);
    if (Number.isNaN(fallback.getTime())) return null;
    return toDateOnlyString(fallback);
  }

  const dob = normalizeDateOnly(dobRaw);
  if (!dob) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  /** تاريخ انتهاء ثابت للهوية — يظهر في التحقق عبر QR/الباركود */
  const expiryDate = "2027-01-01";

  const saved = await upsertStudentIdCard({
    serial,
    nameAr,
    nameEn,
    dob,
    address,
    addressEn,
    bloodType,
    department,
    departmentEn,
    stage,
    stageEn,
    expiryDate,
    photoMediaId,
  });

  return NextResponse.json({ ok: true, serial: saved.serial });
}
