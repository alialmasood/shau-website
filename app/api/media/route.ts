import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { query } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/media
// multipart/form-data: file=<File>
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file field" },
      { status: 400 }
    );
  }

  // صور أو PDF
  const ok = file.type?.startsWith("image/") || file.type === "application/pdf";
  if (!file.type || !ok) {
    return NextResponse.json(
      { error: "يُقبل الصور (image/*) وملفات PDF فقط" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "upload";
  const mimeType = file.type;
  const size = file.size;

  const res = await query(
    `INSERT INTO media (filename, mime_type, size, data)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [filename, mimeType, size, bytes]
  );

  const id = String(res.rows[0].id);
  return NextResponse.json({ id }, { status: 201 });
}

