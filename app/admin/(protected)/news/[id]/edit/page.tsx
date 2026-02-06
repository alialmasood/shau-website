import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminNewsById } from "@/lib/newsAdminRepo";
import EditNewsForm from "./EditNewsForm";

export default async function AdminEditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await getAdminNewsById(id);
  if (!news) notFound();

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              تعديل خبر
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              عدّل البيانات ثم احفظ، ويمكنك رفع غلاف جديد.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/news"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8">
          <EditNewsForm
            id={news.id}
            initial={{
              title: news.title,
              titleEn: news.titleEn,
              slug: news.slug,
              excerpt: news.excerpt,
              excerptEn: news.excerptEn,
              content: news.content,
              contentEn: news.contentEn,
              categoryCode: news.categoryCode,
              published: news.published,
              featured: news.featured,
              coverImageId: news.coverImageId,
              secondaryImageId: news.secondaryImageId,
              secondaryImage2Id: news.secondaryImage2Id,
              videoUrl: news.videoUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}

