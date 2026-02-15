import { NextRequest, NextResponse } from "next/server";
import { getStudentIdCardBySerial } from "@/lib/studentIdCardsRepo";
import { verifyToken, formatDateISO } from "@/lib/idSign";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const serial = String(url.searchParams.get("id") ?? "").trim();
  const token = String(url.searchParams.get("t") ?? "").trim();

  if (!serial || !token) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const card = await getStudentIdCardBySerial(serial);
  if (!card) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const valid = verifyToken(card.serial, card.dob, card.expiryDate, token);
  if (!valid) {
    return NextResponse.json({ status: "invalid" }, { status: 200 });
  }

  const today = formatDateISO(new Date());
  const expired = card.expiryDate.slice(0, 10) < today;

  return NextResponse.json({
    status: expired ? "invalid" : "valid",
    data: {
      serial: card.serial,
      name: card.nameAr,
      nameEn: card.nameEn,
      department: card.department,
      stage: card.stage,
      expiryDate: card.expiryDate.slice(0, 10),
      photoMediaId: card.photoMediaId ?? null,
    },
  });
}
