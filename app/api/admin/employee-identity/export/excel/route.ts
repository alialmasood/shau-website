import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { educationLevelLabelAr, jobCategoryLabelAr } from "@/lib/employeeIdentityConfig";
import { listEmployeeIdentityRequests } from "@/lib/employeeIdentityRequestsRepo";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("employee-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listEmployeeIdentityRequests();
  const headers = [
    "توقيت الإرسال",
    "رقم الهوية",
    "الاسم (عربي)",
    "الاسم (إنجليزي)",
    "تاريخ التولد",
    "عنوان السكن",
    "الهاتف",
    "فصيلة الدم",
    "التحصيل العلمي",
    "مكان العمل",
    "الوظيفة",
    "المنصب",
    "البريد الرسمي",
  ];
  const dataRows = rows.map((r) => {
    const sent = r.created_at
      ? new Date(r.created_at).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })
      : "";
    return [
      sent,
      r.identity_number ?? "",
      r.name_ar,
      r.name_en,
      r.date_of_birth,
      r.address,
      r.phone,
      r.blood_type,
      r.education_level ? educationLevelLabelAr(r.education_level) : "",
      r.workplace,
      jobCategoryLabelAr(r.job_category),
      r.position ?? "",
      r.official_email ?? "",
    ];
  });
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "هويات الموظفين");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filenameAr = "هويات-الموظفين.xlsx";
  const disposition = `attachment; filename="employee-identity.xlsx"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
