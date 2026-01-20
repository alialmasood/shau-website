import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SocialShare from "../SocialShare";
import {
  getPublishedNewsById,
  getRelatedPublishedNews,
} from "@/lib/newsRepo";

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

function TagIcon({ className }: { className?: string }) {
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
        d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828L12.414 1.586A2 2 0 0011 1H5a2 2 0 00-2 2v6a2 2 0 00.586 1.414L3 11z"
      />
    </svg>
  );
}

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const news = await getPublishedNewsById(rawId);
  if (!news) notFound();

  const related = await getRelatedPublishedNews({
    id: news.id,
    categoryLabel: news.categoryLabel,
    limit: 3,
  });

  const coverSrc = news.coverImageId
    ? `/api/media/${news.coverImageId}`
    : "/hero-image-1.jpg";

  const dateLabel = news.publishedAt
    ? new Intl.DateTimeFormat("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(news.publishedAt))
    : "";

  const blocks = news.content
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="w-full bg-white overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-neutral-500 mb-5">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-[#31BD9C] transition-colors">
                الرئيسية
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li>
              <Link
                href="/news"
                className="hover:text-[#31BD9C] transition-colors"
              >
                الأخبار
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li className="text-neutral-700 line-clamp-1 max-w-[85vw]">
              {news.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 leading-tight">
            {news.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#31BD9C]" />
              <span>{dateLabel}</span>
            </span>
            <span className="text-neutral-300">•</span>
            <span className="inline-flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-[#31BD9C]" />
              <span>{news.categoryLabel}</span>
            </span>
          </div>
        </header>

        {/* Main image */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-100 shadow-sm">
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={coverSrc}
              alt={news.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          </div>
        </div>

        {/* Content */}
        <article className="mt-7 sm:mt-10 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-7">
          {blocks.map((text, idx) => {
            const isH2 = text.startsWith("## ");
            const isH3 = text.startsWith("### ");
            if (isH2) {
              return (
                <h2
                  key={idx}
                  className="text-lg sm:text-xl font-bold text-neutral-900 mt-7 first:mt-0 mb-3"
                >
                  {text.replace(/^##\s+/, "")}
                </h2>
              );
            }
            if (isH3) {
              return (
                <h3
                  key={idx}
                  className="text-base sm:text-lg font-bold text-neutral-900 mt-6 mb-2"
                >
                  {text.replace(/^###\s+/, "")}
                </h3>
              );
            }
            return (
              <p
                key={idx}
                className="text-sm sm:text-base text-neutral-700 leading-7 sm:leading-8 mt-4 first:mt-0"
              >
                {text}
              </p>
            );
          })}

          {/* Share */}
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-3">
              مشاركة الخبر
            </h3>
            <SocialShare title={news.title} />
          </div>
        </article>

        {/* Related news */}
        <section className="mt-8 sm:mt-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
              أخبار ذات صلة
            </h3>
            <Link
              href="/news"
              className="text-sm font-semibold text-[#0b63ce] hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none pb-2">
            {related.map((n) => (
              <Link
                key={n.id}
                href={`/news/${n.id}`}
                className="group flex-shrink-0 md:flex-shrink bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-[85%] sm:w-[65%] md:w-auto snap-start"
              >
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image
                    src={
                      n.coverImageId ? `/api/media/${n.coverImageId}` : "/hero-image-1.jpg"
                    }
                    alt={n.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-[#31BD9C] text-white text-xs font-semibold rounded-full">
                      {n.categoryLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[#31BD9C] font-medium mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">
                      {n.publishedAt
                        ? new Intl.DateTimeFormat("ar-IQ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(new Date(n.publishedAt))
                        : ""}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-neutral-900 line-clamp-2 group-hover:text-[#31BD9C] transition-colors">
                    {n.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

