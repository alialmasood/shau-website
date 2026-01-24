import type { Metadata } from "next";
import NewsDetailsView from "@/app/news/NewsDetailsView";
import { getPublishedNewsById } from "@/lib/newsRepo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const news = await getPublishedNewsById(id, "ar");
  if (!news) return {};
  const title = news.title;
  const description =
    news.excerpt?.trim() || news.content?.slice(0, 160).trim() || title;
  const imagePath = news.coverImageId
    ? `/api/media/${news.coverImageId}`
    : "/hero-image-1.jpg";
  const url = `/ar/${id}`;
  return {
    title,
    description,
    openGraph: { title, description, url, type: "article", images: [{ url: imagePath, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [imagePath] },
    alternates: { canonical: url },
  };
}

export default function ArNewsDetailsPage(props: { params: Promise<{ id: string }> }) {
  return <NewsDetailsView {...props} basePath="/ar" />;
}
