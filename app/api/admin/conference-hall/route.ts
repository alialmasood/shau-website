import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import {
  isConferenceHallStatus,
  type ConferenceHallStatus,
} from "@/lib/conferenceHallConfig";
import {
  listConferenceHallRequests,
  updateConferenceHallRequestStatus,
} from "@/lib/conferenceHallRepo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function assertAccess() {
  const user = await getCurrentAdminUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("conference-hall", "access"));
  if (!hasAccess) return { ok: false as const, status: 403 as const, error: "Forbidden" };
  return { ok: true as const, user };
}

export async function GET() {
  const access = await assertAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const rows = await listConferenceHallRequests(500);
    return NextResponse.json({
      rows,
      latestId: rows[0]?.id ?? null,
      count: rows.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[admin conference-hall GET]", e);
    return NextResponse.json({ error: "فشل تحميل الطلبات" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const access = await assertAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const id = String((body as { id?: unknown }).id ?? "").trim();
  const status = String((body as { status?: unknown }).status ?? "").trim();
  if (!id || !isConferenceHallStatus(status)) {
    return NextResponse.json({ error: "معاملات غير صالحة" }, { status: 400 });
  }

  try {
    const row = await updateConferenceHallRequestStatus(id, status as ConferenceHallStatus);
    if (!row) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("[admin conference-hall PATCH]", e);
    return NextResponse.json({ error: "فشل تحديث الحالة" }, { status: 500 });
  }
}
