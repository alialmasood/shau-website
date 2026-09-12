import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { isInnovationConferenceAttachmentMedia } from "@/lib/innovationConferenceAdminRepo";
import { query } from "@/lib/db";

export const runtime = "nodejs";

/**
 * تنزيل/عرض مرفق مؤتمر الابتكار — محمي بصلاحية الأدمن
 * ولا يخدم إلا media مرتبطاً بطلب مؤتمر.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const user = await getCurrentAdminUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const ok =
    (await canAdmin("innovation-conference", "view")) ||
    (await canAdmin("innovation-conference", "access"));
  if (!ok) {
    return NextResponse.json({ error: "ممنوع" }, { status: 403 });
  }

  const { mediaId } = await params;
  const linked = await isInnovationConferenceAttachmentMedia(mediaId);
  if (!linked) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const res = await query(
    `SELECT mime_type, filename, data FROM media WHERE id = $1::uuid LIMIT 1`,
    [mediaId]
  );
  if (res.rows.length === 0) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const mimeType = String(res.rows[0].mime_type || "application/octet-stream");
  const filename = String(res.rows[0].filename || "file");
  const data: Buffer = res.rows[0].data;
  const body = new ArrayBuffer(data.byteLength);
  new Uint8Array(body).set(data);

  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Cache-Control": "private, no-store",
  };

  if (mimeType === "application/pdf") {
    const safe = filename.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_") || "document.pdf";
    headers["Content-Disposition"] = `inline; filename="${safe}"`;
  }

  return new NextResponse(body, { status: 200, headers });
}
