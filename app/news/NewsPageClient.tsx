"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NEWS_CATEGORIES } from "./_data";
import { getTranslations } from "@/lib/i18n";
import { categoryArabicToLabel } from "@/lib/newsCategory";

function normalizeArabicSearch(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-4 h-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export type NewsListItemUI = {
  id: string;
  title: string;
  excerpt: string | null;
  categoryLabel: string;
  dateLabel: string;
  coverImageId: string | null;
  featured?: boolean;
};

function getImageSrc(coverImageId: string | null) {
  return coverImageId ? `/api/media/${coverImageId}` : "/hero-image-1.jpg";
}

function NewsCard({
  news,
  className,
  basePath,
  readNews,
}: {
  news: NewsListItemUI;
  className?: string;
  basePath: "/ar" | "/en";
  readNews: string;
}) {
  return (
    <Link
      href={`${basePath}/${news.id}`}
      className={[
        "group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1.5 border border-neutral-100 hover:border-[#31BD9C]/30",
        "sm:col-span-2 lg:col-span-2",
        className ?? "",
      ].join(" ")}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C] z-10" />

      <div className="relative w-full overflow-hidden aspect-video">
        <Image
          src={getImageSrc(news.coverImageId)}
          alt={news.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 right-3 z-20">
          <span className="px-3 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full backdrop-blur-sm">
            {news.categoryLabel}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[#31BD9C] font-medium mb-3">
          <CalendarIcon className="w-4 h-4" />
          <p className="text-xs sm:text-sm">{news.dateLabel}</p>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight">
          {news.title}
        </h3>

        <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
          {news.excerpt ?? ""}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[#31BD9C] font-semibold text-sm group-hover:gap-2.5 transition-all duration-300">
            <span>{readNews}</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Link>
  );
}

function FeaturedNewsCard({
  news,
  className,
  basePath,
  readNews,
}: {
  news: NewsListItemUI;
  className?: string;
  basePath: "/ar" | "/en";
  readNews: string;
}) {
  return (
    <Link
      href={`${basePath}/${news.id}`}
      className={[
        "group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1.5 border border-neutral-100 hover:border-[#31BD9C]/30",
        "sm:col-span-2 lg:col-span-4",
        className ?? "",
      ].join(" ")}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C] z-10" />

      <div className="relative w-full overflow-hidden aspect-video lg:aspect-[16/10]">
        <Image
          src={getImageSrc(news.coverImageId)}
          alt={news.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 right-3 z-20">
          <span className="px-3 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full backdrop-blur-sm">
            {news.categoryLabel}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[#31BD9C] font-medium mb-3">
          <CalendarIcon className="w-4 h-4" />
          <p className="text-xs sm:text-sm">{news.dateLabel}</p>
        </div>

        <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-neutral-900 mb-3 line-clamp-2 group-hover:text-[#31BD9C] transition-colors duration-300 leading-tight">
          {news.title}
        </h3>

        <p className="text-sm sm:text-base text-neutral-600 line-clamp-3 leading-relaxed">
          {news.excerpt ?? ""}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[#31BD9C] font-semibold text-sm group-hover:gap-2.5 transition-all duration-300">
            <span>{readNews}</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-[#31BD9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Link>
  );
}

type ApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: NewsListItemUI[];
};

export default function NewsPageClient({
  initial,
  locale = "ar",
}: {
  initial: ApiResponse;
  locale?: "ar" | "en";
}) {
  const basePath: "/ar" | "/en" = locale === "ar" ? "/ar" : "/en";
  const t = getTranslations(locale);
  const allLabel = t.newsPage.all;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(allLabel);
  const [page, setPage] = useState(initial.page || 1);
  const pageSize = 9;

  const [items, setItems] = useState<NewsListItemUI[]>(initial.items ?? []);
  const [total, setTotal] = useState<number>(initial.total ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const lastReq = useRef(0);

  const categories = useMemo(() => [allLabel, ...NEWS_CATEGORIES], [allLabel]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paged = items;

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  // توازن الشبكة (خصوصاً مع RTL) عبر توسيط آخر صف عندما لا يكون مكتمل
  const smLastIsSingle = paged.length % 2 === 1; // شبكة 2 أعمدة على sm
  const lgTail = paged.slice(2); // بعد (featured + بطاقة تكمّل أول صف)
  const lgRemainder = lgTail.length % 3; // شبكة 3 بطاقات/صف على lg
  const lgLastRowStartIndex = lgTail.length - lgRemainder; // index داخل lgTail

  const visiblePages = useMemo(
    () => getVisiblePages(safePage, totalPages),
    [safePage, totalPages]
  );

  // Fetch from DB (API) with debounce for query typing
  useEffect(() => {
    const q = normalizeArabicSearch(query);
    const cat = category === allLabel ? "" : category;
    const currentPage = safePage;

    const reqId = ++lastReq.current;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const sp = new URLSearchParams();
        if (q) sp.set("q", q);
        if (cat) sp.set("category", cat);
        sp.set("page", String(currentPage));
        sp.set("pageSize", String(pageSize));
        sp.set("locale", locale);

        const res = await fetch(`/api/news?${sp.toString()}`, {
          method: "GET",
          cache: "no-store",
        });
        const json = (await res.json()) as ApiResponse;
        if (reqId !== lastReq.current) return;
        if (!res.ok) throw new Error(t.newsPage.fetchError);
        setItems(json.items ?? []);
        setTotal(Number(json.total ?? 0));
      } catch {
        if (reqId === lastReq.current) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (reqId === lastReq.current) setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, safePage]);

  return (
    <div className="w-full bg-gradient-to-b from-white to-neutral-50 overflow-x-hidden">
      {/* News Hero Section */}
      <section className="relative w-full h-[28vh] sm:h-[32vh] md:h-[45vh] overflow-hidden">
        <Image
          src="/hero-image-2.jpg"
          alt={t.newsPage.heroAlt}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-[#31BD9C]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
              {t.newsPage.heroTitle}
            </h1>
            <div className="mt-3 w-16 h-1 bg-[#31BD9C] mx-auto rounded-full" />
            <p className="mt-3 text-sm md:text-base text-white/90 leading-relaxed">
              {t.newsPage.heroDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 md:-mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="w-full md:max-w-sm">
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <SearchIcon className="w-5 h-5" />
                  </span>
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder={t.newsPage.searchPlaceholder}
                    className="w-full pr-11 pl-3 py-3.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex-1 min-w-0">
                <div className="-mx-1 overflow-x-auto scrollbar-hide overscroll-x-contain touch-pan-x md:mx-0 md:overflow-visible">
                  <div className="flex gap-2 px-1 flex-nowrap md:flex-wrap md:px-0">
                    {categories.map((c) => {
                      const active = c === category;
                      const label = c === allLabel ? allLabel : categoryArabicToLabel(c, locale);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCategory(c);
                            setPage(1);
                          }}
                          className={[
                            "px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/30 focus:ring-offset-2 whitespace-nowrap",
                            active
                              ? "bg-[#31BD9C] text-white shadow-md shadow-[#31BD9C]/25"
                              : "bg-white text-neutral-700 border border-neutral-200 hover:border-[#31BD9C]/60 hover:bg-[#31BD9C]/5 hover:text-[#31BD9C] hover:shadow-sm",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs sm:text-sm text-neutral-500">
              {total === 0 ? (
                <span>{t.newsPage.noResults}</span>
              ) : (
                <span>
                  {t.newsPage.range
                    .replace("{start}", String(rangeStart))
                    .replace("{end}", String(rangeEnd))
                    .replace("{total}", String(total))}
                  {isLoading ? <span className="mr-2">…</span> : null}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="w-full pt-8 sm:pt-10 pb-10 sm:pb-14">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-6 gap-5 sm:gap-6 lg:gap-8">
            {paged.length > 0 && (
              <FeaturedNewsCard
                news={paged[0]}
                basePath={basePath}
                readNews={t.newsPage.readNews}
                className={[
                  smLastIsSingle && paged.length === 1 ? "sm:col-start-2" : "",
                  paged.length === 1 ? "lg:col-start-2" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            )}

            {paged.slice(1).map((news, idx) => {
              const isLastOverall = idx === paged.length - 2; // لأن slice(1)
              const smCenter =
                smLastIsSingle && isLastOverall ? "sm:col-start-2" : "";

              // idx=0 هو الذي يُكمل أول صف بعد featured
              const tailIdx = idx - 1; // داخل lgTail
              let lgCenter = "";
              if (
                tailIdx >= 0 &&
                lgRemainder !== 0 &&
                tailIdx === lgLastRowStartIndex
              ) {
                lgCenter = lgRemainder === 1 ? "lg:col-start-3" : "lg:col-start-2";
              }

              return (
                <NewsCard
                  key={news.id}
                  news={news}
                  basePath={basePath}
                  readNews={t.newsPage.readNews}
                  className={[smCenter, lgCenter].filter(Boolean).join(" ")}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-neutral-500">
                {t.newsPage.rangeShort
                  .replace("{start}", String(rangeStart))
                  .replace("{end}", String(rangeEnd))
                  .replace("{total}", String(total))}
              </div>

              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={[
                    "rounded-full px-3 h-11 md:h-10 text-sm font-semibold transition-all duration-300 ease-in-out border",
                    safePage <= 1
                      ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C] hover:bg-[#31BD9C]/5",
                  ].join(" ")}
                >
                  {t.newsPage.prev}
                </button>

                {visiblePages.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`dots-${idx}`}
                      className="w-10 h-10 inline-flex items-center justify-center text-neutral-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={[
                        "w-11 md:w-10 h-11 md:h-10 rounded-full inline-flex items-center justify-center text-sm font-bold transition-all duration-300 ease-in-out border",
                        p === safePage
                          ? "bg-[#31BD9C] text-white border-[#31BD9C] shadow-lg shadow-[#31BD9C]/30 scale-[1.06] ring-2 ring-[#31BD9C]/25"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C] hover:bg-[#31BD9C]/5",
                      ].join(" ")}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={[
                    "rounded-full px-3 h-11 md:h-10 text-sm font-semibold transition-all duration-300 ease-in-out border",
                    safePage >= totalPages
                      ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C] hover:bg-[#31BD9C]/5",
                  ].join(" ")}
                >
                  {t.newsPage.next}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
