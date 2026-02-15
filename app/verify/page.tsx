import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const params = await searchParams;
  const id = params.id || "";
  const t = params.t || "";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  const res = await fetch(`${baseUrl}/api/verify?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ status: "invalid" }));
  const valid = json?.status === "valid";
  const data = valid ? json?.data : null;
  const photoUrl = data?.photoMediaId ? `/api/media/${data.photoMediaId}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200" dir="rtl">
      <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
        {/* شعار التحقق */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-neutral-800">التحقق من هوية الطالب</h1>
          <p className="text-sm text-neutral-500 mt-1">Student ID Verification</p>
        </div>

        {/* بطاقة النتيجة */}
        <div className="rounded-2xl border-2 border-neutral-200 bg-white shadow-xl overflow-hidden">
          {/* شريط الحالة */}
          <div
            className={`flex items-center justify-center gap-3 py-4 px-4 ${
              valid ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {valid ? (
              <>
                <svg className="w-10 h-10 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-start">
                  <p className="text-xl font-bold">الهوية صالحة</p>
                  <p className="text-sm opacity-90">تم التحقق بنجاح من بيانات الطالب</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-10 h-10 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
              {/* صورة الطالب + البيانات */}
              <div className="flex gap-4 items-start">
                {/* الصورة */}
                <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-neutral-200 bg-neutral-100">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={data.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-neutral-900 leading-tight">{data.name}</p>
                  {data.nameEn && (
                    <p className="text-sm text-neutral-600 mt-0.5 font-medium">{data.nameEn}</p>
                  )}
                  <p className="text-sm text-neutral-700 mt-2">{data.department}</p>
                  <p className="text-sm text-neutral-600">{data.stage}</p>
                </div>
              </div>

              {/* تفاصيل إضافية */}
              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">تاريخ الانتهاء</span>
                  <span className="font-semibold text-neutral-800">{data.expiryDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500">رقم السيريال</span>
                  <span className="font-mono font-semibold text-neutral-800">{data.serial}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-4 text-center">
                تم التحقق من هذه الهوية عبر رمز QR الرسمي
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#31BD9C] font-semibold hover:underline"
          >
            العودة إلى الموقع
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
