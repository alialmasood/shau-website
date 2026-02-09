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

  const dob = new Date(dobRaw);
  const expiryDate = expiryRaw ? new Date(expiryRaw) : new Date();
  if (Number.isNaN(dob.getTime()) || Number.isNaN(expiryDate.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (!expiryRaw) {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }

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
