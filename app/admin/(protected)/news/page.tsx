import Link from "next/link";
import Image from "next/image";
import { getAdminNewsPage } from "@/lib/newsAdminRepo";
import { type NewsCategoryCode } from "@/lib/newsCategory";
import { deleteNews, toggleFeaturedNews, togglePublishNews } from "./actions";

function formatArabicDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function parsePage(v: string | undefined) {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parsePublished(v: string | undefined): "all" | "published" | "unpublished" {
  if (v === "published" || v === "unpublished") return v;
  return "all";
}

function parseCategory(v: string | undefined): NewsCategoryCode | null {
  if (v === "ADMINISTRATIVE" || v === "SCIENTIFIC" || v === "ACTIVITIES" || v === "ANNOUNCEMENTS") {
    return v;
  }
  return null;
}

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    published?: string;
    page?: string;
  };
}) {
  const q = (searchParams.q ?? "").trim();
  const category = parseCategory(searchParams.category);
  const published = parsePublished(searchParams.published);
  const page = parsePage(searchParams.page);

  const pageSize = 20;
  const { items, total } = await getAdminNewsPage({
    q: q || null,
    category,
    published,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              إدارة الأخبار
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              بحث، تصنيف، حالة النشر، مع إجراءات سريعة (نشر/إخفاء، تمييز، حذف).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/news/new"
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
            >
              خبر جديد
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 sm:p-6 mb-6">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                بحث
              </label>
              <input
                name="q"
                defaultValue={q}
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
                placeholder="ابحث بالعنوان أو الملخص..."
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                التصنيف
              </label>
              <select
                name="category"
                defaultValue={category ?? ""}
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              >
                <option value="">الكل</option>
                <option value="ADMINISTRATIVE">أخبار إدارية</option>
                <option value="SCIENTIFIC">أخبار علمية</option>
                <option value="ACTIVITIES">نشاطات وفعاليات</option>
                <option value="ANNOUNCEMENTS">إعلانات</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                النشر
              </label>
              <select
                name="published"
                defaultValue={published}
                className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              >
                <option value="all">الكل</option>
                <option value="published">منشور</option>
                <option value="unpublished">غير منشور</option>
              </select>
            </div>

            <div className="md:col-span-12 flex items-center justify-between gap-3">
              <div className="text-sm text-neutral-600">
                إجمالي النتائج: <b className="text-neutral-900">{total}</b>
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors"
              >
                تطبيق
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-right px-4 py-3 font-bold">الغلاف</th>
                  <th className="text-right px-4 py-3 font-bold">العنوان</th>
                  <th className="text-right px-4 py-3 font-bold">التصنيف</th>
                  <th className="text-center px-4 py-3 font-bold">منشور</th>
                  <th className="text-center px-4 py-3 font-bold">مميز</th>
                  <th className="text-center px-4 py-3 font-bold">تاريخ النشر</th>
                  <th className="text-center px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600" colSpan={7}>
                      لا توجد أخبار مطابقة.
                    </td>
                  </tr>
                ) : (
                  items.map((n) => (
                    <tr key={n.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100">
                          {n.coverImageId ? (
                            <Image
                              src={`/api/media/${n.coverImageId}`}
                              alt={n.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-900 line-clamp-1 max-w-[420px]">
                          {n.title}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {n.slug ? (
                            <span>
                              slug: <span className="font-mono">{n.slug}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">بدون slug</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {n.categoryLabel}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <form action={togglePublishNews}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="next" value={n.published ? "0" : "1"} />
                          <button
                            type="submit"
                            className={[
                              "px-3 py-2 rounded-full text-xs font-bold transition-all border",
                              n.published
                                ? "bg-[#31BD9C] text-white border-[#31BD9C] hover:bg-[#2aa88a]"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
                            ].join(" ")}
                          >
                            {n.published ? "منشور" : "غير منشور"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <form action={toggleFeaturedNews}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="next" value={n.featured ? "0" : "1"} />
                          <button
                            type="submit"
                            className={[
                              "px-3 py-2 rounded-full text-xs font-bold transition-all border",
                              n.featured
                                ? "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900",
                            ].join(" ")}
                          >
                            {n.featured ? "مميز" : "عادي"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-700">
                        {formatArabicDate(n.publishedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/news/${n.id}/edit`}
                            className="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-xs font-bold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
                          >
                            تعديل
                          </Link>
                          <form action={deleteNews}>
                            <input type="hidden" name="id" value={n.id} />
                            <button
                              type="submit"
                              className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                            >
                              حذف
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-neutral-600">
            صفحة <b className="text-neutral-900">{page}</b> من{" "}
            <b className="text-neutral-900">{totalPages}</b>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={{
                pathname: "/admin/news",
                query: { q, category: category ?? "", published, page: String(Math.max(1, page - 1)) },
              }}
              className={[
                "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                page <= 1
                  ? "bg-neutral-100 text-neutral-400 border-neutral-200 pointer-events-none"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
              ].join(" ")}
            >
              السابق
            </Link>
            <Link
              href={{
                pathname: "/admin/news",
                query: { q, category: category ?? "", published, page: String(Math.min(totalPages, page + 1)) },
              }}
              className={[
                "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                page >= totalPages
                  ? "bg-neutral-100 text-neutral-400 border-neutral-200 pointer-events-none"
                  : "bg-white text-neutral-800 border-neutral-200 hover:border-[#31BD9C] hover:text-[#31BD9C]",
              ].join(" ")}
            >
              التالي
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

