import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { ensureStaffIdentityNumber, getStaffIdentityRequestById } from "@/lib/staffIdentityRequestsRepo";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function sanitizeFolderName(name: string): string {
  const s = name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return s.length > 0 ? s : "طلب_هوية";
}

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

  const folderName = sanitizeFolderName(row.name_ar);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  archive.on("error", (err) => {
    throw err;
  });

  const sentAt = new Date(row.created_at).toLocaleString("ar-IQ", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const dobDisplay = row.date_of_birth;
  const text = [
    "طلب هوية الكادر — كلية الشرق للعلوم التقنية التخصصية",
    "",
    `توقيت الإرسال: ${sentAt}`,
    `الاسم الثلاثي (عربي): ${row.name_ar}`,
    `الاسم الثلاثي (إنجليزي): ${row.name_en}`,
    `تاريخ التولد: ${dobDisplay}`,
    `اللقب العلمي: ${row.academic_title ?? "—"}`,
    `مكان العمل (القسم): ${row.workplace}`,
    `المنصب: ${row.position ?? "—"}`,
    `رقم الهوية: ${identityNumber}`,
    `رقم الهاتف: ${row.phone}`,
    `البريد الإلكتروني الجامعي: ${row.university_email}`,
    `معرّف السجل: ${row.id}`,
    row.photo_media_id ? `معرّف الصورة في النظام: ${row.photo_media_id}` : "لا توجد صورة مرفوعة",
  ].join("\n");

  archive.append(text, { name: `${folderName}/بيانات_الطلب.txt` });

  if (row.photo_media_id) {
    try {
      const mediaRes = await query(
        `SELECT mime_type, filename, data FROM media WHERE id = $1::uuid LIMIT 1`,
        [row.photo_media_id]
      );
      if (mediaRes.rows.length > 0) {
        const media = mediaRes.rows[0];
        const mimeType = String(media.mime_type || "application/octet-stream");
        const originalFilename = String(media.filename || "photo");
        const data: Buffer = media.data;
        let extension = ".jpg";
        if (mimeType.includes("png")) extension = ".png";
        else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = ".jpg";
        else if (mimeType.includes("webp")) extension = ".webp";
        else if (mimeType.includes("gif")) extension = ".gif";
        else {
          const m = originalFilename.match(/\.([^.]+)$/);
          extension = m ? `.${m[1]}` : ".jpg";
        }
        archive.append(data, { name: `${folderName}/الصورة_الشخصية${extension}` });
      }
    } catch (e) {
      console.error("[staff-identity download] media:", e);
    }
  }

  await new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("error", (err) => reject(err));
    archive.finalize();
  });

  const zipBuffer = Buffer.concat(chunks);
  const safeZipName = `${folderName.replace(/[<>:"/\\|?*]/g, "_")}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeZipName)}`,
    },
  });
}
