import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { listConferenceHallRequests } from "@/lib/conferenceHallRepo";
import {
  buildConferenceHallWorkbook,
  toConferenceHallExportRows,
} from "@/lib/conferenceHallExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("conference-hall", "access"));
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = String(request.nextUrl.searchParams.get("status") ?? "").trim();
  const activityType = String(request.nextUrl.searchParams.get("activityType") ?? "").trim();
  const stage = String(request.nextUrl.searchParams.get("stage") ?? "").trim();
  const studyType = String(request.nextUrl.searchParams.get("studyType") ?? "").trim();
  const q = String(request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  let rows = await listConferenceHallRequests(1000);
  if (status) rows = rows.filter((r) => r.status === status);
  if (activityType) rows = rows.filter((r) => r.activityType === activityType);
  if (stage) rows = rows.filter((r) => r.stage === stage);
  if (studyType) rows = rows.filter((r) => r.studyType === studyType);
  if (q) {
    rows = rows.filter((r) =>
      [
        r.departmentNameAr,
        r.departmentNameEn,
        r.activityTitle,
        r.activityBrief,
        r.organizers,
        r.status,
        r.dateFrom,
        r.dateTo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  const exportRows = toConferenceHallExportRows(rows, "ar");
  const buffer = await buildConferenceHallWorkbook({
    title: "كشف طلبات قاعة المؤتمرات — كلية الشرق للعلوم التقنية التخصصية",
    rows: exportRows,
  });

  const filenameAr = "طلبات-قاعة-المؤتمرات.xlsx";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="conference-hall.xlsx"; filename*=UTF-8''${encodeURIComponent(filenameAr)}`,
    },
  });
}
