import { NextRequest, NextResponse } from "next/server";
import { getStaffIdentityRequestByIdentityNumber } from "@/lib/staffIdentityRequestsRepo";
import { verifyStaffToken } from "@/lib/staffIdentitySign";
import { isValidStaffIdentityNumber } from "@/lib/staffIdentityNumber";

export const runtime = "nodejs";

import { STAFF_IDENTITY_COLLEGE_AR } from "@/lib/staffIdentityQr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const identityNumber = String(url.searchParams.get("id") ?? "").trim();
  const token = String(url.searchParams.get("t") ?? "").trim();

  if (!identityNumber || !token || !isValidStaffIdentityNumber(identityNumber)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const row = await getStaffIdentityRequestByIdentityNumber(identityNumber);
  if (!row || !row.identity_number) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const valid = verifyStaffToken(row.identity_number, row.id, token);
  if (!valid) {
    return NextResponse.json({ status: "invalid" }, { status: 200 });
  }

  return NextResponse.json({
    status: "valid",
    data: {
      identityNumber: row.identity_number,
      nameAr: row.name_ar,
      position: row.position ?? null,
      workplace: row.workplace,
      academicTitle: row.academic_title ?? null,
      photoMediaId: row.photo_media_id,
      issuer: STAFF_IDENTITY_COLLEGE_AR,
    },
  });
}
