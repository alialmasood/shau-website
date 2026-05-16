import { buildStaffQrContent, staffQrToDataUrl } from "@/lib/staffIdentityQr";

type Props = {
  identityNumber: string;
  requestId: string;
  nameAr: string;
  nameEn: string;
  position: string | null;
  workplace: string;
  academicTitle: string | null;
};

export default async function StaffIdentityQrCell({
  identityNumber,
  requestId,
  nameAr,
  nameEn,
  position,
  workplace,
  academicTitle,
}: Props) {
  const qrContent = buildStaffQrContent({
    identityNumber,
    nameAr,
    nameEn,
    position,
    workplace,
    academicTitle,
  });
  const qrDataUrl = await staffQrToDataUrl(qrContent);
  const downloadHref = `/api/admin/staff-identity/${requestId}/qr`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR — ${nameAr}`}
        width={64}
        height={64}
        className="w-16 h-16 rounded-lg border border-neutral-200 bg-white p-0.5"
      />
      <a
        href={downloadHref}
        download={`QR-${identityNumber}.png`}
        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 hover:bg-[#31BD9C]/10 hover:border-[#31BD9C]/50 hover:text-[#2aa88a] transition-colors"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        تحميل QR
      </a>
    </div>
  );
}
