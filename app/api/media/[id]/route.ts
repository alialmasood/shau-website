import { query } from "@/lib/db";

export const runtime = "nodejs";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

// GET /api/media/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return new Response("Not Found", { status: 404 });
  }

  const res = await query(
    `SELECT mime_type, data
     FROM media
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (res.rows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const mimeType = String(res.rows[0].mime_type || "application/octet-stream");
  const data: Buffer = res.rows[0].data;
  // ننسخ إلى ArrayBuffer "عادي" لتفادي تعارضات الأنواع (SharedArrayBuffer) في TypeScript
  const body = new ArrayBuffer(data.byteLength);
  new Uint8Array(body).set(data);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

