import QRCode from "qrcode";
import { buildStaffVerifyUrl } from "./staffIdentitySign";

export { STAFF_IDENTITY_COLLEGE_AR } from "./staffIdentityConfig";

/** محتوى QR: رابط تحقق موقّع على نطاق الموقع الرسمي */
export function buildStaffQrContent(input: {
  identityNumber: string;
  requestId: string;
}): string {
  return buildStaffVerifyUrl(input.identityNumber, input.requestId);
}

const QR_OPTS = { margin: 1, errorCorrectionLevel: "M" as const };

export async function staffQrToDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { ...QR_OPTS, width: 260 });
}

export async function staffQrToPngBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, { ...QR_OPTS, margin: 2, width: 512, type: "png" });
}
