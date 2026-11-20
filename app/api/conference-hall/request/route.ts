import { NextResponse } from "next/server";
import {
  CONFERENCE_HALL_ACTIVITY_TYPES,
  CONFERENCE_HALL_ALL_DEPARTMENTS_KEY,
  CONFERENCE_HALL_STAGES,
  CONFERENCE_HALL_STUDY_TYPES,
  isValidYmd,
  todayLocalYmd,
  type ConferenceHallActivityType,
  type ConferenceHallStage,
  type ConferenceHallStudyType,
} from "@/lib/conferenceHallConfig";
import {
  createConferenceHallRequest,
  findOverlappingBookings,
  getConferenceHallDepartments,
} from "@/lib/conferenceHallRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const rawKeys = (body as { departmentKeys?: unknown }).departmentKeys;
    const allDepartments = Boolean((body as { allDepartments?: unknown }).allDepartments);
    const stage = String((body as { stage?: unknown }).stage ?? "").trim();
    const studyType = String((body as { studyType?: unknown }).studyType ?? "").trim();
    const activityType = String((body as { activityType?: unknown }).activityType ?? "").trim();
    const organizers = String((body as { organizers?: unknown }).organizers ?? "").trim();
    const dateFrom = String((body as { dateFrom?: unknown }).dateFrom ?? "").trim();
    const dateTo = String((body as { dateTo?: unknown }).dateTo ?? "").trim();
    const localeRaw = String((body as { locale?: unknown }).locale ?? "ar").trim();
    const locale = localeRaw === "en" ? "en" : "ar";

    const departmentKeys = Array.isArray(rawKeys)
      ? rawKeys.map((x) => String(x).trim()).filter(Boolean)
      : [];

    if (!allDepartments && departmentKeys.length === 0) {
      return NextResponse.json(
        { error: locale === "en" ? "Select at least one department" : "حدّد قسمًا واحدًا على الأقل" },
        { status: 400 }
      );
    }
    if (!CONFERENCE_HALL_STAGES.some((x) => x.value === stage)) {
      return NextResponse.json({ error: locale === "en" ? "Invalid stage" : "المرحلة غير صالحة" }, { status: 400 });
    }
    if (!CONFERENCE_HALL_STUDY_TYPES.some((x) => x.value === studyType)) {
      return NextResponse.json({ error: locale === "en" ? "Invalid study type" : "نوع الدراسة غير صالح" }, { status: 400 });
    }
    if (!CONFERENCE_HALL_ACTIVITY_TYPES.some((x) => x.value === activityType)) {
      return NextResponse.json({ error: locale === "en" ? "Invalid activity type" : "نوع النشاط غير صالح" }, { status: 400 });
    }
    if (organizers.length < 3) {
      return NextResponse.json(
        { error: locale === "en" ? "Enter the organizers" : "أدخل القائمين على النشاط" },
        { status: 400 }
      );
    }
    if (!isValidYmd(dateFrom) || !isValidYmd(dateTo)) {
      return NextResponse.json({ error: locale === "en" ? "Invalid dates" : "التواريخ غير صالحة" }, { status: 400 });
    }

    const today = todayLocalYmd();
    if (dateFrom < today || dateTo < today) {
      return NextResponse.json(
        { error: locale === "en" ? "Past dates are not allowed" : "لا يمكن اختيار تاريخ قديم" },
        { status: 400 }
      );
    }
    if (dateTo < dateFrom) {
      return NextResponse.json(
        { error: locale === "en" ? "End date must be after start date" : "تاريخ الانتهاء يجب أن يكون بعد البداية" },
        { status: 400 }
      );
    }

    const departments = await getConferenceHallDepartments();
    let nameAr = "";
    let nameEn = "";
    let keysToStore: string[] = [];

    if (allDepartments || departmentKeys.includes(CONFERENCE_HALL_ALL_DEPARTMENTS_KEY)) {
      keysToStore = [CONFERENCE_HALL_ALL_DEPARTMENTS_KEY];
      nameAr = "كل الأقسام";
      nameEn = "All departments";
    } else {
      const selected = departments.filter((d) => departmentKeys.includes(d.key));
      if (selected.length === 0) {
        return NextResponse.json(
          { error: locale === "en" ? "Department not found" : "القسم غير موجود" },
          { status: 400 }
        );
      }
      if (selected.length !== departmentKeys.length) {
        return NextResponse.json(
          { error: locale === "en" ? "One or more departments are invalid" : "واحد أو أكثر من الأقسام غير صالح" },
          { status: 400 }
        );
      }
      keysToStore = selected.map((d) => d.key);
      nameAr = selected.map((d) => d.nameAr).join(" · ");
      nameEn = selected.map((d) => d.nameEn || d.nameAr).join(" · ");
    }

    const overlaps = await findOverlappingBookings(dateFrom, dateTo);
    if (overlaps.length > 0) {
      return NextResponse.json(
        {
          error:
            locale === "en"
              ? "Selected dates overlap with an existing booking"
              : "التواريخ المختارة تتداخل مع حجز موجود",
          overlaps: overlaps.map((o) => ({
            id: o.id,
            from: o.dateFrom,
            to: o.dateTo,
            department: locale === "en" ? o.departmentNameEn || o.departmentNameAr : o.departmentNameAr,
          })),
        },
        { status: 409 }
      );
    }

    const row = await createConferenceHallRequest({
      departmentKeys: keysToStore,
      allDepartments: keysToStore.includes(CONFERENCE_HALL_ALL_DEPARTMENTS_KEY),
      departmentNameAr: nameAr,
      departmentNameEn: nameEn,
      stage: stage as ConferenceHallStage,
      studyType: studyType as ConferenceHallStudyType,
      activityType: activityType as ConferenceHallActivityType,
      organizers,
      dateFrom,
      dateTo,
      locale,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[conference-hall request]", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (/relation .* does not exist|conference_hall_requests/i.test(msg)) {
      return NextResponse.json(
        { error: "جدول الطلبات غير جاهز. شغّل هجرة conference_hall_requests." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "فشل إرسال الطلب" }, { status: 500 });
  }
}
