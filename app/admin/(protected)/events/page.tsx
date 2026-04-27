import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import { getAdminEventsPage } from "@/lib/eventsAdminRepo";
import { toggleFeaturedEvent, togglePublishEvent } from "./actions";
import DeleteEventForm from "./DeleteEventForm";

function formatArDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function parsePage(v: string | undefined) {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }> | { q?: string; page?: string };
}) {
  const ok = await canAdmin("events", "access");
  if (!ok) redirect("/admin");

  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const q = (sp.q ?? "").trim();
  const page = parsePage(sp.page);
  const pageSize = 20;
  const { items, total } = await getAdminEventsPage({ page, pageSize, q: q || null });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">إدارة الأحداث</h1>
            <p className="mt-2 text-sm text-neutral-600">
              إنشاء فعاليات بالعربي والإنجليزي، مواعيد، صور، فيديو يوتيوب، وملفات للتحميل.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/events/new"
              prefetch={false}
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a]"
            >
              حدث جديد
            </Link>
            <Link
              href="/admin"
              prefetch={false}
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800"
            >
              رجوع
            </Link>
          </div>
        </div>

        <form method="get" className="flex flex-wrap gap-2 mb-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="بحث في العنوان أو النبذة…"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-neutral-200"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-neutral-100 font-bold text-sm hover:bg-neutral-200">
            بحث
          </button>
        </form>

        {items.length === 0 ? (
          <p className="text-neutral-600 py-8">لا توجد أحداث. أنشئ حدثاً جديداً.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-100">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-700 font-bold">
                <tr>
                  <th className="text-start px-3 py-2">الغلاف</th>
                  <th className="text-start px-3 py-2">العنوان</th>
                  <th className="text-start px-3 py-2">الموعد</th>
                  <th className="text-start px-3 py-2">النشر</th>
                  <th className="text-start px-3 py-2">مميز</th>
                  <th className="text-end px-3 py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ev) => (
                  <tr key={ev.id} className="border-t border-neutral-100 hover:bg-neutral-50/60">
                    <td className="px-3 py-2">
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-neutral-100">
                        {ev.coverImageId ? (
                          <Image
                            src={`/api/media/${ev.coverImageId}`}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[10px] text-neutral-400 p-1">بدون</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-neutral-900 max-w-[220px]">
                      <div className="line-clamp-2">{ev.titleAr}</div>
                      {ev.titleEn && <div className="text-xs text-neutral-500 line-clamp-1">{ev.titleEn}</div>}
                    </td>
                    <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">{formatArDate(ev.startsAt)}</td>
                    <td className="px-3 py-2">
                      <form action={togglePublishEvent}>
                        <input type="hidden" name="id" value={ev.id} />
                        <input type="hidden" name="next" value={ev.published ? "0" : "1"} />
                        <button
                          type="submit"
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            ev.published ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {ev.published ? "منشور" : "مسودة"}
                        </button>
                      </form>
                    </td>
                    <td className="px-3 py-2">
                      <form action={toggleFeaturedEvent}>
                        <input type="hidden" name="id" value={ev.id} />
                        <input type="hidden" name="next" value={ev.featured ? "0" : "1"} />
                        <button
                          type="submit"
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            ev.featured ? "bg-amber-100 text-amber-900" : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {ev.featured ? "مميز" : "عادي"}
                        </button>
                      </form>
                    </td>
                    <td className="px-3 py-2 text-end whitespace-nowrap space-x-1 space-x-reverse">
                      <Link
                        href={`/admin/events/${ev.id}/edit`}
                        prefetch={false}
                        className="inline-flex text-[#31BD9C] font-bold hover:underline text-xs"
                      >
                        تعديل
                      </Link>
                      <span className="inline ms-2">
                        <DeleteEventForm id={ev.id} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/admin/events?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                prefetch={false}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  p === page ? "bg-[#31BD9C] text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
