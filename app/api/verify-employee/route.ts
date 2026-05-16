import { NextRequest, NextResponse } from "next/server";
import { educationLevelLabelAr, jobCategoryLabelAr } from "@/lib/employeeIdentityConfig";
import { isValidEmployeeIdentityNumber } from "@/lib/employeeIdentityNumber";
import { getEmployeeIdentityRequestByIdentityNumber } from "@/lib/employeeIdentityRequestsRepo";
import { verifyEmployeeToken } from "@/lib/employeeIdentitySign";
import { STAFF_IDENTITY_COLLEGE_AR } from "@/lib/staffIdentityConfig";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const identityNumber = String(url.searchParams.get("id") ?? "").trim();
  const token = String(url.searchParams.get("t") ?? "").trim();

  if (!identityNumber || !token || !isValidEmployeeIdentityNumber(identityNumber)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const row = await getEmployeeIdentityRequestByIdentityNumber(identityNumber);
  if (!row || !row.identity_number) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const valid = verifyEmployeeToken(row.identity_number, row.id, token);
  if (!valid) {
    return NextResponse.json({ status: "invalid" }, { status: 200 });
  }

  return NextResponse.json({
    status: "valid",
    data: {
      identityNumber: row.identity_number,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      dateOfBirth: row.date_of_birth,
      address: row.address,
      phone: row.phone,
      bloodType: row.blood_type,
      educationLevel: row.education_level ? educationLevelLabelAr(row.education_level) : null,
      workplace: row.workplace,
      jobCategory: jobCategoryLabelAr(row.job_category),
      position: row.position ?? null,
      photoMediaId: row.photo_media_id,
      issuer: STAFF_IDENTITY_COLLEGE_AR,
    },
  });
}
