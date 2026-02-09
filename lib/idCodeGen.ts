import QRCode from "qrcode";
import bwipjs from "bwip-js";

export async function makeQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 220 });
}

export async function makeBarcodeDataUrl(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 4,
    scaleX: 6,
    scaleY: 4,
    height: 28,
    includetext: false,
    paddingwidth: 4,
    paddingheight: 4,
    barcolor: "006233",
    backgroundcolor: "FFFFFF",
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}
