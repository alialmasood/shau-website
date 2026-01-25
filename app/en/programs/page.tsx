import Link from "next/link";
import Image from "next/image";
import { getActivePrograms } from "@/lib/programsRepo";
import { getTranslations } from "@/lib/i18n";

const STUDY_KEYS: Record<string, string> = {
  morning: "studyMorning",
  evening: "studyEvening",
  both: "studyBoth",
};

export default async function EnProgramsPage() {
  const programs = await getActivePrograms();
  const t = getTranslations("en");
  const tp = (t as { programsPage?: Record<string, string> }).programsPage ?? {};

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{(t as { programs?: { title?: string } }).programs?.title ?? "College Programs"}</h1>
          <div className="w-20 h-1 bg-[#31BD9C] mt-3 rounded-full" />
        </div>

        {programs.length === 0 ? (
          <p className="text-neutral-600 py-12">{tp.noPrograms ?? "No programs available."}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => {
              const name = p.nameEn || p.nameAr || p.slug;
              const img = p.image1Id ? `/api/media/${p.image1Id}` : "/hero-image-1.jpg";
              const studyKey = STUDY_KEYS[p.studyShift] || "studyBoth";
              const studyLabel = tp[studyKey] ?? "Morning and Evening";
              return (
                <Link
                  key={p.id}
                  href={`/en/programs/${p.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl border border-neutral-100 hover:border-[#31BD9C]/40 transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded">{studyLabel}</span>
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-neutral-900 group-hover:text-[#31BD9C] transition-colors line-clamp-2">{name}</h2>
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{(p.briefEn || p.briefAr || "").slice(0, 100)}...</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-[#31BD9C] font-semibold text-sm">
                      {tp.viewDetails ?? "View details"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <Link href="/en" className="text-[#31BD9C] font-semibold hover:underline">← Home</Link>
        </div>
      </div>
    </div>
  );
}
