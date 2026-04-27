import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import { getAdminCePage } from "@/lib/ceAdminRepo";
import DeleteCeForm from "./DeleteCeForm";
import { togglePublishCe } from "./actions";

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function parsePage(v: string | undefined) {
  const n = Number.parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function AdminCePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }> | { q?: string; page?: string };
}) {
  const ok = await canAdmin("continuing-education", "access");
  if (!ok) redirect("/admin");

  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const q = (sp.q ?? "").trim();
  const page = parsePage(sp.page);
  const { items, total } = await getAdminCePage({ page, pageSize: 20, q: q || null });
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">التعليم المستمر</h1>
            <p className="mt-2 text-sm text-neutral-600">ندوات، ورش، دورات، إعلانات، تقارير، وشهادات مشاركة.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/continuing-education/new" className="inline-flex px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold">
              نشاط جديد
            </Link>
            <Link href="/admin" className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold">
              رجوع
            </Link>
          </div>
        </div>
        <form method="get" className="flex flex-wrap gap-2 mb-6">
          <input name="q" defaultValue={q} placeholder="بحث…" className="flex-1 min-w-[180px] px-4 py-2 rounded-xl border" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-neutral-100 font-bold text-sm">
            بحث
          </button>
        </form>

        {items.length === 0 ? (
          <p className="text-neutral-600 py-8">لا توجد أنشطة.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 font-bold">
                <tr>
                  <td className="p-2">غلاف</td>
                  <td className="p-2">العنوان</td>
                  <td className="p-2">الموعد</td>
                  <td className="p-2">إعلان/تقرير</td>
                  <td className="p-2">نشر</td>
                  <td className="p-2 text-end">إجراءات</td>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-neutral-50/60">
                    <td className="p-2">
                      <div className="relative h-10 w-14 rounded overflow-hidden bg-neutral-100">
                        {r.coverImageId ? (
                          <Image src={`/api/media/${r.coverImageId}`} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <span className="text-[10px] p-1 text-neutral-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 font-semibold max-w-[200px] line-clamp-2">{r.titleAr}</td>
                    <td className="p-2 whitespace-nowrap">{fmt(r.eventStartsAt)}</td>
                    <td className="p-2 text-xs">
                      {r.showAnnouncement ? "إعلان " : ""}
                      {r.showRecap ? "تقرير" : ""}
                    </td>
                    <td className="p-2">
                      <form action={togglePublishCe}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="next" value={r.published ? "0" : "1"} />
                        <button type="submit" className={`text-xs font-bold px-2 py-1 rounded-lg ${r.published ? "bg-emerald-100" : "bg-neutral-200"}`}>
                          {r.published ? "منشور" : "مسودة"}
                        </button>
                      </form>
                    </td>
                    <td className="p-2 text-end space-x-2 space-x-reverse">
                      <Link href={`/admin/continuing-education/${r.id}/edit`} className="text-[#31BD9C] font-bold text-xs">
                        تعديل
                      </Link>
                      <DeleteCeForm id={r.id} />
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
                href={`/admin/continuing-education?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${p === page ? "bg-[#31BD9C] text-white" : "bg-neutral-100"}`}
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
