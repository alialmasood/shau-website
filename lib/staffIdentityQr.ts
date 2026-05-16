import QRCode from "qrcode";
import { STAFF_IDENTITY_COLLEGE_AR } from "./staffIdentityConfig";

export { STAFF_IDENTITY_COLLEGE_AR } from "./staffIdentityConfig";

export type StaffQrInput = {
  identityNumber: string;
  nameAr: string;
  nameEn?: string | null;
  position: string | null;
  workplace?: string | null;
  academicTitle?: string | null;
};

/**
 * نص فقط — بدون روابط (تطبيقات المسح غالباً تفتح الروابط داخل النص كبحث وليس كصفحة).
 * كل التفاصيل تظهر مباشرة عند القراءة.
 */
export function buildStaffQrContent(input: StaffQrInput): string {
  const position = input.position?.trim() || "—";
  const workplace = input.workplace?.trim();
  const academicTitle = input.academicTitle?.trim();
  const nameEn = input.nameEn?.trim();

  const lines: string[] = [
    "── هوية الكادر ──",
    `صادرة عن: ${STAFF_IDENTITY_COLLEGE_AR}`,
    "",
    `الاسم: ${input.nameAr.trim()}`,
  ];

  if (nameEn) {
    lines.push(`الاسم (إنجليزي): ${nameEn}`);
  }
  if (academicTitle) {
    lines.push(`اللقب العلمي: ${academicTitle}`);
  }
  if (workplace) {
    lines.push(`القسم: ${workplace}`);
  }

  lines.push(`رقم الهوية: ${input.identityNumber}`, `الوظيفة: ${position}`);

  return lines.join("\n");
}

const QR_OPTS = { margin: 1, errorCorrectionLevel: "M" as const };

export async function staffQrToDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { ...QR_OPTS, width: 260 });
}

export async function staffQrToPngBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, { ...QR_OPTS, margin: 2, width: 512, type: "png" });
}
