import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { educationLevelLabelAr, jobCategoryLabelAr } from "@/lib/employeeIdentityConfig";
import {
  ensureEmployeeIdentityNumber,
  listEmployeeIdentityRequests,
} from "@/lib/employeeIdentityRequestsRepo";
import EmployeeIdentityQrCell from "./EmployeeIdentityQrCell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatDob(s: string): string {
  if (!s) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", { dateStyle: "medium" }).format(new Date(s + "T12:00:00"));
  } catch {
    return s;
  }
}

export default async function EmployeeIdentityAdminPage() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("employee-identity", "access"));

  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-[40vh] flex items-center justify-center rounded-2xl border border-neutral-200 p-8">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  let rows: Awaited<ReturnType<typeof listEmployeeIdentityRequests>> = [];
  try {
    rows = await listEmployeeIdentityRequests();
    await Promise.all(
      rows.map(async (r) => {
        if (!r.identity_number) {
          r.identity_number = await ensureEmployeeIdentityNumber(r.id);
        }
      })
    );
  } catch (e) {
    console.error("[employee-identity] list failed", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-[#04025E] mb-3"
          >
            ← العودة إلى لوحة التحكم
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">هويات الموظفين</h1>
          <p className="text-sm text-neutral-600 mt-1">
            طلبات مقدّمة من{" "}
            <Link href="/ar/employee-identity-request" className="text-[#04025E] font-semibold hover:underline">
              نموذج طلب هوية الموظف
            </Link>
            — جدول رسمي مع QR وباركود وتحميل ملف باسم كل موظف
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            إجمالي الطلبات: <span className="font-bold text-neutral-800">{rows.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/api/admin/employee-identity/export/excel"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-[#04025E]/40 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            تصدير Excel
          </a>
          <a
            href="/api/admin/employee-identity/export/pdf"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-[#04025E]/40 transition-colors"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            تصدير PDF
          </a>
        </div>
      </div>

      <div className="w-screen max-w-[100vw] ms-[calc(50%-50vw)] me-[calc(50%-50vw)]">
        <div className="overflow-x-auto rounded-none sm:rounded-2xl border-y sm:border border-neutral-200 bg-white shadow-sm px-3 sm:px-4 lg:px-6">
          <table className="w-full border-collapse text-sm table-auto">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-800">
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">توقيت الإرسال</th>
                <th className="px-3 py-3 text-center font-bold whitespace-nowrap">رمز QR</th>
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">رقم الهوية</th>
                <th className="px-3 py-3 text-right font-bold">الاسم (عربي)</th>
                <th className="px-3 py-3 text-right font-bold">الاسم (إنجليزي)</th>
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">التولد</th>
                <th className="px-3 py-3 text-right font-bold">عنوان السكن</th>
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">الهاتف</th>
                <th className="px-3 py-3 text-center font-bold whitespace-nowrap">فصيلة الدم</th>
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">التحصيل العلمي</th>
                <th className="px-3 py-3 text-right font-bold">مكان العمل</th>
                <th className="px-3 py-3 text-right font-bold whitespace-nowrap">الوظيفة</th>
                <th className="px-3 py-3 text-right font-bold">المنصب</th>
                <th className="px-3 py-3 text-right font-bold">البريد الرسمي</th>
                <th className="px-3 py-3 text-center font-bold whitespace-nowrap">الصورة</th>
                <th className="px-3 py-3 text-center font-bold whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-3 py-10 text-center text-neutral-500 font-medium">
                    لا توجد طلبات بعد
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50/80 align-top">
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-700 tabular-nums">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.identity_number ? (
                        <EmployeeIdentityQrCell
                          identityNumber={r.identity_number}
                          requestId={r.id}
                          nameAr={r.name_ar}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-neutral-800 text-xs font-semibold whitespace-nowrap" dir="ltr">
                      {r.identity_number ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-900 font-medium">{r.name_ar}</td>
                    <td className="px-3 py-2.5 text-neutral-800" dir="ltr">
                      {r.name_en}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-700">{formatDob(r.date_of_birth)}</td>
                    <td className="px-3 py-2.5 text-neutral-700 min-w-[8rem]">{r.address}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-700" dir="ltr">
                      {r.phone}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-semibold" dir="ltr">
                      {r.blood_type}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-700 whitespace-nowrap">
                      {r.education_level ? educationLevelLabelAr(r.education_level) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-800">{r.workplace}</td>
                    <td className="px-3 py-2.5 text-neutral-700 whitespace-nowrap">
                      {jobCategoryLabelAr(r.job_category)}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-700">{r.position || "—"}</td>
                    <td className="px-3 py-2.5 text-neutral-700 break-all" dir="ltr">
                      {r.official_email || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {r.photo_media_id ? (
                        <a
                          href={`/api/media/${r.photo_media_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded-lg border border-neutral-200 overflow-hidden hover:ring-2 hover:ring-[#04025E]/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/media/${r.photo_media_id}`}
                            alt=""
                            width={56}
                            height={56}
                            className="object-cover w-14 h-14 block mx-auto"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1.5">
                        <a
                          href={`/api/admin/employee-identity/${r.id}/download`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#04025E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a3a8f] transition-colors"
                          title="تحميل ZIP: بيانات + صورة + QR + باركود"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          تحميل الملف
                        </a>
                        {r.identity_number && (
                          <a
                            href={`/api/admin/employee-identity/${r.id}/qr`}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-700 hover:bg-neutral-50"
                          >
                            QR
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
