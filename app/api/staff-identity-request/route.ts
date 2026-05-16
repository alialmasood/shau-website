import { NextResponse } from "next/server";
import {
  createStaffIdentityRequest,
  mediaExists,
} from "@/lib/staffIdentityRequestsRepo";
import {
  isValidArabicAddress,
  isValidArabicFullName,
  isValidArabicOptional,
  isValidArabicWorkplace,
  isValidBloodType,
  isValidEnglishFullName,
  isValidIraqiMobile,
  isValidShauUniversityEmail,
} from "@/lib/staffIdentityRequestValidation";

export const runtime = "nodejs";

function todayLocalYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** تاريخ صالح YYYY-MM-DD وأقدم من اليوم (لا يُقبل اليوم ولا المستقبل). */
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
    const bloodType = String((body as { bloodType?: unknown }).bloodType ?? "").trim();
    const academicTitleRaw = (body as { academicTitle?: unknown }).academicTitle;
    const academicTitle =
      academicTitleRaw == null || academicTitleRaw === ""
        ? null
        : String(academicTitleRaw).trim() || null;
    const workplace = String((body as { workplace?: unknown }).workplace ?? "").trim();
    const positionRaw = (body as { position?: unknown }).position;
    const position =
      positionRaw == null || positionRaw === ""
        ? null
        : String(positionRaw).trim() || null;
    const phone = String((body as { phone?: unknown }).phone ?? "").trim();
    const universityEmail = String(
      (body as { universityEmail?: unknown }).universityEmail ?? ""
    ).trim();
    const photoMediaId = String((body as { photoMediaId?: unknown }).photoMediaId ?? "").trim();
    const localeRaw = (body as { locale?: unknown }).locale;
    const locale =
      localeRaw == null ? null : String(localeRaw).trim().slice(0, 10) || null;
    const ui = locale === "en" ? "en" : "ar";
    const err = (ar: string, en: string) => (ui === "en" ? en : ar);

    if (!isValidArabicFullName(nameAr)) {
      return NextResponse.json(
        {
          error: err(
            "الاسم بالعربية مطلوب ويجب أن يحتوي على حروف عربية فقط (دون أحرف إنجليزية أو أرقام لاتينية).",
            "Arabic full name is required and must contain Arabic letters only (no English letters or Western digits)."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidEnglishFullName(nameEn)) {
      return NextResponse.json(
        {
          error: err(
            "الاسم بالإنجليزية مطلوب ويجب أن يحتوي على حروف إنجليزية فقط (A–Z).",
            "English full name is required and must use English letters only (A–Z), spaces, apostrophe, hyphen, or period."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidPastBirthDate(dateOfBirth)) {
      return NextResponse.json(
        {
          error: err(
            "تاريخ التولد يجب أن يكون في الماضي (قبل اليوم)",
            "Date of birth must be in the past (before today)"
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidArabicAddress(address)) {
      return NextResponse.json(
        {
          error: err(
            "عنوان السكن مطلوب (5 أحرف على الأقل) وبالعربية فقط.",
            "Home address is required (at least 5 characters) and must be in Arabic only."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidBloodType(bloodType)) {
      return NextResponse.json(
        {
          error: err("فصيلة الدم مطلوبة ويجب اختيارها من القائمة.", "Blood type is required and must be selected from the list."),
        },
        { status: 400 }
      );
    }
    if (!isValidArabicWorkplace(workplace)) {
      return NextResponse.json(
        {
          error: err(
            "مكان العمل (القسم) مطلوب وبالعربية فقط (دون أحرف إنجليزية أو أرقام لاتينية).",
            "Department is required and must be in Arabic only (no English letters or Western digits)."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidArabicOptional(academicTitle)) {
      return NextResponse.json(
        {
          error: err(
            "اللقب العلمي إن وُجد يجب أن يكون بالعربية فقط.",
            "Academic title, if provided, must be in Arabic only."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidArabicOptional(position)) {
      return NextResponse.json(
        {
          error: err(
            "المنصب إن وُجد يجب أن يكون بالعربية فقط.",
            "Position, if provided, must be in Arabic only."
          ),
        },
        { status: 400 }
      );
    }
    const phoneNorm = phone.replace(/\D/g, "");
    if (!isValidIraqiMobile(phoneNorm)) {
      return NextResponse.json(
        {
          error: err(
            "رقم الهاتف يجب أن يكون عراقياً: 11 رقماً يبدأ بـ 07 (مثال 07XXXXXXXXX).",
            "Phone must be an Iraqi mobile: 11 digits starting with 07 (e.g. 07XXXXXXXXX)."
          ),
        },
        { status: 400 }
      );
    }
    if (!isValidShauUniversityEmail(universityEmail)) {
      return NextResponse.json(
        {
          error: err(
            "يُقبل البريد الجامعي الرسمي المنتهي بـ @shau.edu.iq فقط.",
            "Only official university email ending with @shau.edu.iq is accepted."
          ),
        },
        { status: 400 }
      );
    }
    if (!photoMediaId) {
      return NextResponse.json(
        { error: err("الصورة الشخصية مطلوبة", "Personal photo is required") },
        { status: 400 }
      );
    }

    const okMedia = await mediaExists(photoMediaId);
    if (!okMedia) {
      return NextResponse.json(
        { error: err("معرّف الصورة غير صالح", "Invalid photo reference") },
        { status: 400 }
      );
    }

    const id = await createStaffIdentityRequest({
      nameAr,
      nameEn,
      dateOfBirth,
      address,
      bloodType,
      academicTitle,
      workplace,
      position,
      phone: phoneNorm,
      universityEmail: universityEmail.trim().toLowerCase(),
      photoMediaId,
      locale,
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error("[staff-identity-request POST]", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
