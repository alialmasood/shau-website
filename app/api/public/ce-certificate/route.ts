import { query } from "@/lib/db";

export const runtime = "nodejs";

/** تحميل شهادة مشاركة بالكود (عام، بدون تسجيل دخول) */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim();
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const res = await query(
    `SELECT m.mime_type, m.filename, m.data
     FROM ce_certificates c
     INNER JOIN media m ON m.id = c.pdf_media_id
     WHERE upper(trim(c.code)) = upper(trim($1))
     LIMIT 1`,
    [code]
  );

  if (res.rows.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const mimeType = String(res.rows[0].mime_type || "application/pdf");
  const filename = String(res.rows[0].filename || "certificate.pdf");
  const data: Buffer = res.rows[0].data;
  const body = new ArrayBuffer(data.byteLength);
  new Uint8Array(body).set(data);

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "certificate.pdf";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
