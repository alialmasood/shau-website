import Link from "next/link";
import { STAFF_IDENTITY_COLLEGE_AR, staffMediaUrl } from "@/lib/staffIdentityConfig";
import { isValidStaffIdentityNumber } from "@/lib/staffIdentityNumber";
import { getStaffIdentityRequestByIdentityNumber } from "@/lib/staffIdentityRequestsRepo";
import { verifyStaffToken } from "@/lib/staffIdentitySign";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** الأزرق الأكاديمي — لون هوية الكلية */
const ACADEMIC_BLUE = "#04025E";
const ACADEMIC_BLUE_LIGHT = "#1a3a8f";

function formatDob(s: string): string {
  if (!s) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium" }).format(new Date(s + "T12:00:00"));
  } catch {
    return s;
  }
}

function DetailRow({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm py-2 border-b border-blue-100 last:border-0">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className={`font-semibold text-neutral-800 text-end ${dir === "ltr" ? "font-mono" : ""}`} dir={dir}>
        {value}
      </span>
    </div>
  );
}

export default async function VerifyStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const params = await searchParams;
  const identityNumber = String(params.id ?? "").trim();
  const token = String(params.t ?? "").trim();

  let valid = false;
  let data: {
    identityNumber: string;
    nameAr: string;
    nameEn: string;
    dateOfBirth: string;
    position: string | null;
    workplace: string;
    academicTitle: string | null;
    photoMediaId: string | null;
  } | null = null;

  if (identityNumber && token && isValidStaffIdentityNumber(identityNumber)) {
    const row = await getStaffIdentityRequestByIdentityNumber(identityNumber);
    if (row?.identity_number && verifyStaffToken(row.identity_number, row.id, token)) {
      valid = true;
      data = {
        identityNumber: row.identity_number,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        dateOfBirth: row.date_of_birth,
        position: row.position,
        workplace: row.workplace,
        academicTitle: row.academic_title,
        photoMediaId: row.photo_media_id,
      };
    }
  }

  const photoUrl = data?.photoMediaId ? staffMediaUrl(data.photoMediaId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50" dir="rtl">
      <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold" style={{ color: ACADEMIC_BLUE }}>
            التحقق من هوية الكادر
          </h1>
          <p className="text-sm text-blue-700/80 mt-1">Staff ID Verification</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-xl overflow-hidden">
          <div
            className={`flex items-center justify-center gap-3 py-4 px-4 ${
              valid ? "text-white" : "bg-red-600 text-white"
            }`}
            style={valid ? { backgroundColor: ACADEMIC_BLUE } : undefined}
          >
            {valid ? (
              <>
                <svg className="w-10 h-10 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-start">
                  <p className="text-xl font-bold">الهوية صالحة</p>
                  <p className="text-sm opacity-90">صادرة عن {STAFF_IDENTITY_COLLEGE_AR}</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-start">
                  <p className="text-xl font-bold">الهوية غير صالحة</p>
                  <p className="text-sm opacity-90">تعذر التحقق من بيانات الهوية</p>
                </div>
              </>
            )}
          </div>

          {valid && data && (
            <div className="p-5">
              <p className="text-center text-sm font-bold mb-1" style={{ color: ACADEMIC_BLUE }}>
                {STAFF_IDENTITY_COLLEGE_AR}
              </p>
              <p className="text-center text-xs text-blue-700/70 mb-5">بطاقة هوية الكادر — للتحقق الرسمي</p>

              <div className="flex gap-4 items-start mb-5">
                <div
                  className="shrink-0 w-28 h-32 rounded-xl overflow-hidden border-2 bg-neutral-100 shadow-sm"
                  style={{ borderColor: `${ACADEMIC_BLUE}40` }}
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt={data.nameAr} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-300">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-lg font-bold text-neutral-900 leading-tight">{data.nameAr}</p>
                  {data.nameEn && (
                    <p className="text-sm text-neutral-600 mt-1 font-medium" dir="ltr">
                      {data.nameEn}
                    </p>
                  )}
                  {data.academicTitle && (
                    <p className="text-sm mt-2 font-semibold" style={{ color: ACADEMIC_BLUE_LIGHT }}>
                      {data.academicTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-1">
                <DetailRow label="رقم الهوية" value={data.identityNumber} dir="ltr" />
                <DetailRow label="تاريخ التولد" value={formatDob(data.dateOfBirth)} />
                <DetailRow label="القسم" value={data.workplace} />
                {data.position && <DetailRow label="المنصب" value={data.position} />}
              </div>

              {photoUrl && (
                <p className="mt-4 text-center">
                  <a
                    href={photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: ACADEMIC_BLUE }}
                  >
                    فتح الصورة بحجم كامل
                  </a>
                </p>
              )}

              <p className="text-xs text-blue-700/50 mt-4 text-center">
                تم التحقق من هذه الهوية عبر رمز QR الرسمي الصادر من نظام الكلية
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/ar"
            className="inline-flex items-center gap-2 font-semibold hover:underline"
            style={{ color: ACADEMIC_BLUE }}
          >
            العودة إلى الموقع
          </Link>
        </div>
      </div>
    </div>
  );
}


