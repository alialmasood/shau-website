import QRCode from "qrcode";
import { buildEmployeeVerifyUrl } from "./employeeIdentitySign";

export { STAFF_IDENTITY_COLLEGE_AR } from "./staffIdentityConfig";

export function buildEmployeeQrContent(input: {
  identityNumber: string;
  requestId: string;
}): string {
  return buildEmployeeVerifyUrl(input.identityNumber, input.requestId);
}

const QR_OPTS = { margin: 1, errorCorrectionLevel: "M" as const };

export async function employeeQrToDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, { ...QR_OPTS, width: 260 });
}

export async function employeeQrToPngBuffer(content: string): Promise<Buffer> {
  return QRCode.toBuffer(content, { ...QR_OPTS, margin: 2, width: 512, type: "png" });
}
