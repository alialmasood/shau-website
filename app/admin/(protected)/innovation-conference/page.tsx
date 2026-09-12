import Link from "next/link";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import {
  getInnovationConferenceAdminStats,
  listInnovationConferenceApplications,
} from "@/lib/innovationConferenceAdminRepo";
import { getStatusPublicCopy } from "@/lib/innovationConferenceStatus";
import { IC_ADMIN_STATUS_BADGE } from "@/lib/innovationConferenceTransitions";
import {
  IC_APPLICANT_ROLES,
  IC_APPLICATION_STATUSES,
  IC_INNOVATION_FIELDS,
  type IcApplicationStatus,
} from "@/lib/innovationConferenceTypes";
import { IC_FIELD_OPTIONS, IC_ROLE_LABELS } from "@/lib/innovationConferenceUi";

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

function fieldLabel(v: string) {
  return IC_FIELD_OPTIONS.find((f) => f.value === v)?.title ?? v;
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(params)) {
    if (val) sp.set(k, val);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminInnovationConferencePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    field?: string;
    role?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const ok = await canAdmin("innovation-conference", "access");
  if (!ok) redirect("/admin");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();
  const field = (sp.field ?? "").trim();
  const role = (sp.role ?? "").trim();
  const type = (sp.type ?? "").trim();
  const sort = sp.sort === "oldest" ? "oldest" : "newest";
  const page = parsePage(sp.page);
  const pageSize = 20;

  let items: Awaited<ReturnType<typeof listInnovationConferenceApplications>>["items"] = [];
  let total = 0;
  let stats = {
    total: 0,
    submitted: 0,
    underReview: 0,
    scientificReview: 0,
    accepted: 0,
    finalistsAndWinners: 0,
  };
  let loadError: string | null = null;

  try {
    const [list, st] = await Promise.all([
      listInnovationConferenceApplications({
        q: q || null,
        status: status || null,
        innovationField: field || null,
        applicantRole: role || null,
        participationType: type || null,
        sort,
        page,
        pageSize,
      }),
      getInnovationConferenceAdminStats(),
    ]);
    items = list.items;
    total = list.total;
    stats = st;
  } catch {
    loadError = "تعذر تحميل الطلبات. حاول مرة أخرى.";
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filterBase = {
    q: q || undefined,
    status: status || undefined,
    field: field || undefined,
    role: role || undefined,
    type: type || undefined,
    sort: sort === "oldest" ? "oldest" : undefined,
  };

  const kpis = [
    { label: "إجمالي الطلبات", value: stats.total },
    { label: "تم الاستلام", value: stats.submitted },
    { label: "قيد المراجعة", value: stats.underReview },
    { label: "التقييم العلمي", value: stats.scientificReview },
    { label: "المقبولة", value: stats.accepted },
    { label: "نهائية / فائزة", value: stats.finalistsAndWinners },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold text-[#31BD9C]">مؤتمر الابتكار 2026</p>
            <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">طلبات المشاركة</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              إدارة ومراجعة طلبات المشاركة في مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026.
            </p>
          </div>
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
          >
            رجوع
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3"
            >
              <p className="text-[11px] font-semibold text-neutral-500">{k.label}</p>
              <p className="mt-1 text-xl font-extrabold text-neutral-900 tabular-nums">{k.value}</p>
            </div>
          ))}
        </div>

        <form method="get" className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <input
            name="q"
            defaultValue={q}
            placeholder="بحث: رقم، مشروع، اسم، هاتف، بريد…"
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2"
          />
          <select name="status" defaultValue={status} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <option value="">كل الحالات</option>
            {IC_APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusPublicCopy(s).title}
              </option>
            ))}
          </select>
          <select name="field" defaultValue={field} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <option value="">كل المجالات</option>
            {IC_INNOVATION_FIELDS.map((f) => (
              <option key={f} value={f}>
                {fieldLabel(f)}
              </option>
            ))}
          </select>
          <select name="role" defaultValue={role} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <option value="">كل الصفات</option>
            {IC_APPLICANT_ROLES.map((r) => (
              <option key={r} value={r}>
                {IC_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={type} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <option value="">فردي / فريق</option>
            <option value="individual">فردي</option>
            <option value="team">فريق</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-bold hover:bg-neutral-200 xl:col-span-1"
          >
            تطبيق
          </button>
        </form>

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-700">{loadError}</p>
            <Link
              href="/admin/innovation-conference"
              className="mt-3 inline-block text-sm font-bold text-[#31BD9C] hover:underline"
            >
              إعادة المحاولة
            </Link>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-neutral-600">
            لا توجد طلبات مطابقة للبحث أو الفلاتر.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-neutral-100 md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 font-bold text-neutral-700">
                  <tr>
                    <th className="px-3 py-2 text-start">رقم المشاركة</th>
                    <th className="px-3 py-2 text-start">اسم المشروع</th>
                    <th className="px-3 py-2 text-start">مقدم الطلب</th>
                    <th className="px-3 py-2 text-start">المجال</th>
                    <th className="px-3 py-2 text-start">النوع</th>
                    <th className="px-3 py-2 text-start">الحالة</th>
                    <th className="px-3 py-2 text-start">تاريخ الإرسال</th>
                    <th className="px-3 py-2 text-end">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const st = row.status as IcApplicationStatus;
                    return (
                      <tr key={row.id} className="border-t border-neutral-100 hover:bg-neutral-50/60">
                        <td className="px-3 py-2 font-mono text-xs font-bold" dir="ltr">
                          {row.participationCode}
                        </td>
                        <td className="max-w-[200px] px-3 py-2 font-semibold text-neutral-900">
                          <span className="line-clamp-2">{row.projectTitle}</span>
                        </td>
                        <td className="px-3 py-2 text-neutral-800">{row.fullName}</td>
                        <td className="max-w-[140px] px-3 py-2 text-xs text-neutral-600">
                          <span className="line-clamp-2">{fieldLabel(row.innovationField)}</span>
                        </td>
                        <td className="px-3 py-2 text-neutral-700">
                          {row.participationType === "team" ? "فريق" : "فردي"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-bold ${IC_ADMIN_STATUS_BADGE[st]}`}
                          >
                            {getStatusPublicCopy(st).title}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {formatArDate(row.submittedAt)}
                        </td>
                        <td className="px-3 py-2 text-end">
                          <Link
                            href={`/admin/innovation-conference/${row.id}`}
                            prefetch={false}
                            className="text-xs font-bold text-[#31BD9C] hover:underline"
                          >
                            عرض التفاصيل
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {items.map((row) => {
                const st = row.status as IcApplicationStatus;
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs font-bold text-[#163364]" dir="ltr">
                        {row.participationCode}
                      </p>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${IC_ADMIN_STATUS_BADGE[st]}`}
                      >
                        {getStatusPublicCopy(st).title}
                      </span>
                    </div>
                    <p className="mt-2 font-bold text-neutral-900">{row.projectTitle}</p>
                    <p className="mt-1 text-sm text-neutral-700">{row.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{fieldLabel(row.innovationField)}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatArDate(row.submittedAt)}</p>
                    <Link
                      href={`/admin/innovation-conference/${row.id}`}
                      prefetch={false}
                      className="mt-3 inline-flex text-sm font-bold text-[#31BD9C] hover:underline"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-neutral-500">
                صفحة {page} من {totalPages} · {total} نتيجة
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/innovation-conference${buildQuery({
                      ...filterBase,
                      page: String(page - 1),
                    })}`}
                    prefetch={false}
                    className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200"
                  >
                    السابق
                  </Link>
                )}
                <span className="rounded-lg bg-[#31BD9C] px-3 py-1.5 text-sm font-bold text-white">
                  {page}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/admin/innovation-conference${buildQuery({
                      ...filterBase,
                      page: String(page + 1),
                    })}`}
                    prefetch={false}
                    className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200"
                  >
                    التالي
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
