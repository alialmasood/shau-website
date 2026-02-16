import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentCodeVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code?.trim() ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020";
  const res = await fetch(`${baseUrl}/api/student-exam-codes/verify?code=${encodeURIComponent(code)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ valid: false }));
  const valid = json?.valid === true;
  const data = valid ? json?.data : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200" dir="rtl">
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-neutral-800">التحقق من الكود الامتحاني</h1>
        </div>
        <div className="rounded-2xl border-2 border-neutral-200 bg-white shadow-xl overflow-hidden p-6">
          {valid && data ? (
            <>
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white mb-4">
                <span className="text-xl font-bold">الكود صالح</span>
              </div>
              <div className="space-y-3 text-start">
                <div className="flex justify-between">
                  <span className="text-neutral-500">الاسم</span>
                  <span className="font-semibold">{data.nameAr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">القسم</span>
                  <span className="font-semibold">{data.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">المرحلة</span>
                  <span className="font-semibold">{data.stage}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200">
                  <span className="text-neutral-500">الكود</span>
                  <span className="font-mono font-bold text-lg">{data.code}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-red-600 font-semibold">
              الكود غير صالح أو غير موجود
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link href="/" className="text-[#31BD9C] font-semibold hover:underline">
            العودة إلى الموقع
          </Link>
        </div>
      </div>
    </div>
  );
}
