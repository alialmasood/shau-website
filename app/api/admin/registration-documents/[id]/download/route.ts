import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getRegistrationDocumentById } from "@/lib/registrationDocumentsRepo";
import { query } from "@/lib/db";
import archiver from "archiver";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
  }

  try {
    const document = await getRegistrationDocumentById(id);
    if (!document) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    // إنشاء ملف ZIP
    const archive = archiver("zip", {
      zlib: { level: 9 }, // ضغط عالي
    });

    // إعداد الاستجابة - جمع البيانات
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // معالجة الأخطاء
    archive.on("error", (err) => {
      throw err;
    });

    // اسم المجلد (اسم الطالب)
    const folderName = document.fullName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, "_").trim() || "طالب";
    
    // إضافة ملف نصي يحتوي على بيانات الطالب
    const studentInfo = `
الاسم الرباعي واللقب: ${document.fullName}
القسم: ${document.department}
المرحلة: ${document.stage}
رقم الهاتف: ${document.phone}
تاريخ الإرسال: ${new Date(document.createdAt).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}
    `.trim();

    archive.append(studentInfo, { name: `${folderName}/بيانات_الطالب.txt` });

    // قائمة الملفات المطلوبة مع أسمائها
    const files = [
      { id: document.personalPhotoId, name: "الصورة_الشخصية" },
      { id: document.studentIdFrontId, name: "بطاقة_الطالب_أمامي" },
      { id: document.studentIdBackId, name: "بطاقة_الطالب_خلفي" },
      { id: document.fatherIdFrontId, name: "بطاقة_الأب_أمامي" },
      { id: document.fatherIdBackId, name: "بطاقة_الأب_خلفي" },
      { id: document.motherIdFrontId, name: "بطاقة_الأم_أمامي" },
      { id: document.motherIdBackId, name: "بطاقة_الأم_خلفي" },
      { id: document.residenceCardFrontId, name: "بطاقة_السكن_أمامي" },
      { id: document.residenceCardBackId, name: "بطاقة_السكن_خلفي" },
      { id: document.highSchoolCertificateId, name: "وثيقة_الدراسة_الإعدادية" },
      { id: document.barcodeDocumentId, name: "ورقة_الباركود" },
    ];

    // إضافة كل ملف إلى الأرشيف
    for (const file of files) {
      if (file.id) {
        try {
          const res = await query(
            `SELECT mime_type, filename, data FROM media WHERE id = $1 LIMIT 1`,
            [file.id]
          );

          if (res.rows.length > 0) {
            const media = res.rows[0];
            const mimeType = String(media.mime_type || "application/octet-stream");
            const originalFilename = String(media.filename || "file");
            const data: Buffer = media.data;

            // تحديد امتداد الملف
            let extension = "";
            if (mimeType.startsWith("image/")) {
              if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = ".jpg";
              else if (mimeType.includes("png")) extension = ".png";
              else if (mimeType.includes("gif")) extension = ".gif";
              else if (mimeType.includes("webp")) extension = ".webp";
              else extension = ".jpg"; // افتراضي
            } else if (mimeType === "application/pdf") {
              extension = ".pdf";
            } else {
              // محاولة استخراج الامتداد من اسم الملف
              const match = originalFilename.match(/\.([^.]+)$/);
              extension = match ? `.${match[1]}` : "";
            }

            const fileName = `${folderName}/${file.name}${extension}`;
            archive.append(data, { name: fileName });
          }
        } catch (error) {
          console.error(`Error adding file ${file.id}:`, error);
          // نستمر في إضافة الملفات الأخرى حتى لو فشل أحدها
        }
      }
    }

    // إنهاء الأرشيف وانتظار اكتماله
    await new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", (err) => reject(err));
      archive.finalize();
    });

    // دمج جميع الـ chunks
    const zipBuffer = Buffer.concat(chunks);

    // إرجاع الملف
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(folderName)}.zip"`,
      },
    });
  } catch (error) {
    console.error("Error creating ZIP:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الملف المضغوط" },
      { status: 500 }
    );
  }
}
