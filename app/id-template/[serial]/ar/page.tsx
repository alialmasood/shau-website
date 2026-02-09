import { notFound } from "next/navigation";
import { getStudentIdCardBySerial } from "@/lib/studentIdCardsRepo";
import { buildVerifyToken, formatDateISO } from "@/lib/idSign";
import { makeBarcodeDataUrl, makeQrDataUrl } from "@/lib/idCodeGen";
import IdCardTemplate from "@/app/id-template/IdCardTemplate";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function formatDisplayDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function IdTemplateArPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;
  const card = await getStudentIdCardBySerial(serial);
  if (!card) notFound();

  const dobISO = formatDateISO(card.dob);
  const expiryISO = formatDateISO(card.expiryDate);
  const token = buildVerifyToken(card.serial, dobISO, expiryISO);
  const verifyUrl = `https://shau.edu.iq/verify?id=${encodeURIComponent(card.serial)}&t=${token}`;

  const qrDataUrl = await makeQrDataUrl(verifyUrl);
  const barcodeDataUrl = await makeBarcodeDataUrl(card.serial);
  const photoUrl = card.photoMediaId ? `/api/media/${card.photoMediaId}` : null;

  const dobNumeric = dobISO;

  return (
    <div className="w-[1024px] h-[640px] bg-white">
      <style>{`body{margin:0;}`}</style>
      <IdCardTemplate
        side="ar"
        data={{
          serial: card.serial,
          nameAr: card.nameAr,
          nameEn: card.nameEn,
          dobLabel: dobNumeric,
          address: card.address,
          addressEn: card.addressEn,
          bloodType: card.bloodType,
          department: card.department,
          departmentEn: card.departmentEn,
          stage: card.stage,
          stageEn: card.stageEn,
          expiryLabel: formatDisplayDate(card.expiryDate),
          issueLabel: formatDisplayDate(card.createdAt),
          photoUrl,
          qrDataUrl,
          barcodeDataUrl,
        }}
      />
    </div>
  );
}
