import Link from "next/link";
import Image from "next/image";
import { getProgramBySlug } from "@/lib/programsRepo";
import { getTranslations } from "@/lib/i18n";

const STUDY_KEYS: Record<string, string> = {
  morning: "studyMorning",
  evening: "studyEvening",
  both: "studyBoth",
};

const STAGE_KEYS = ["", "stage1", "stage2", "stage3", "stage4"] as const;
const SHIFT_KEYS = { morning: "shiftMorning", evening: "shiftEvening" } as const;

export default async function ArProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProgramBySlug(slug);
  const t = getTranslations("ar");
  const tp = (t as { programsPage?: Record<string, string> }).programsPage ?? {};

  if (!p) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 mb-4">البرنامج غير موجود.</p>
        <Link href="/ar/programs" className="text-[#31BD9C] font-semibold hover:underline">← جميع البرامج</Link>
      </div>
    );
  }

  const name = p.nameAr || p.slug;
  const brief = p.briefAr || "";
  const studyKey = STUDY_KEYS[p.studyShift] || "studyBoth";
  const studyLabel = tp[studyKey] ?? "صباحي ومسائي";
  const images = [p.image1Id, p.image2Id, p.image3Id, p.image4Id].filter(Boolean) as string[];

  const lecturesTables = p.lecturesTables ?? [];
  const examsTables = p.examsTables ?? [];

  function tableSubtitle(item: { stage: number; shift: string }) {
    const sk = STAGE_KEYS[item.stage] || "stage1";
    const shk = SHIFT_KEYS[item.shift as keyof typeof SHIFT_KEYS] || "shiftMorning";
    return `${tp[sk] ?? "المرحلة الأولى"} — ${tp[shk] ?? "صباحي"}`;
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Link href="/ar/programs" className="text-[#31BD9C] font-semibold hover:underline mb-4 inline-block">← جميع البرامج</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{name}</h1>
          <span className="inline-block mt-2 px-3 py-1 bg-[#31BD9C]/15 text-[#31BD9C] font-semibold rounded-full">{studyLabel}</span>
          <div className="w-20 h-1 bg-[#31BD9C] mt-3 rounded-full" />
        </div>

        {brief && (
          <div className="prose prose-neutral max-w-none mb-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">نبذة عن القسم</h2>
            <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{brief}</div>
          </div>
        )}

        {images.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">صور القسم</h2>
            <div className={`grid gap-4 ${images.length >= 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
              {images.map((id, i) => (
                <div key={id} className="relative aspect-video rounded-xl overflow-hidden bg-neutral-100">
                  <Image src={`/api/media/${id}`} alt={`${name} - ${i + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        )}

        {lecturesTables.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">{tp.lecturesTable ?? "جدول المحاضرات"}</h2>
            <div className="space-y-8">
              {lecturesTables.map((item, i) => {
                const hasContent = item.pdf_id || (item.image_ids?.length ?? 0) > 0 || (item.html_ar && item.html_ar.trim());
                if (!hasContent) return null;
                return (
                  <div key={i}>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3">{tableSubtitle(item)}</h3>
                    {item.pdf_id && (
                      <p className="mb-4">
                        <a href={`/api/media/${item.pdf_id}`} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-medium hover:bg-red-200">
                          تحميل جدول المحاضرات (PDF)
                        </a>
                      </p>
                    )}
                    {(item.image_ids?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-4 mb-4">
                        {item.image_ids!.map((id) => (
                          <div key={id} className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                            <Image src={`/api/media/${id}`} alt={tableSubtitle(item)} fill className="object-contain" unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                    {item.html_ar && item.html_ar.trim() && (
                      <div className="overflow-x-auto rounded-xl border border-neutral-200" dangerouslySetInnerHTML={{ __html: item.html_ar }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {examsTables.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">{tp.examsTable ?? "جدول الامتحانات"}</h2>
            <div className="space-y-8">
              {examsTables.map((item, i) => {
                const hasContent = item.pdf_id || (item.image_ids?.length ?? 0) > 0 || (item.html_ar && item.html_ar.trim());
                if (!hasContent) return null;
                return (
                  <div key={i}>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3">{tableSubtitle(item)}</h3>
                    {item.pdf_id && (
                      <p className="mb-4">
                        <a href={`/api/media/${item.pdf_id}`} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 font-medium hover:bg-red-200">
                          تحميل جدول الامتحانات (PDF)
                        </a>
                      </p>
                    )}
                    {(item.image_ids?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-4 mb-4">
                        {item.image_ids!.map((id) => (
                          <div key={id} className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                            <Image src={`/api/media/${id}`} alt={tableSubtitle(item)} fill className="object-contain" unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                    {item.html_ar && item.html_ar.trim() && (
                      <div className="overflow-x-auto rounded-xl border border-neutral-200" dangerouslySetInnerHTML={{ __html: item.html_ar }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Link href="/ar/programs" className="text-[#31BD9C] font-semibold hover:underline">← العودة لجميع البرامج</Link>
      </div>
    </div>
  );
}
