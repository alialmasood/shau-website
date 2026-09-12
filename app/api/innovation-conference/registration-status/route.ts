import { NextResponse } from "next/server";
import { getEdition2026, isRegistrationOpen } from "@/lib/innovationConferenceRepo";

export const runtime = "nodejs";

/** حالة فتح التسجيل العامة — بدون بيانات حساسة */
export async function GET() {
  try {
    const edition = await getEdition2026();
    const open = await isRegistrationOpen();
    return NextResponse.json({
      ok: true,
      open,
      eventDate: edition?.eventDate ?? "2026-10-25",
      titleAr: edition?.titleAr ?? "مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026",
      registrationOpensAt: edition?.registrationOpensAt ?? null,
      registrationClosesAt: edition?.registrationClosesAt ?? null,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        open: false,
        eventDate: "2026-10-25",
        titleAr: "مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026",
      },
      { status: 200 }
    );
  }
}
