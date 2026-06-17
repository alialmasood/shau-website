import type { ReactNode } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";

type SwotBlock = { title: string; items: string[] };
type FacultyLoad = { rank: string; hours: string };
type ProblemRow = { problem: string; solution: string };
type ResourceBlock = { title: string; items: string[] };

type StrategicPlanContent = {
  heroTitle: string;
  heroSubtitle: string;
  introTitle: string;
  introBody: string;
  visionTitle: string;
  visionBody: string;
  missionTitle: string;
  missionBody: string;
  objectivesTitle: string;
  objectives: string[];
  swotTitle: string;
  swot: SwotBlock[];
  requirementsTitle: string;
  requirements: string[];
  facultyLoads: FacultyLoad[];
  actionPlanTitle: string;
  actionPlan: string[];
  structureTitle: string;
  structureNote: string;
  proposedCollegesTitle: string;
  proposedColleges: string[];
  resourcesTitle: string;
  resources: ResourceBlock[];
  kpisTitle: string;
  kpis: string[];
  problemsTitle: string;
  problemsTableHeaderProblem: string;
  problemsTableHeaderSolution: string;
  problemsTable: ProblemRow[];
  conclusionTitle: string;
  conclusionBody: string;
};

function SectionCard({
  title,
  children,
  accent = "default",
}: {
  title: string;
  children: ReactNode;
  accent?: "default" | "vision" | "mission" | "conclusion";
}) {
  const accentClass =
    accent === "vision"
      ? "border-[#31BD9C]/30 bg-gradient-to-br from-[#31BD9C]/5 to-white"
      : accent === "mission"
        ? "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white"
        : accent === "conclusion"
          ? "border-[#31BD9C]/40 bg-gradient-to-br from-[#31BD9C]/10 via-white to-neutral-50"
          : "border-neutral-200 bg-white";

  return (
    <section className={`rounded-2xl border shadow-sm p-6 md:p-8 ${accentClass}`}>
      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
        <span className="flex-shrink-0 w-1.5 h-8 rounded-full bg-[#31BD9C]" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-neutral-700 leading-relaxed">
          <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-[#31BD9C]/15 text-[#31BD9C] font-bold text-sm flex items-center justify-center">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-neutral-700 leading-relaxed">
          <span className="mt-2 flex-shrink-0 w-2 h-2 rounded-full bg-[#31BD9C]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const swotStyles = [
  "border-[#31BD9C]/40 bg-[#31BD9C]/5",
  "border-amber-300/60 bg-amber-50/80",
  "border-sky-300/60 bg-sky-50/80",
  "border-rose-300/60 bg-rose-50/80",
];

export default function StrategicPlanView({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const p = t.strategicPlanPage as unknown as StrategicPlanContent;

  return (
    <div className="w-full min-h-[50vh] bg-neutral-50/80">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Hero */}
        <header className="relative mb-12 rounded-3xl overflow-hidden border border-[#31BD9C]/20 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/12 via-transparent to-emerald-50/50 pointer-events-none" />
          <div className="relative px-6 py-10 md:px-10 md:py-14 text-center">
            <p className="text-sm font-semibold tracking-wide text-[#31BD9C] uppercase mb-3">
              {locale === "ar" ? "كلية الشرق للعلوم التقنية التخصصية" : "Alsharq College for Specialized Technical Sciences"}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
              {p.heroTitle}
            </h1>
            <div className="w-24 h-1 bg-[#31BD9C] mx-auto mt-5 rounded-full" />
            <p className="mt-5 text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              {p.heroSubtitle}
            </p>
          </div>
        </header>

        <div className="space-y-8">
          <SectionCard title={p.introTitle}>
            <p className="text-neutral-700 leading-relaxed text-base md:text-lg">{p.introBody}</p>
          </SectionCard>

          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title={p.visionTitle} accent="vision">
              <p className="text-neutral-700 leading-relaxed">{p.visionBody}</p>
            </SectionCard>
            <SectionCard title={p.missionTitle} accent="mission">
              <p className="text-neutral-700 leading-relaxed">{p.missionBody}</p>
            </SectionCard>
          </div>

          <SectionCard title={p.objectivesTitle}>
            <NumberedList items={p.objectives} />
          </SectionCard>

          <SectionCard title={p.swotTitle}>
            <div className="grid sm:grid-cols-2 gap-4">
              {p.swot.map((block, i) => (
                <article
                  key={i}
                  className={`rounded-xl border p-5 ${swotStyles[i] ?? swotStyles[0]}`}
                >
                  <h3 className="font-bold text-neutral-900 mb-3">{block.title}</h3>
                  <BulletList items={block.items} />
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={p.requirementsTitle}>
            <ol className="space-y-4">
              {p.requirements.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-700 leading-relaxed">
                  <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-[#31BD9C]/15 text-[#31BD9C] font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 pt-0.5 space-y-3">
                    <span>{item}</span>
                    {i === 1 && (
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {p.facultyLoads.map((row, j) => (
                              <tr key={j} className={j > 0 ? "border-t border-neutral-200" : ""}>
                                <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                                  {row.rank}
                                </td>
                                <td className="px-4 py-3 text-neutral-700">{row.hours}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title={p.actionPlanTitle}>
            <BulletList items={p.actionPlan} />
          </SectionCard>

          <SectionCard title={p.structureTitle}>
            <p className="text-neutral-600 mb-5 text-sm italic">{p.structureNote}</p>
            <h3 className="font-bold text-neutral-900 mb-4">{p.proposedCollegesTitle}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {p.proposedColleges.map((college, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 hover:border-[#31BD9C]/40 transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#31BD9C] text-white font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-neutral-800 text-sm leading-snug">{college}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={p.resourcesTitle}>
            <div className="grid md:grid-cols-3 gap-5">
              {p.resources.map((block, i) => (
                <article
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5"
                >
                  <h3 className="font-bold text-[#31BD9C] mb-3 pb-2 border-b border-[#31BD9C]/20">
                    {block.title}
                  </h3>
                  <BulletList items={block.items} />
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={p.kpisTitle}>
            <div className="flex flex-wrap gap-3">
              {p.kpis.map((kpi, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-[#31BD9C]/30 bg-[#31BD9C]/8 px-4 py-2 text-sm font-medium text-neutral-800"
                >
                  <span className="w-2 h-2 rounded-full bg-[#31BD9C]" />
                  {kpi}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={p.problemsTitle}>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="bg-[#31BD9C]/10">
                    <th className="px-4 py-3 text-start font-bold text-neutral-900 border-b border-neutral-200">
                      {p.problemsTableHeaderProblem}
                    </th>
                    <th className="px-4 py-3 text-start font-bold text-neutral-900 border-b border-neutral-200 border-s border-neutral-200">
                      {p.problemsTableHeaderSolution}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {p.problemsTable.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/80"}>
                      <td className="px-4 py-3 text-neutral-800 font-medium border-b border-neutral-100">
                        {row.problem}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 border-b border-neutral-100 border-s border-neutral-100">
                        {row.solution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title={p.conclusionTitle} accent="conclusion">
            <p className="text-neutral-700 leading-relaxed text-base md:text-lg">{p.conclusionBody}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
