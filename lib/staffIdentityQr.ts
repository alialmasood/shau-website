import QRCode from "qrcode";
import { STAFF_IDENTITY_COLLEGE_AR, getStaffSiteBaseUrl, staffMediaUrl } from "./staffIdentityConfig";
import { buildStaffVerifyUrl } from "./staffIdentitySign";

export { STAFF_IDENTITY_COLLEGE_AR } from "./staffIdentityConfig";

export type StaffQrInput = {
  identityNumber: string;
  requestId: string;
  nameAr: string;
  position: string | null;
  photoMediaId: string | null;
};

/** نص كامل عند المسح المباشر — مع رابط صورة مباشر وصفحة تحقق */
export function buildStaffQrContent(input: StaffQrInput): string {
  const position = input.position?.trim() || "—";
  const lines: string[] = [
    "── هوية الكادر ──",
    `صادرة عن: ${STAFF_IDENTITY_COLLEGE_AR}`,
    "",
    `الاسم: ${input.nameAr.trim()}`,
    `رقم الهوية: ${input.identityNumber}`,
    `الوظيفة: ${position}`,
  ];

  if (input.photoMediaId) {
    lines.push("", `الصورة الشخصية: ${staffMediaUrl(input.photoMediaId)}`);
  }

  const verifyUrl = buildStaffVerifyUrl(input.identityNumber, input.requestId);
  lines.push("", `صفحة التحقق: ${verifyUrl}`);

  return lines.join("\n");
}

const QR_OPTS = { margin: 1, errorCorrectionLevel: "M" as const };

export async function staffQrToDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { ...QR_OPTS, width: 260 });
}

export async function staffQrToPngBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, { ...QR_OPTS, margin: 2, width: 512, type: "png" });
}
