"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicCeActivity } from "@/lib/ceRepo";
import { getTranslations, type Locale } from "@/lib/i18n";

type L = Record<string, string>;

function useSyncedClock(renderedAt: number, tick: boolean) {
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    if (!tick) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [renderedAt, tick]);
  return now;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatDiff(ms: number, labels: L) {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} ${labels.countdownDays}`);
  parts.push(`${pad(h)} ${labels.countdownHours}`);
  parts.push(`${pad(m)} ${labels.countdownMinutes}`);
  parts.push(`${pad(s)} ${labels.countdownSeconds}`);
  return parts.join(" ");
}

function blocks(t: string) {
  return t.split(/\n\s*\n/g).map((s) => s.trim()).filter(Boolean);
}

export default function CeDepartmentView({
  locale,
  activities,
  renderedAt,
}: {
  locale: Locale;
  activities: PublicCeActivity[];
  renderedAt: number;
}) {
  const t = getTranslations(locale);
  const c = t.cePage as L;
  const home = locale === "ar" ? "/ar" : "/en";
  const hasUpcoming = useMemo(
    () => activities.some((a) => a.showAnnouncement && new Date(a.eventStartsAt).getTime() > renderedAt),
    [activities, renderedAt]
  );
  const now = useSyncedClock(renderedAt, hasUpcoming);
  const fmt = locale === "ar" ? "ar-IQ" : "en-GB";

  return (
    <div className="w-full min-h-[50vh] bg-neutral-50/80">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{c.title}</h1>
          <div className="w-20 h-1 bg-[#31BD9C] mt-3 rounded-full" />
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl leading-relaxed">{c.subtitle}</p>
        </header>

        {activities.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-neutral-600">{c.noActivities}</div>
        ) : (
          <div className="space-y-10">
            {activities.map((a) => {
              const starts = new Date(a.eventStartsAt).getTime();
              const diff = starts - now;
              const upcoming = a.showAnnouncement && diff > 0;
              const dateLine = new Intl.DateTimeFormat(fmt, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(a.eventStartsAt));
              /** غلاف البطاقة: صورة الغلاف المختارة، أو أول صورة إعلان، أو أول صورة تقرير — وليس صورة الموقع الافتراضية */
              const coverMediaId =
                a.coverImageId ?? a.galleryAnnouncement[0] ?? a.galleryRecap[0] ?? null;
              const cover = coverMediaId ? `/api/media/${coverMediaId}` : null;
              const usedImplicitAnnCover = !a.coverImageId && a.galleryAnnouncement[0] != null;
              const announcementThumbs = usedImplicitAnnCover ? a.galleryAnnouncement.slice(1) : a.galleryAnnouncement;
              const usedImplicitRecapCover =
                !a.coverImageId && a.galleryAnnouncement.length === 0 && a.galleryRecap[0] != null;
              const recapThumbs = usedImplicitRecapCover ? a.galleryRecap.slice(1) : a.galleryRecap;

              return (
                <article key={a.id} className="rounded-3xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
                  {a.featured && (
                    <div className="bg-gradient-to-l from-[#31BD9C] to-[#2aa88a] text-white text-center text-xs font-bold py-1.5">
                      {c.featuredBadge}
                    </div>
                  )}
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="relative aspect-[16/10] lg:min-h-[240px] bg-neutral-200">
                      {cover ? (
                        <Image src={cover} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-300 px-6 text-center text-sm text-neutral-600 leading-relaxed">
                          {c.noCoverPlaceholder}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <h2 className="text-xl font-extrabold text-neutral-900">{a.title}</h2>
                      {a.excerpt && <p className="text-neutral-600 text-sm">{a.excerpt}</p>}
                      <div>
                        <p className="text-xs font-bold text-[#31BD9C] mb-1">{c.eventWhen}</p>
                        <p className="font-semibold text-neutral-900">{dateLine}</p>
                      </div>
                      {upcoming && (
                        <div className="rounded-2xl border border-[#31BD9C]/30 bg-[#31BD9C]/5 p-4">
                          <p className="text-sm font-bold text-neutral-800 mb-1">{c.countdownTitle}</p>
                          <p className="text-2xl font-mono font-extrabold text-[#31BD9C] tabular-nums" suppressHydrationWarning>
                            {formatDiff(diff, c)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">{c.countdownUntil}</p>
                        </div>
                      )}
                      {a.certificatesZipMediaId && (
                        <div>
                          <p className="text-xs font-bold text-neutral-700 mb-1">{c.bulkZipTitle}</p>
                          <a
                            href={`/api/media/${a.certificatesZipMediaId}`}
                            download
                            className="inline-flex rounded-xl border-2 border-[#31BD9C] text-[#31BD9C] px-4 py-2 text-sm font-bold hover:bg-[#31BD9C]/5"
                          >
                            {c.bulkZipBtn}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {a.showAnnouncement && a.announcementDetails.trim().length > 0 && (
                    <div className="border-t px-6 py-6 bg-white">
                      <h3 className="text-sm font-extrabold text-[#31BD9C] mb-2">{c.announcementSection}</h3>
                      <div className="prose prose-neutral max-w-none text-neutral-700 text-sm">
                        {blocks(a.announcementDetails).map((p, i) => (
                          <p key={i} className="mb-2 whitespace-pre-wrap">
                            {p}
                          </p>
                        ))}
                      </div>
                      {announcementThumbs.length > 0 && (
                        <>
                          <p className="text-xs font-bold mt-4 mb-2">{c.galleryAnnouncement}</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {announcementThumbs.map((gid) => (
                              <a
                                key={gid}
                                href={`/api/media/${gid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative shrink-0 w-32 h-24 rounded-lg overflow-hidden border"
                              >
                                <Image src={`/api/media/${gid}`} alt="" fill className="object-cover" unoptimized />
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {a.showRecap && a.recapDetails && a.recapDetails.trim().length > 0 && (
                    <div className="border-t px-6 py-6 bg-neutral-50/60">
                      <h3 className="text-sm font-extrabold text-neutral-900 mb-2">{c.recapSection}</h3>
                      <div className="prose prose-neutral max-w-none text-neutral-700 text-sm">
                        {blocks(a.recapDetails).map((p, i) => (
                          <p key={i} className="mb-2 whitespace-pre-wrap">
                            {p}
                          </p>
                        ))}
                      </div>
                      {recapThumbs.length > 0 && (
                        <>
                          <p className="text-xs font-bold mt-4 mb-2">{c.galleryRecap}</p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {recapThumbs.map((gid) => (
                              <a
                                key={gid}
                                href={`/api/media/${gid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative shrink-0 w-32 h-24 rounded-lg overflow-hidden border"
                              >
                                <Image src={`/api/media/${gid}`} alt="" fill className="object-cover" unoptimized />
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-14 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-neutral-900 mb-2">{c.certSectionTitle}</h2>
          <p className="text-sm text-neutral-600 mb-4">{c.certSectionDesc}</p>
          <form method="get" action="/api/public/ce-certificate" className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <label className="sr-only" htmlFor="ce-cert-code">
              {c.certCodeLabel}
            </label>
            <input
              id="ce-cert-code"
              name="code"
              dir="ltr"
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 font-mono text-sm"
              placeholder={c.certCodeLabel}
              required
            />
            <button type="submit" className="px-6 py-3 rounded-xl bg-[#31BD9C] text-white font-bold text-sm hover:bg-[#2aa88a]">
              {c.certSubmit}
            </button>
          </form>
        </section>

        <div className="mt-10">
          <Link href={home} className="text-[#31BD9C] font-semibold hover:underline">
            {c.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
