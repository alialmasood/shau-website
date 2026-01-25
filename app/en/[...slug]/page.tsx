import { redirect } from "next/navigation";

export default async function EnCatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const path = (slug ?? []).join("/");

  if (Array.isArray(slug) && slug[0] === "programs" && slug[1]) {
    redirect(`/en/programs/${slug[1]}`);
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">Page under construction</h1>
        <p className="text-neutral-700 leading-relaxed">
          Requested path: <span className="font-mono text-neutral-900">/en/{path}</span>
        </p>

        <div className="mt-6">
          <a
            href="/en"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-[#31BD9C] hover:bg-[#2aa88a] transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
