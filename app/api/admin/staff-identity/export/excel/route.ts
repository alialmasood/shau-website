import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { listStaffIdentityRequests } from "@/lib/staffIdentityRequestsRepo";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("staff-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listStaffIdentityRequests();
  const headers = [
    "توقيت الإرسال",
    "الاسم (عربي)",
    "الاسم (إنجليزي)",
    "تاريخ التولد",
    "اللقب العلمي",
    "القسم",
    "المنصب",
    "الهاتف",
    "البريد الجامعي",
  ];
  const dataRows = rows.map((r) => {
    const sent = r.created_at
      ? new Date(r.created_at).toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })
      : "";
    return [
      sent,
      r.name_ar,
      r.name_en,
      r.date_of_birth,
      r.academic_title ?? "",
      r.workplace,
      r.position ?? "",
      r.phone,
      r.university_email,
    ];
  });
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "هويات الكادر");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filenameAr = "هويات-الكادر.xlsx";
  const disposition = `attachment; filename="staff-identity.xlsx"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  });
}
