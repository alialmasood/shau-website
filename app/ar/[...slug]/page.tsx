import { redirect } from "next/navigation";

export default async function ArCatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const path = (slug ?? []).join("/");

  // إذا كان المسار programs/xxx فيجب أن تخدمه ar/programs/[slug] — إعادة توجيه لتفادي عرض "قيد الإعداد"
  if (Array.isArray(slug) && slug[0] === "programs" && slug[1]) {
    redirect(`/ar/programs/${slug[1]}`);
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">هذه الصفحة قيد الإعداد</h1>
        <p className="text-neutral-700 leading-relaxed">
          المسار المطلوب: <span className="font-mono text-neutral-900">/ar/{path}</span>
        </p>

        <div className="mt-6">
          <a
            href="/ar"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-[#31BD9C] hover:bg-[#2aa88a] transition"
          >
            العودة إلى الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
