import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { canAdmin } from "@/lib/adminAuthz";
import { getInnovationConferenceApplicationAdminDetail } from "@/lib/innovationConferenceAdminRepo";
import { getStatusPublicCopy } from "@/lib/innovationConferenceStatus";
import {
  getAllowedNextStatuses,
  IC_ADMIN_STATUS_BADGE,
} from "@/lib/innovationConferenceTransitions";
import type { IcApplicationStatus } from "@/lib/innovationConferenceTypes";
import {
  IC_FIELD_OPTIONS,
  IC_GENDER_LABELS,
  IC_PATENT_LABELS,
  IC_ROLE_LABELS,
  IC_STAGE_OPTIONS,
} from "@/lib/innovationConferenceUi";
import { AdminNotesForm, StatusUpdateForm } from "../IcAdminForms";

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

function fieldLabel(v: string) {
  return IC_FIELD_OPTIONS.find((f) => f.value === v)?.title ?? v;
}

function stageLabel(v: string) {
  return IC_STAGE_OPTIONS.find((s) => s.value === v)?.title ?? v;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-100 bg-white p-4 sm:p-5">
      <h2 className="mb-3 text-base font-extrabold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-neutral-50 py-2 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold text-neutral-500">{label}</dt>
      <dd className="break-words text-sm text-neutral-800">{value || "—"}</dd>
    </div>
  );
}

export default async function AdminInnovationConferenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ok = await canAdmin("innovation-conference", "access");
  if (!ok) redirect("/admin");

  const { id } = await params;
  const canEdit = await canAdmin("innovation-conference", "edit");
  const canViewAttachments =
    (await canAdmin("innovation-conference", "view")) ||
    (await canAdmin("innovation-conference", "access"));

  const detail = await getInnovationConferenceApplicationAdminDetail(id);
  if (!detail) notFound();

  const st = detail.status as IcApplicationStatus;
  const copy = getStatusPublicCopy(st);
  const allowedNext = getAllowedNextStatuses(st);
  const images = detail.attachments.filter((a) => a.kind === "project_image");
  const pdfs = detail.attachments.filter((a) => a.kind === "project_pdf");
  const patents = detail.attachments.filter((a) => a.kind === "patent_document");

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-5 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="font-mono text-xs font-bold text-[#31BD9C]" dir="ltr">
                {detail.participationCode}
              </p>
              <h1 className="mt-1 text-xl font-extrabold text-neutral-900 sm:text-2xl">
                {detail.projectTitle}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{detail.fullName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${IC_ADMIN_STATUS_BADGE[st]}`}
                >
                  {copy.title}
                </span>
                <span className="text-xs text-neutral-500">
                  أُرسل: {formatArDate(detail.submittedAt)}
                </span>
              </div>
            </div>
            <Link
              href="/admin/innovation-conference"
              prefetch={false}
              className="inline-flex shrink-0 items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
            >
              العودة للقائمة
            </Link>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Section title="بيانات المشارك">
              <dl>
                <Row label="الاسم" value={detail.fullName} />
                <Row label="تاريخ الميلاد" value={detail.birthDate} />
                <Row
                  label="الجنس"
                  value={detail.gender ? IC_GENDER_LABELS[detail.gender] : "—"}
                />
                <Row label="المحافظة" value={detail.governorate} />
                <Row label="الهاتف" value={<span dir="ltr">{detail.phone}</span>} />
                <Row label="البريد" value={<span dir="ltr">{detail.email}</span>} />
                <Row label="الصفة" value={IC_ROLE_LABELS[detail.applicantRole]} />
                <Row label="المؤسسة" value={detail.institutionName} />
                <Row label="المرحلة/التخصص" value={detail.stageOrMajor} />
              </dl>
            </Section>

            <Section title="المشروع">
              <dl>
                <Row label="المجال" value={fieldLabel(detail.innovationField)} />
                <Row label="المرحلة" value={stageLabel(detail.projectStage)} />
                <Row label="الملخص" value={detail.projectSummary} />
                <Row label="المشكلة" value={detail.problem} />
                <Row label="الحل" value={detail.solution} />
                <Row label="الجانب المبتكر" value={detail.novelty} />
                <Row label="المستفيدون" value={detail.beneficiaries} />
                <Row label="الأثر المتوقع" value={detail.expectedImpact} />
                <Row
                  label="رابط الفيديو"
                  value={
                    detail.videoUrl ? (
                      <a
                        href={detail.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#31BD9C] hover:underline"
                        dir="ltr"
                      >
                        {detail.videoUrl}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
              </dl>
            </Section>

            <Section title="الفريق">
              {detail.participationType === "individual" ? (
                <p className="text-sm text-neutral-600">مشاركة فردية</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-[#eef2f8] px-3 py-2 text-sm">
                    <p className="text-xs font-bold text-[#31BD9C]">القائد</p>
                    <p className="font-bold text-neutral-900">{detail.fullName}</p>
                    <p className="text-neutral-600" dir="ltr">
                      {detail.email} · {detail.phone}
                    </p>
                  </div>
                  {detail.teamMembers.length === 0 ? (
                    <p className="text-sm text-neutral-500">لا يوجد أعضاء إضافيون مسجلون.</p>
                  ) : (
                    detail.teamMembers.map((m) => (
                      <div key={m.id} className="rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                        <p className="font-bold text-neutral-900">{m.fullName}</p>
                        {m.roleInTeam && (
                          <p className="text-xs text-neutral-500">{m.roleInTeam}</p>
                        )}
                        <p className="mt-1 text-neutral-600" dir="ltr">
                          {[m.email, m.phone].filter(Boolean).join(" · ") || "—"}
                        </p>
                        {(m.birthDate || m.institutionName) && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {[m.birthDate, m.institutionName].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </Section>

            <Section title="الملكية الفكرية">
              <dl>
                <Row label="عُرض سابقاً" value={detail.shownBefore ? "نعم" : "لا"} />
                {detail.shownBefore && (
                  <Row label="التفاصيل" value={detail.shownBeforeDetails} />
                )}
                <Row label="حالة البراءة" value={IC_PATENT_LABELS[detail.patentStatus]} />
                <Row label="رقم البراءة/الطلب" value={detail.patentNumber} />
              </dl>
            </Section>

            <Section title="المرفقات">
              {!canViewAttachments ? (
                <p className="text-sm text-neutral-500">لا توجد صلاحية لعرض المرفقات.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold text-neutral-500">صور المشروع</p>
                    {images.length === 0 ? (
                      <p className="text-sm text-neutral-500">لا توجد صور</p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {images.map((img) => (
                          <a
                            key={img.id}
                            href={`/api/admin/innovation-conference/media/${img.mediaId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border border-neutral-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/admin/innovation-conference/media/${img.mediaId}`}
                              alt={img.filename || "صورة"}
                              className="h-24 w-24 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold text-neutral-500">PDF المشروع</p>
                    {pdfs.length === 0 ? (
                      <p className="text-sm text-neutral-500">لا يوجد ملف</p>
                    ) : (
                      pdfs.map((f) => (
                        <a
                          key={f.id}
                          href={`/api/admin/innovation-conference/media/${f.mediaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 inline-flex rounded-lg bg-neutral-100 px-3 py-2 text-sm font-bold text-[#163364] hover:bg-neutral-200"
                        >
                          فتح الملف · {f.filename || "PDF"}
                        </a>
                      ))
                    )}
                  </div>
                  {patents.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold text-neutral-500">مستند البراءة</p>
                      {patents.map((f) => (
                        <a
                          key={f.id}
                          href={`/api/admin/innovation-conference/media/${f.mediaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 inline-flex rounded-lg bg-neutral-100 px-3 py-2 text-sm font-bold text-[#163364] hover:bg-neutral-200"
                        >
                          فتح المستند · {f.filename || "PDF"}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Section>

            <Section title="الإقرارات">
              <ul className="space-y-1 text-sm text-neutral-700">
                <li>✓ صحة المعلومات: {detail.consentAccuracy ? "موافق" : "لا"}</li>
                <li>✓ الملكية: {detail.consentOwnership ? "موافق" : "لا"}</li>
                <li>✓ الشروط: {detail.consentTerms ? "موافق" : "لا"}</li>
                <li>✓ الإعلام: {detail.consentMedia ? "موافق" : "لا"}</li>
                <li className="pt-1 text-xs text-neutral-500">
                  وقت الموافقة: {formatArDate(detail.consentedAt)}
                </li>
              </ul>
            </Section>

            <Section title="سجل تغييرات الحالة">
              {detail.statusLogs.length === 0 ? (
                <p className="text-sm text-neutral-500">لا يوجد سجل بعد.</p>
              ) : (
                <ol className="relative space-y-4 border-s border-neutral-200 ps-4">
                  {detail.statusLogs.map((log) => (
                    <li key={log.id} className="relative">
                      <span className="absolute -start-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-[#31BD9C]" />
                      <p className="text-sm font-bold text-neutral-900">
                        {getStatusPublicCopy(log.toStatus).title}
                        {log.fromStatus && (
                          <span className="font-normal text-neutral-500">
                            {" "}
                            ← من {getStatusPublicCopy(log.fromStatus).title}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">{formatArDate(log.createdAt)}</p>
                      {(log.adminName || log.adminEmail) && (
                        <p className="text-xs text-neutral-600">
                          بواسطة: {log.adminName || log.adminEmail}
                        </p>
                      )}
                      {log.note && (
                        <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-950">
                          {log.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Section title="تحديث حالة الطلب">
              {canEdit ? (
                <StatusUpdateForm
                  applicationId={detail.id}
                  currentStatus={st}
                  allowedNext={allowedNext}
                />
              ) : (
                <p className="text-sm text-neutral-500">ليست لديك صلاحية تعديل الحالة.</p>
              )}
            </Section>

            <Section title="ملاحظات الإدارة">
              {canEdit ? (
                <AdminNotesForm
                  applicationId={detail.id}
                  initialNotes={detail.adminNotes || ""}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-neutral-700">
                  {detail.adminNotes || "لا توجد ملاحظات."}
                </p>
              )}
            </Section>
          </aside>
        </div>
      </div>
    </div>
  );
}
