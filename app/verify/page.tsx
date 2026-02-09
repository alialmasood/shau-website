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

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
          <div className={`text-2xl font-extrabold ${valid ? "text-emerald-700" : "text-red-600"}`}>
            {valid ? "✅ الهوية صالحة" : "❌ الهوية غير صالحة"}
          </div>
          <p className="text-sm text-neutral-600 mt-3">
            {valid ? "تم التحقق بنجاح من بيانات الطالب." : "تعذر التحقق من بيانات الهوية."}
          </p>

          {valid && json?.data && (
            <div className="mt-6 text-start rounded-xl border border-neutral-200 p-4">
              <div className="text-sm text-neutral-700">الاسم: <span className="font-semibold">{json.data.name}</span></div>
              <div className="text-sm text-neutral-700">القسم: <span className="font-semibold">{json.data.department}</span></div>
              <div className="text-sm text-neutral-700">المرحلة: <span className="font-semibold">{json.data.stage}</span></div>
              <div className="text-sm text-neutral-700">تاريخ الانتهاء: <span className="font-semibold">{json.data.expiryDate}</span></div>
              <div className="text-sm text-neutral-500 mt-2">السيريال: {json.data.serial}</div>
            </div>
          )}

          <div className="mt-6">
            <Link href="/" className="text-[#31BD9C] hover:underline text-sm">العودة إلى الموقع</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
