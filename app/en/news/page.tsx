import NewsPageClient from "@/app/news/NewsPageClient";
import { getPublishedNewsPage } from "@/lib/newsRepo";

function formatDate(iso: string | null, locale: string) {
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

export default async function EnNewsPage() {
  const { items, total, page, pageSize } = await getPublishedNewsPage({
    page: 1,
    pageSize: 9,
    locale: "en",
  });
  return (
    <NewsPageClient
      initial={{
        total,
        page,
        pageSize,
        items: items.map((n) => ({
          id: n.id,
          title: n.title,
          excerpt: n.excerpt,
          categoryLabel: n.categoryLabel,
          dateLabel: formatDate(n.publishedAt, "en"),
          coverImageId: n.coverImageId,
          featured: n.featured,
        })),
      }}
      locale="en"
    />
  );
}
