import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/media/public
// multipart/form-data: file=<File>
// هذا الـ route متاح للجميع (للمستمسكات)
export async function POST(request: Request) {
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

  // تحديد حجم الملف (مثلاً 10MB كحد أقصى)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "حجم الملف كبير جداً. الحد الأقصى 10MB" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "upload";
  const mimeType = file.type;
  const size = file.size;

  try {
    const res = await query(
      `INSERT INTO media (filename, mime_type, size, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [filename, mimeType, size, bytes]
    );

    const id = String(res.rows[0].id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء رفع الملف" },
      { status: 500 }
    );
  }
}
