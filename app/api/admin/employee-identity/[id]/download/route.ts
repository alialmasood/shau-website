import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import bwipjs from "bwip-js";
import { educationLevelLabelAr, jobCategoryLabelAr } from "@/lib/employeeIdentityConfig";
import { buildEmployeeQrContent, employeeQrToPngBuffer } from "@/lib/employeeIdentityQr";
import {
  ensureEmployeeIdentityNumber,
  getEmployeeIdentityRequestById,
} from "@/lib/employeeIdentityRequestsRepo";
import { buildEmployeeVerifyUrl } from "@/lib/employeeIdentitySign";
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
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("employee-identity", "access"));
  if (!hasAccess) {
    return NextResponse.json({ error: "ممنوع" }, { status: 403 });
  }

  const { id } = await params;
  const row = await getEmployeeIdentityRequestById(id);
  if (!row) {
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
  }

  const identityNumber = row.identity_number ?? (await ensureEmployeeIdentityNumber(id));
  const folderName = sanitizeFolderName(row.name_ar);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const sentAt = new Date(row.created_at).toLocaleString("ar-IQ", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const text = [
    "طلب هوية الموظف — كلية الشرق للعلوم التقنية التخصصية",
    "",
    `توقيت الإرسال: ${sentAt}`,
    `الاسم الكامل (عربي): ${row.name_ar}`,
    `الاسم الكامل (إنجليزي): ${row.name_en}`,
    `تاريخ التولد: ${row.date_of_birth}`,
    `عنوان السكن: ${row.address}`,
    `رقم الهاتف: ${row.phone}`,
    `فصيلة الدم: ${row.blood_type}`,
    `التحصيل العلمي: ${row.education_level ? educationLevelLabelAr(row.education_level) : "—"}`,
    `مكان العمل: ${row.workplace}`,
    `الوظيفة: ${jobCategoryLabelAr(row.job_category)}`,
    `المنصب: ${row.position ?? "—"}`,
    `رقم الهوية: ${identityNumber}`,
    `البريد الإلكتروني الرسمي: ${row.official_email ?? "—"}`,
    `رابط التحقق: ${buildEmployeeVerifyUrl(identityNumber, id)}`,
    `معرّف السجل: ${row.id}`,
    row.photo_media_id ? `معرّف الصورة في النظام: ${row.photo_media_id}` : "لا توجد صورة مرفوعة",
  ].join("\n");

  archive.append(text, { name: `${folderName}/بيانات_الطلب.txt` });

  try {
    const qrContent = buildEmployeeQrContent({ identityNumber, requestId: id });
    const qrPng = await employeeQrToPngBuffer(qrContent);
    archive.append(qrPng, { name: `${folderName}/رمز_QR.png` });

    const barcodePng = await bwipjs.toBuffer({
      bcid: "code128",
      text: identityNumber,
      scale: 3,
      scaleX: 5,
      scaleY: 3,
      height: 24,
      includetext: true,
      textxalign: "center",
      paddingwidth: 6,
      paddingheight: 6,
      barcolor: "04025E",
      backgroundcolor: "FFFFFF",
    });
    archive.append(barcodePng, { name: `${folderName}/الباركود.png` });
  } catch (e) {
    console.error("[employee-identity download] qr/barcode:", e);
  }

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
      console.error("[employee-identity download] media:", e);
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
