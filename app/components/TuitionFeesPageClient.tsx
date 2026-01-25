"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { getTranslations, type Locale } from "@/lib/i18n";
import type { DepartmentFeeRow } from "@/lib/departmentFeeRepo";
import { DEPT_FEE_CATEGORY_OPTIONS, getCategoryLabel } from "@/lib/deptFeeCategories";

function parsePrice(s: string): number {
  return Number.parseInt(String(s).replace(/,/g, ""), 10) || 0;
}
function parseGPA(s: string): number {
  return Number.parseFloat(String(s).replace(/%/g, "")) || 0;
}

type SortKey = "lowest" | "highest" | "gpa" | "alpha";
type ShiftFilter = "all" | "morning" | "evening";

export default function TuitionFeesPageClient({ locale, departments = [] }: { locale: Locale; departments?: DepartmentFeeRow[] }) {
  const t = getTranslations(locale);
  const tp = (t as { tuitionPage?: Record<string, string> }).tuitionPage ?? {};
  const basePath = locale === "ar" ? "/ar" : "/en";

  const deptName = (d: DepartmentFeeRow) =>
    (locale === "ar" ? d.displayName : d.displayNameEn) || (t.programs?.dept as Record<string, string>)?.[d.departmentSlug] || d.departmentSlug;
  const categoryLabel = (slug: string) => getCategoryLabel(slug, locale);

  function getApplyLinks(d: DepartmentFeeRow): { internal?: string; external?: string; whatsapp?: string } {
    const out: { internal?: string; external?: string; whatsapp?: string } = {};
    if (!d.showApplyButton) return out;
    const types = d.applyTypes || [];
    if (types.includes("internal_page") && (d.applyUrl || tp.applyUrl)) {
      const path = (d.applyUrl || tp.applyUrl || "/electronic-registration").trim();
      out.internal = basePath + (path.startsWith("/") ? path : "/" + path);
      if (d.id) out.internal += (out.internal.includes("?") ? "&" : "?") + "department=" + encodeURIComponent(d.id) + "&studyType=morning";
    }
    if (types.includes("external_link") && d.applyUrlExternal?.trim()) {
      const u = d.applyUrlExternal.trim();
      out.external = /^https?:\/\//i.test(u) ? u : "https://" + u;
    }
    if (types.includes("whatsapp") && d.applyUrlWhatsapp?.trim()) {
      const w = d.applyUrlWhatsapp.trim();
      if (/^https?:\/\//i.test(w)) out.whatsapp = w;
      else { const num = w.replace(/\D/g, ""); if (num) out.whatsapp = `https://wa.me/${num}`; }
    }
    return out;
  }
  function getApplyLabel(d: DepartmentFeeRow): string {
    return (locale === "ar" ? d.applyButtonText : d.applyButtonTextEn) || tp.cardApply || "";
  }

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterShift, setFilterShift] = useState<ShiftFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("alpha");
  const [modalDept, setModalDept] = useState<DepartmentFeeRow | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const cardsRef = useRef<HTMLDivElement>(null);

  const list = departments ?? [];

  const filtered = useMemo(() => {
    let out = list;
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((d) => deptName(d).toLowerCase().includes(q));
    if (filterType) out = out.filter((d) => (d.categories || []).includes(filterType));
    return out;
  }, [list, search, filterType, locale]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const byPrice = (a: DepartmentFeeRow, b: DepartmentFeeRow) => {
      const va = filterShift === "evening" ? parsePrice(a.eveningPrice) : filterShift === "morning" ? parsePrice(a.morningPrice) : Math.min(parsePrice(a.morningPrice), parsePrice(a.eveningPrice));
      const vb = filterShift === "evening" ? parsePrice(b.eveningPrice) : filterShift === "morning" ? parsePrice(b.morningPrice) : Math.min(parsePrice(b.morningPrice), parsePrice(b.eveningPrice));
      return va - vb;
    };
    const byGPA = (a: DepartmentFeeRow, b: DepartmentFeeRow) => {
      const va = filterShift === "evening" ? parseGPA(a.eveningMinGpa) : parseGPA(a.morningMinGpa);
      const vb = filterShift === "evening" ? parseGPA(b.eveningMinGpa) : parseGPA(b.morningMinGpa);
      return vb - va;
    };
    if (sortBy === "lowest") arr.sort(byPrice);
    else if (sortBy === "highest") arr.sort((a, b) => -byPrice(a, b));
    else if (sortBy === "gpa") arr.sort(byGPA);
    else arr.sort((a, b) => deptName(a).localeCompare(deptName(b), locale === "ar" ? "ar" : "en"));
    return arr;
  }, [filtered, filterShift, sortBy, locale]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareDepts = useMemo(() => list.filter((d) => compareIds.includes(d.id)), [list, compareIds]);

  const scrollToCards = () => cardsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="w-full min-h-screen bg-neutral-50">
      {/* A) Hero Header */}
      <section className="relative w-full bg-[#04025E] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.12) 60px, rgba(255,255,255,0.12) 120px)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">{t.tuition.title}</h1>
          <div className="w-20 h-1 bg-[#31BD9C] rounded-full mx-auto mb-6" />
          <p className="text-white/90 text-base sm:text-lg mb-8">{tp.heroSubtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${basePath}/tuition-fees-guide`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold rounded-full transition-all shadow-lg hover:scale-105"
              aria-label={t.tuition.downloadAria}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t.tuition.downloadGuide}
            </a>
            <button
              type="button"
              onClick={scrollToCards}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/40 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              {tp.scrollToDetails}
            </button>
          </div>
        </div>
      </section>

      {/* B) Sticky Filters */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder={tp.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-2 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp.filterType}:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value || "")}
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-[#31BD9C] outline-none"
              >
                <option value="">{tp.filterTypeAll}</option>
                {DEPT_FEE_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{categoryLabel(c.value)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp.filterShift}:</label>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value as ShiftFilter)}
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-[#31BD9C] outline-none"
              >
                <option value="all">{tp.filterShiftAll}</option>
                <option value="morning">{t.tuition.morning}</option>
                <option value="evening">{t.tuition.evening}</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">{tp.sortBy}:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-[#31BD9C] outline-none"
              >
                <option value="lowest">{tp.sortLowest}</option>
                <option value="highest">{tp.sortHighest}</option>
                <option value="gpa">{tp.sortGPA}</option>
                <option value="alpha">{tp.sortAlpha}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* C) Grid Cards */}
      <section ref={cardsRef} id="dept-cards" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((dept) => {
            const currency = dept.currency || t.tuition.currency;
            const links = getApplyLinks(dept);
            return (
              <div key={dept.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-neutral-100 transition-all flex flex-col">
                <div className="relative h-36 overflow-hidden">
                  <Image src={dept.cardImageId ? `/api/media/${dept.cardImageId}` : "/hero-image-1.jpg"} alt={deptName(dept)} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-2 right-2 px-2.5 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full">{(dept.categories && dept.categories.length) ? categoryLabel(dept.categories[0]) : "—"}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-neutral-900 mb-3 line-clamp-2">{deptName(dept)}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between p-2 bg-blue-50 rounded-lg text-sm">
                      <span className="text-neutral-700">{t.tuition.morning}</span>
                      <span className="font-bold text-[#31BD9C]">{dept.morningPrice} {currency}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded-lg text-sm">
                      <span className="text-neutral-700">{t.tuition.evening}</span>
                      <span className="font-bold text-[#31BD9C]">{dept.eveningPrice} {currency}</span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 border-t border-neutral-100 pt-3 mb-4">
                    <p>{t.tuition.minGPAHint}</p>
                    <span>{t.tuition.morning}: {dept.morningMinGpa}</span> — <span>{t.tuition.evening}: {dept.eveningMinGpa}</span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setModalDept(dept)}
                      className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-800 text-sm font-semibold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
                    >
                      {tp.cardDetails}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompare(dept.id)}
                      disabled={compareIds.length >= 3 && !compareIds.includes(dept.id)}
                      className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-800 text-sm font-semibold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors disabled:opacity-50"
                    >
                      {tp.cardCompare}
                    </button>
                    {links.internal && (
                      <a href={links.internal} className="flex-1 min-w-[80px] px-3 py-2 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white text-sm font-bold text-center transition-colors">
                        {getApplyLabel(dept)}
                      </a>
                    )}
                    {links.external && (
                      <a href={links.external} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl border border-[#31BD9C] text-[#31BD9C] text-sm font-bold hover:bg-[#31BD9C]/10 transition-colors" title={tp.applyExternal}>{tp.applyExternal}</a>
                    )}
                    {links.whatsapp && (
                      <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold transition-colors">{tp.applyWhatsapp}</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {sorted.length === 0 && (
          <p className="text-center text-neutral-500 py-12">{tp.noDepts}</p>
        )}
      </section>

      {/* E) Compare Table */}
      {compareDepts.length >= 2 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">{tp.compareTitle}</h2>
              <button type="button" onClick={() => setCompareIds([])} className="text-sm text-neutral-500 hover:text-red-600">{tp.compareClearAll}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-700">
                    <th className="text-right px-4 py-3 font-semibold">{tp.compareColDept}</th>
                    <th className="text-right px-4 py-3 font-semibold">{tp.compareColMorning}</th>
                    <th className="text-right px-4 py-3 font-semibold">{tp.compareColEvening}</th>
                    <th className="text-right px-4 py-3 font-semibold">{tp.compareColGPA}</th>
                    <th className="text-right px-4 py-3 font-semibold">{tp.compareColDuration}</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {compareDepts.map((d) => {
                    const currency = d.currency || t.tuition.currency;
                    return (
                      <tr key={d.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3 font-medium">{deptName(d)}</td>
                        <td className="px-4 py-3">{d.morningPrice} {currency}</td>
                        <td className="px-4 py-3">{d.eveningPrice} {currency}</td>
                        <td className="px-4 py-3">{d.morningMinGpa} / {d.eveningMinGpa}</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-2 py-3">
                          <button type="button" onClick={() => toggleCompare(d.id)} className="text-red-600 hover:underline text-xs">{tp.compareRemove}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* F) FAQ + Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-16">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">{tp.faqTitle}</h2>
        <div className="space-y-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">{tp.faq1q}</h3>
            <p className="text-neutral-600 text-sm">{tp.faq1a}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">{tp.faq2q}</h3>
            <p className="text-neutral-600 text-sm">{tp.faq2a}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">{tp.faq3q}</h3>
            <p className="text-neutral-600 text-sm">{tp.faq3a}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900/90 text-sm">
          {tp.disclaimer}
        </div>
      </section>

      {/* D) Detail Modal */}
      {modalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModalDept(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-44 overflow-hidden">
              <Image src={modalDept.cardImageId ? `/api/media/${modalDept.cardImageId}` : "/hero-image-1.jpg"} alt={deptName(modalDept)} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <h2 className="absolute bottom-4 right-4 left-4 text-xl font-bold text-white">{deptName(modalDept)}</h2>
              <button type="button" onClick={() => setModalDept(null)} className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white" aria-label={tp.modalClose}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {(locale === "ar" ? modalDept.brief : modalDept.briefEn) && <p className="text-neutral-600 text-sm">{locale === "ar" ? modalDept.brief : modalDept.briefEn}</p>}
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">{tp.modalFees}</h3>
                <div className="space-y-2 text-sm">
                  {modalDept.registrationFee && <div className="flex justify-between"><span>{tp.modalRegistrationFee}</span><span>{modalDept.registrationFee} {modalDept.currency || t.tuition.currency}</span></div>}
                  <div className="flex justify-between"><span>{tp.modalAnnual} ({t.tuition.morning})</span><span>{modalDept.morningPrice} {modalDept.currency || t.tuition.currency}</span></div>
                  <div className="flex justify-between"><span>{tp.modalAnnual} ({t.tuition.evening})</span><span>{modalDept.eveningPrice} {modalDept.currency || t.tuition.currency}</span></div>
                  {(locale === "ar" ? modalDept.extraFees : modalDept.extraFeesEn) && <div className="flex justify-between"><span>{tp.modalExtra}</span><span>{locale === "ar" ? modalDept.extraFees : modalDept.extraFeesEn}</span></div>}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">{tp.modalAdmission}</h3>
                <p className="text-sm text-neutral-600">{t.tuition.morning}: {modalDept.morningMinGpa} — {t.tuition.evening}: {modalDept.eveningMinGpa}</p>
              </div>
              {modalDept.requiredDocs && modalDept.requiredDocs.length > 0 && (
                <div>
                  <h3 className="font-bold text-neutral-900 mb-2">{tp.modalDocs}</h3>
                  <ul className="list-disc list-inside text-sm text-neutral-600">
                    {modalDept.requiredDocs.map((doc: { ar?: string; en?: string }, i: number) => (
                      <li key={i}>{typeof doc === "string" ? doc : (locale === "ar" ? doc.ar : doc.en) || doc.ar || doc.en || ""}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(modalDept.applicationStart || modalDept.applicationEnd) && (
                <div>
                  <h3 className="font-bold text-neutral-900 mb-2">{tp.modalDates}</h3>
                  <p className="text-sm text-neutral-600">{modalDept.applicationStart || "—"} – {modalDept.applicationEnd || "—"}</p>
                </div>
              )}
              {(() => {
                const mLinks = getApplyLinks(modalDept);
                const hasAny = mLinks.internal || mLinks.external || mLinks.whatsapp;
                if (!hasAny) return null;
                return (
                  <div className="flex flex-wrap gap-2">
                    {mLinks.internal && (
                      <a href={mLinks.internal} className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold text-center transition-colors">
                        {getApplyLabel(modalDept)}
                      </a>
                    )}
                    {mLinks.external && (
                      <a href={mLinks.external} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] py-3 rounded-xl border-2 border-[#31BD9C] text-[#31BD9C] font-bold text-center hover:bg-[#31BD9C]/10 transition-colors">{tp.applyExternal}</a>
                    )}
                    {mLinks.whatsapp && (
                      <a href={mLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-center transition-colors">{tp.applyWhatsapp}</a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
