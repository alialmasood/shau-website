"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicEventRow } from "@/lib/eventsRepo";
import { getTranslations, type Locale } from "@/lib/i18n";
import { normalizeYouTubeId, youtubeEmbedSrc } from "@/lib/youtubeEmbed";

type Labels = Record<string, string>;

/**
 * نفس قيمة `renderedAt` من الخادم على أول إطار في العميل (ترطيب متطابق)،
 * ثم تحديث كل ثانية بعد mount.
 */
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

function phase(starts: number, ends: number | null, now: number): "upcoming" | "live" | "ended" {
  if (now < starts) return "upcoming";
  if (ends != null && now > ends) return "ended";
  if (ends == null && now - starts > 24 * 3600 * 1000) return "ended";
  return "live";
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatDiff(ms: number, labels: Labels) {
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

function detailsBlocks(htmlOrText: string) {
  return htmlOrText
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EventsPublicExperience({
  locale,
  events,
  renderedAt,
}: {
  locale: Locale;
  events: PublicEventRow[];
  /** من EventsPageContent (الخادم) — يمنع اختلاف العد التنازلي بين SSR والعميل */
  renderedAt: number;
}) {
  const t = getTranslations(locale);
  const e = t.eventsPage as Labels;
  const homeHref = locale === "ar" ? "/ar" : "/en";
  const hasUpcoming = useMemo(
    () => events.some((ev) => new Date(ev.startsAt).getTime() > renderedAt),
    [events, renderedAt]
  );
  const now = useSyncedClock(renderedAt, hasUpcoming);

  const fmt = locale === "ar" ? "ar-IQ" : "en-GB";

  return (
    <div className="w-full min-h-[50vh] bg-neutral-50/80">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 text-center sm:text-start">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{e.title}</h1>
          <div className="w-20 h-1 bg-[#31BD9C] mt-3 rounded-full mx-auto sm:mx-0" />
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto sm:mx-0 leading-relaxed">{e.subtitle}</p>
        </header>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-neutral-700 font-medium">{e.noEvents}</p>
            <p className="text-sm text-neutral-500 mt-2">{e.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {events.map((ev) => {
              const starts = new Date(ev.startsAt).getTime();
              const ends = ev.endsAt ? new Date(ev.endsAt).getTime() : null;
              const ph = phase(starts, ends, now);
              const diff = starts - now;
              const youtubeId = normalizeYouTubeId(ev.videoUrl);
              const embed = youtubeId ? youtubeEmbedSrc(youtubeId, { autoplay: false, mute: true }) : null;
              const cover = ev.coverImageId ? `/api/media/${ev.coverImageId}` : "/hero-image-1.jpg";
              const dateLine = new Intl.DateTimeFormat(fmt, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(ev.startsAt));

              return (
                <article
                  key={ev.id}
                  className="rounded-3xl border border-neutral-200 bg-white shadow-lg overflow-hidden scroll-mt-24"
                >
                  {ev.featured && (
                    <div className="bg-gradient-to-l from-[#31BD9C] to-[#2aa88a] text-white text-center text-xs font-bold py-1.5 tracking-wide">
                      {e.featuredBadge}
                    </div>
                  )}

                  <div className="grid lg:grid-cols-2 gap-0 lg:gap-0">
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[280px] bg-neutral-900">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={ev.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <Image src={cover} alt="" fill className="object-cover opacity-95" unoptimized />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-1 rounded-full mb-2 ${
                            ph === "upcoming"
                              ? "bg-sky-500/90 text-white"
                              : ph === "live"
                                ? "bg-emerald-500/90 text-white"
                                : "bg-neutral-600/90 text-white"
                          }`}
                        >
                          {ph === "upcoming" ? e.upcoming : ph === "live" ? e.eventLive : e.past}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md leading-tight">
                          {ev.title}
                        </h2>
                        {ev.excerpt && (
                          <p className="mt-2 text-sm text-white/90 line-clamp-2 drop-shadow">{ev.excerpt}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-8 flex flex-col gap-5">
                      <div>
                        <p className="text-xs font-bold text-[#31BD9C] uppercase tracking-wide mb-1">{e.eventDate}</p>
                        <p className="text-lg font-semibold text-neutral-900">{dateLine}</p>
                        {ev.endsAt && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {e.eventEnds}:{" "}
                            {new Intl.DateTimeFormat(fmt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(ev.endsAt))}
                          </p>
                        )}
                      </div>

                      {ph === "upcoming" && diff > 0 && (
                        <div className="rounded-2xl border border-[#31BD9C]/30 bg-[#31BD9C]/5 p-4">
                          <p className="text-sm font-bold text-neutral-800 mb-1">{e.countdownTitle}</p>
                          <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#31BD9C] tabular-nums">
                            {formatDiff(diff, e)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">{e.countdownUntil}</p>
                        </div>
                      )}

                      {ph === "ended" && (
                        <p className="text-sm font-semibold text-neutral-500 bg-neutral-100 rounded-xl px-4 py-3">
                          {e.eventEnded}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-auto">
                        {ev.registrationUrl ? (
                          <a
                            href={ev.registrationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl bg-[#31BD9C] px-5 py-3 text-sm font-bold text-white shadow hover:bg-[#2aa88a] transition"
                          >
                            {ev.registrationLabel || e.registerCta}
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-xl bg-neutral-200 px-5 py-3 text-sm font-bold text-neutral-500 cursor-not-allowed"
                            title={e.registerSoon}
                          >
                            {ev.registrationLabel || e.registerSoon}
                          </button>
                        )}
                        {ev.brochureMediaId && (
                          <a
                            href={`/api/media/${ev.brochureMediaId}`}
                            download
                            className="inline-flex items-center justify-center rounded-xl border-2 border-[#31BD9C] text-[#31BD9C] px-5 py-3 text-sm font-bold hover:bg-[#31BD9C]/5 transition"
                          >
                            {e.downloadBrochure}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {ev.galleryImageIds.length > 0 && (
                    <div className="border-t border-neutral-100 px-5 sm:px-8 py-6 bg-neutral-50/50">
                      <h3 className="text-sm font-extrabold text-neutral-800 mb-3">{e.galleryTitle}</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                        {ev.galleryImageIds.map((gid) => (
                          <a
                            key={gid}
                            href={`/api/media/${gid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative shrink-0 w-40 h-28 sm:w-52 sm:h-36 snap-start rounded-xl overflow-hidden border border-neutral-200 shadow-sm hover:border-[#31BD9C] transition"
                          >
                            <Image src={`/api/media/${gid}`} alt="" fill className="object-cover" unoptimized />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-neutral-100 px-5 sm:px-8 py-8">
                    <h3 className="text-lg font-extrabold text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-[#31BD9C] rounded-full" />
                      {e.detailsTitle}
                    </h3>
                    <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed">
                      {detailsBlocks(ev.details).map((block, i) => (
                        <p key={i} className="mb-4 last:mb-0 whitespace-pre-wrap">
                          {block}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center sm:text-start">
          <Link href={homeHref} className="text-[#31BD9C] font-semibold hover:underline">
            {e.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
