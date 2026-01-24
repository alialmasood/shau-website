import { NextResponse } from "next/server";
import { getPublishedNewsPage } from "@/lib/newsRepo";

export const runtime = "nodejs";

function toInt(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(iso: string | null, locale: "ar" | "en") {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const category = (url.searchParams.get("category") ?? "").trim(); // Arabic label or empty (للتوافق مع الفلتر)
  const locale = (url.searchParams.get("locale") === "en" ? "en" : "ar") as "ar" | "en";
  const page = toInt(url.searchParams.get("page"), 1);
  const pageSize = toInt(url.searchParams.get("pageSize"), 9);

  const { items, total } = await getPublishedNewsPage({
    page,
    pageSize,
    q: q || null,
    categoryLabel: category || null,
    locale,
  });

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      excerpt: n.excerpt,
      categoryLabel: n.categoryLabel,
      dateLabel: formatDate(n.publishedAt, locale),
      coverImageId: n.coverImageId,
      featured: n.featured,
    })),
  });
}

