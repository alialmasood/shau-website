import QRCode from "qrcode";
import { buildStaffVerifyUrl } from "./staffIdentitySign";

export const STAFF_IDENTITY_COLLEGE_AR = "كلية الشرق التقنية التخصصية";

export type StaffQrInput = {
  identityNumber: string;
  requestId: string;
  nameAr: string;
  position: string | null;
};

/** نص يُعرض مباشرة عند مسح QR + رابط التحقق (صورة وبيانات كاملة) */
export function buildStaffQrContent(input: StaffQrInput): string {
  const verifyUrl = buildStaffVerifyUrl(input.identityNumber, input.requestId);
  const position = input.position?.trim() || "—";

  return [
    "── هوية الكادر ──",
    `صادرة عن: ${STAFF_IDENTITY_COLLEGE_AR}`,
    "",
    `الاسم: ${input.nameAr.trim()}`,
    `رقم الهوية: ${input.identityNumber}`,
    `الوظيفة: ${position}`,
    "",
    "للتحقق الرسمي وعرض الصورة الشخصية:",
    verifyUrl,
  ].join("\n");
}

const QR_OPTS = { margin: 1, errorCorrectionLevel: "M" as const };

export async function staffQrToDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { ...QR_OPTS, width: 240 });
}

export async function staffQrToPngBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, { ...QR_OPTS, margin: 2, width: 512, type: "png" });
}
