import { NextResponse } from "next/server";
import {
  createEmployeeIdentityRequest,
  employeeMediaExists,
} from "@/lib/employeeIdentityRequestsRepo";
import {
  isValidArabicAddress,
  isValidArabicFullName,
  isValidArabicOptional,
  isValidArabicWorkplace,
  isValidBloodType,
  isValidEducationLevel,
  isValidEnglishFullName,
  isValidIraqiMobile,
  isValidJobCategory,
  isValidOptionalEmail,
} from "@/lib/employeeIdentityRequestValidation";

export const runtime = "nodejs";

function todayLocalYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidPastBirthDate(s: string): boolean {
  const trimmed = s.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return false;
  return trimmed < todayLocalYmd();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const nameAr = String((body as { nameAr?: unknown }).nameAr ?? "").trim();
    const nameEn = String((body as { nameEn?: unknown }).nameEn ?? "").trim();
    const dateOfBirth = String((body as { dateOfBirth?: unknown }).dateOfBirth ?? "").trim();
    const address = String((body as { address?: unknown }).address ?? "").trim();
    const phone = String((body as { phone?: unknown }).phone ?? "").trim();
    const bloodType = String((body as { bloodType?: unknown }).bloodType ?? "").trim();
    const educationLevel = String((body as { educationLevel?: unknown }).educationLevel ?? "").trim();
    const workplace = String((body as { workplace?: unknown }).workplace ?? "").trim();
    const jobCategory = String((body as { jobCategory?: unknown }).jobCategory ?? "").trim();
    const positionRaw = (body as { position?: unknown }).position;
    const position =
      positionRaw == null || positionRaw === "" ? null : String(positionRaw).trim() || null;
    const officialEmailRaw = (body as { officialEmail?: unknown }).officialEmail;
    const officialEmail =
      officialEmailRaw == null || officialEmailRaw === ""
        ? null
        : String(officialEmailRaw).trim().toLowerCase() || null;
    const photoMediaId = String((body as { photoMediaId?: unknown }).photoMediaId ?? "").trim();
    const localeRaw = (body as { locale?: unknown }).locale;
    const locale =
      localeRaw == null ? null : String(localeRaw).trim().slice(0, 10) || null;

    if (!isValidArabicFullName(nameAr)) {
      return NextResponse.json({ error: "الاسم بالعربية غير صالح" }, { status: 400 });
    }
    if (!isValidEnglishFullName(nameEn)) {
      return NextResponse.json({ error: "الاسم بالإنجليزية غير صالح" }, { status: 400 });
    }
    if (!isValidPastBirthDate(dateOfBirth)) {
      return NextResponse.json({ error: "تاريخ التولد يجب أن يكون في الماضي" }, { status: 400 });
    }
    if (!isValidArabicAddress(address)) {
      return NextResponse.json({ error: "عنوان السكن غير صالح" }, { status: 400 });
    }
    const phoneNorm = phone.replace(/\D/g, "");
    if (!isValidIraqiMobile(phoneNorm)) {
      return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
    }
    if (!isValidBloodType(bloodType)) {
      return NextResponse.json({ error: "فصيلة الدم غير صالحة" }, { status: 400 });
    }
    if (!isValidEducationLevel(educationLevel)) {
      return NextResponse.json({ error: "التحصيل العلمي غير صالح" }, { status: 400 });
    }
    if (!isValidArabicWorkplace(workplace)) {
      return NextResponse.json({ error: "مكان العمل غير صالح" }, { status: 400 });
    }
    if (!isValidJobCategory(jobCategory)) {
      return NextResponse.json({ error: "الوظيفة غير صالحة" }, { status: 400 });
    }
    if (!isValidArabicOptional(position)) {
      return NextResponse.json({ error: "المنصب يجب أن يكون بالعربية" }, { status: 400 });
    }
    if (!isValidOptionalEmail(officialEmail)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }
    if (!photoMediaId) {
      return NextResponse.json({ error: "الصورة الشخصية مطلوبة" }, { status: 400 });
    }
    if (!(await employeeMediaExists(photoMediaId))) {
      return NextResponse.json({ error: "معرّف الصورة غير صالح" }, { status: 400 });
    }

    const id = await createEmployeeIdentityRequest({
      nameAr,
      nameEn,
      dateOfBirth,
      address,
      phone: phoneNorm,
      bloodType,
      educationLevel,
      workplace,
      jobCategory,
      position,
      officialEmail,
      photoMediaId,
      locale,
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error("[employee-identity-request POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
