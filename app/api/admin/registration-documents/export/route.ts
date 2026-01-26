import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAllRegistrationDocuments } from "@/lib/registrationDocumentsRepo";

function csvEscape(val: string): string {
  const s = String(val ?? "");
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  let rows: Awaited<ReturnType<typeof getAllRegistrationDocuments>> = [];
  try {
    rows = await getAllRegistrationDocuments();
  } catch {
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }

  const baseUrl = getBaseUrl(request);

  const headers = [
    "الاسم الرباعي واللقب",
    "القسم",
    "المرحلة",
    "رقم الهاتف",
    "تاريخ الإرسال",
    "الصورة الشخصية",
    "بطاقة الطالب (أمامي)",
    "بطاقة الطالب (خلفي)",
    "بطاقة الأب (أمامي)",
    "بطاقة الأب (خلفي)",
    "بطاقة الأم (أمامي)",
    "بطاقة الأم (خلفي)",
    "بطاقة السكن (أمامي)",
    "بطاقة السكن (خلفي)",
    "وثيقة الدراسة الإعدادية",
    "ورقة الباركود",
  ];
  const lines: string[] = [headers.map(csvEscape).join(",")];

  for (const r of rows) {
    const date = new Date(r.createdAt).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const personalPhoto = r.personalPhotoId ? `${baseUrl}/api/media/${r.personalPhotoId}` : "—";
    const studentIdFront = r.studentIdFrontId ? `${baseUrl}/api/media/${r.studentIdFrontId}` : "—";
    const studentIdBack = r.studentIdBackId ? `${baseUrl}/api/media/${r.studentIdBackId}` : "—";
    const fatherIdFront = r.fatherIdFrontId ? `${baseUrl}/api/media/${r.fatherIdFrontId}` : "—";
    const fatherIdBack = r.fatherIdBackId ? `${baseUrl}/api/media/${r.fatherIdBackId}` : "—";
    const motherIdFront = r.motherIdFrontId ? `${baseUrl}/api/media/${r.motherIdFrontId}` : "—";
    const motherIdBack = r.motherIdBackId ? `${baseUrl}/api/media/${r.motherIdBackId}` : "—";
    const residenceCardFront = r.residenceCardFrontId ? `${baseUrl}/api/media/${r.residenceCardFrontId}` : "—";
    const residenceCardBack = r.residenceCardBackId ? `${baseUrl}/api/media/${r.residenceCardBackId}` : "—";
    const highSchoolCertificate = r.highSchoolCertificateId ? `${baseUrl}/api/media/${r.highSchoolCertificateId}` : "—";
    const barcodeDocument = r.barcodeDocumentId ? `${baseUrl}/api/media/${r.barcodeDocumentId}` : "—";

    lines.push(
      [
        r.fullName || "—",
        r.department || "—",
        r.stage || "—",
        r.phone || "—",
        date,
        personalPhoto,
        studentIdFront,
        studentIdBack,
        fatherIdFront,
        fatherIdBack,
        motherIdFront,
        motherIdBack,
        residenceCardFront,
        residenceCardBack,
        highSchoolCertificate,
        barcodeDocument,
      ].map(csvEscape).join(",")
    );
  }

  const bom = "\uFEFF";
  const csv = bom + lines.join("\r\n");
  const bytes = Buffer.from(csv, "utf-8");

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="المستمسكات_المطلوبة.csv"',
    },
  });
}
