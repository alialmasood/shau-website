import NewsPageClient from "./NewsPageClient";
import { getPublishedNewsPage } from "@/lib/newsRepo";

function formatArabicDate(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export default async function NewsPage() {
  const { items, total, page, pageSize } = await getPublishedNewsPage({
    page: 1,
    pageSize: 9,
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
          dateLabel: formatArabicDate(n.publishedAt),
          coverImageId: n.coverImageId,
          featured: n.featured,
        })),
      }}
    />
  );
}

