import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { ensureStaffIdentityNumber, getStaffIdentityRequestById } from "@/lib/staffIdentityRequestsRepo";
import { buildStaffQrContent, staffQrToPngBuffer } from "@/lib/staffIdentityQr";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("staff-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "ممنوع" }, { status: 403 });
  }

  const { id } = await params;
  const row = await getStaffIdentityRequestById(id);
  if (!row) {
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
  }

  const identityNumber = row.identity_number ?? (await ensureStaffIdentityNumber(id));
  const qrContent = buildStaffQrContent({
    identityNumber,
    requestId: row.id,
    nameAr: row.name_ar,
    position: row.position,
  });
  const png = await staffQrToPngBuffer(qrContent);

  const safeName = row.name_ar.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim().slice(0, 60) || "staff";
  const filename = `QR-${identityNumber}-${safeName}.png`;

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-cache",
    },
  });
}
