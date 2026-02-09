import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentIdCardBySerial } from "@/lib/studentIdCardsRepo";
import { buildVerifyToken, formatDateISO } from "@/lib/idSign";
import { makeBarcodeDataUrl, makeQrDataUrl } from "@/lib/idCodeGen";
import IdCardTemplate from "@/app/id-template/IdCardTemplate";

export default async function StudentIdPreviewPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-id", "access"));

  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

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

  function formatDisplayDate(iso: string, locale: "ar" | "en") {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", {
        year: "numeric",
        month: locale === "ar" ? "long" : "short",
        day: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">معاينة هوية الطالب</h1>
            <p className="text-sm text-neutral-600 mt-2">السيريال: {card.serial}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/id/render?serial=${encodeURIComponent(card.serial)}&side=ar`}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
            >
              Download Front PNG
            </a>
            <a
              href={`/api/id/render?serial=${encodeURIComponent(card.serial)}&side=en`}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
            >
              Download Back PNG
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm overflow-hidden">
            <div className="flex items-center justify-center">
              <div className="bg-white border border-neutral-200" style={{ width: "86mm", height: "54mm" }}>
                <div className="origin-top-left" style={{ transform: "scale(0.32)" }}>
              <IdCardTemplate
                side="ar"
                data={{
                  serial: card.serial,
                  nameAr: card.nameAr,
                  nameEn: card.nameEn,
                  dobLabel: formatDateISO(card.dob),
                  address: card.address,
                  addressEn: card.addressEn,
                  bloodType: card.bloodType,
                  department: card.department,
                  departmentEn: card.departmentEn,
                  stage: card.stage,
                  stageEn: card.stageEn,
                  expiryLabel: formatDisplayDate(card.expiryDate, "ar"),
                  issueLabel: formatDisplayDate(card.createdAt, "ar"),
                  photoUrl,
                  qrDataUrl,
                  barcodeDataUrl,
                }}
              />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm overflow-hidden">
            <div className="flex items-center justify-center">
              <div className="bg-white border border-neutral-200" style={{ width: "86mm", height: "54mm" }}>
                <div className="origin-top-left" style={{ transform: "scale(0.32)" }}>
              <IdCardTemplate
                side="en"
                data={{
                  serial: card.serial,
                  nameAr: card.nameAr,
                  nameEn: card.nameEn,
                  dobLabel: formatDisplayDate(card.dob, "en"),
                  address: card.address,
                  addressEn: card.addressEn,
                  bloodType: card.bloodType,
                  department: card.department,
                  departmentEn: card.departmentEn,
                  stage: card.stage,
                  stageEn: card.stageEn,
                  expiryLabel: formatDisplayDate(card.expiryDate, "en"),
                  issueLabel: formatDisplayDate(card.createdAt, "en"),
                  photoUrl,
                  qrDataUrl,
                  barcodeDataUrl,
                }}
              />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
