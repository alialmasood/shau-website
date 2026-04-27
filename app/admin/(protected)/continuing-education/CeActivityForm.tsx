"use client";

import { useMemo, useState } from "react";
import type { AdminCeDetails, CeCertificateRow } from "@/lib/ceAdminRepo";

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function datetimeLocalToIso(v: string): string {
  return new Date(v).toISOString();
}

type Props = { mode: "create" | "edit"; activityId?: string; initial?: AdminCeDetails | null };

export default function CeActivityForm({ mode, activityId, initial }: Props) {
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [excerptAr, setExcerptAr] = useState(initial?.excerptAr ?? "");
  const [excerptEn, setExcerptEn] = useState(initial?.excerptEn ?? "");
  const [annAr, setAnnAr] = useState(initial?.announcementDetailsAr ?? "");
  const [annEn, setAnnEn] = useState(initial?.announcementDetailsEn ?? "");
  const [recAr, setRecAr] = useState(initial?.recapDetailsAr ?? "");
  const [recEn, setRecEn] = useState(initial?.recapDetailsEn ?? "");
  const [startsLocal, setStartsLocal] = useState(
    initial?.eventStartsAt ? isoToDatetimeLocal(initial.eventStartsAt) : ""
  );
  const [endsLocal, setEndsLocal] = useState(
    initial?.eventEndsAt ? isoToDatetimeLocal(initial.eventEndsAt) : ""
  );
  const [showAnnouncement, setShowAnnouncement] = useState(initial?.showAnnouncement ?? true);
  const [showRecap, setShowRecap] = useState(initial?.showRecap ?? false);
  const [published, setPublished] = useState(initial?.published ?? mode === "create");
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [removeZip, setRemoveZip] = useState(false);

  const [galleryAnn, setGalleryAnn] = useState<string[]>(() =>
    (initial?.gallery ?? []).filter((g) => g.kind === "announcement").map((g) => g.mediaId)
  );
  const [galleryRec, setGalleryRec] = useState<string[]>(() =>
    (initial?.gallery ?? []).filter((g) => g.kind === "recap").map((g) => g.mediaId)
  );

  const [certs, setCerts] = useState<CeCertificateRow[]>(initial?.certificates ?? []);
  const [certNameAr, setCertNameAr] = useState("");
  const [certNameEn, setCertNameEn] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certCode, setCertCode] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => titleAr.trim() && startsLocal.trim() && !isSaving, [titleAr, startsLocal, isSaving]);

  async function uploadMedia(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/media", { method: "POST", body: fd });
    const j = await up.json().catch(() => ({}));
    if (!up.ok) throw new Error(j?.error || "فشل رفع الملف");
    return String(j.id);
  }

  async function onAddAnn(files: FileList | null) {
    if (!files?.length) return;
    const next = [...galleryAnn];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      next.push(await uploadMedia(f));
    }
    setGalleryAnn(next);
  }

  async function onAddRec(files: FileList | null) {
    if (!files?.length) return;
    const next = [...galleryRec];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      next.push(await uploadMedia(f));
    }
    setGalleryRec(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      let coverImageId: string | null | undefined = undefined;
      if (coverFile) coverImageId = await uploadMedia(coverFile);
      else if (mode === "edit" && removeCover) coverImageId = null;

      let zipId: string | null | undefined = undefined;
      if (zipFile) zipId = await uploadMedia(zipFile);
      else if (mode === "edit" && removeZip) zipId = null;

      const gallery = [
        ...galleryAnn.map((id) => ({ mediaId: id, kind: "announcement" as const })),
        ...galleryRec.map((id) => ({ mediaId: id, kind: "recap" as const })),
      ];

      const payload: Record<string, unknown> = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || null,
        excerptAr: excerptAr.trim() || null,
        excerptEn: excerptEn.trim() || null,
        announcementDetailsAr: annAr.trim() || "",
        announcementDetailsEn: annEn.trim() || null,
        recapDetailsAr: recAr.trim() || null,
        recapDetailsEn: recEn.trim() || null,
        eventStartsAt: datetimeLocalToIso(startsLocal),
        eventEndsAt: endsLocal.trim() ? datetimeLocalToIso(endsLocal) : null,
        showAnnouncement,
        showRecap,
        published,
        featured,
        gallery,
      };
      if (coverImageId !== undefined) payload.coverImageId = coverImageId;
      if (zipId !== undefined) payload.certificatesZipMediaId = zipId;

      if (mode === "create") {
        const res = await fetch("/api/admin/ce-activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || "فشل الإنشاء");
        window.location.href = `/admin/continuing-education/${j.id}/edit`;
        return;
      }
      if (!activityId) throw new Error("معرف مفقود");
      const res = await fetch(`/api/admin/ce-activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "فشل الحفظ");
      setSuccess("تم الحفظ.");
      setCoverFile(null);
      setZipFile(null);
      setRemoveCover(false);
      setRemoveZip(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ");
    } finally {
      setIsSaving(false);
    }
  }

  async function addCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!activityId || !certFile || !certNameAr.trim()) {
      setError("أدخل اسم المشارك واختر ملف PDF للشهادة");
      return;
    }
    setError(null);
    try {
      const pdfId = await uploadMedia(certFile);
      const res = await fetch("/api/admin/ce-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          pdfMediaId: pdfId,
          participantNameAr: certNameAr.trim(),
          participantNameEn: certNameEn.trim() || null,
          code: certCode.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "فشل إضافة الشهادة");
      setCerts((c) => [{ id: j.id, code: j.code, participantNameAr: certNameAr.trim(), participantNameEn: certNameEn.trim() || null, pdfMediaId: pdfId }, ...c]);
      setCertNameAr("");
      setCertNameEn("");
      setCertCode("");
      setCertFile(null);
      setSuccess(`تمت إضافة الشهادة. الكود: ${j.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ");
    }
  }

  async function removeCertificate(id: string) {
    if (!confirm("حذف هذه الشهادة؟")) return;
    const res = await fetch(`/api/admin/ce-certificates/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setCerts((c) => c.filter((x) => x.id !== id));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">عناوين ووصف</h2>
        <input
          className="w-full px-4 py-3 rounded-xl border"
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
          placeholder="عنوان النشاط (عربي) *"
          required
        />
        <input
          className="w-full px-4 py-3 rounded-xl border"
          dir="ltr"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          placeholder="Title (English)"
        />
        <textarea className="w-full px-4 py-3 rounded-xl border" rows={2} value={excerptAr} onChange={(e) => setExcerptAr(e.target.value)} placeholder="نبذة عربي" />
        <textarea className="w-full px-4 py-3 rounded-xl border" dir="ltr" rows={2} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} placeholder="Excerpt English" />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">الموعد</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">تاريخ ووقت الفعالية *</label>
            <input type="datetime-local" className="w-full mt-1 px-3 py-2 border rounded-xl" value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">النهاية (اختياري)</label>
            <input type="datetime-local" className="w-full mt-1 px-3 py-2 border rounded-xl" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <label className="inline-flex gap-2 items-center">
            <input type="checkbox" checked={showAnnouncement} onChange={(e) => setShowAnnouncement(e.target.checked)} />
            عرض الإعلان (قبل التنفيذ)
          </label>
          <label className="inline-flex gap-2 items-center">
            <input type="checkbox" checked={showRecap} onChange={(e) => setShowRecap(e.target.checked)} />
            عرض التقرير بعد التنفيذ
          </label>
          <label className="inline-flex gap-2 items-center">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            منشور
          </label>
          <label className="inline-flex gap-2 items-center">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            مميز
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">نص الإعلان (قبل الفعالية)</h2>
        <textarea className="w-full px-4 py-3 rounded-xl border font-mono text-sm" rows={6} value={annAr} onChange={(e) => setAnnAr(e.target.value)} />
        <textarea className="w-full px-4 py-3 rounded-xl border font-mono text-sm" dir="ltr" rows={4} value={annEn} onChange={(e) => setAnnEn(e.target.value)} />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">تقرير بعد التنفيذ (اختياري)</h2>
        <textarea className="w-full px-4 py-3 rounded-xl border font-mono text-sm" rows={6} value={recAr} onChange={(e) => setRecAr(e.target.value)} />
        <textarea className="w-full px-4 py-3 rounded-xl border font-mono text-sm" dir="ltr" rows={4} value={recEn} onChange={(e) => setRecEn(e.target.value)} />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">صور الإعلان</h2>
        <input type="file" accept="image/*" multiple onChange={(e) => void onAddAnn(e.target.files)} />
        <ul className="flex flex-wrap gap-2">
          {galleryAnn.map((gid, i) => (
            <li key={gid} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${gid}`} alt="" className="h-16 w-24 object-cover rounded border" />
              <button type="button" className="absolute -top-1 -end-1 bg-red-600 text-white text-xs rounded-full w-5 h-5" onClick={() => setGalleryAnn((a) => a.filter((_, j) => j !== i))}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <h2 className="font-extrabold text-neutral-900 border-b pb-2">صور بعد التنفيذ</h2>
        <input type="file" accept="image/*" multiple onChange={(e) => void onAddRec(e.target.files)} />
        <ul className="flex flex-wrap gap-2">
          {galleryRec.map((gid, i) => (
            <li key={gid} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${gid}`} alt="" className="h-16 w-24 object-cover rounded border" />
              <button type="button" className="absolute -top-1 -end-1 bg-red-600 text-white text-xs rounded-full w-5 h-5" onClick={() => setGalleryRec((a) => a.filter((_, j) => j !== i))}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div>
          <label className="text-sm font-semibold">صورة غلاف البطاقة</label>
          <p className="text-xs text-neutral-500 mt-0.5 mb-1">
            اختياري. إن لم ترفع غلافاً، تُعرض على الصفحة العامة أول صورة من «صور الإعلان»، ثم أول صورة من «صور التقرير» إن وُجدت.
          </p>
          {mode === "edit" && initial?.coverImageId && !removeCover && !coverFile && (
            <label className="block text-sm text-red-600 mb-1">
              <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> حذف الغلاف الحالي
            </label>
          )}
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="text-sm font-semibold">ملف ZIP لجميع الشهادات (تحميل جماعي)</label>
          {mode === "edit" && initial?.certificatesZipMediaId && !removeZip && !zipFile && (
            <label className="block text-sm text-red-600 mb-1">
              <input type="checkbox" checked={removeZip} onChange={(e) => setRemoveZip(e.target.checked)} /> حذف الملف الحالي
            </label>
          )}
          <input type="file" accept=".zip,application/zip" onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} />
        </div>
      </section>

      {mode === "edit" && activityId && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-3">
          <h2 className="font-extrabold text-neutral-900">شهادات المشاركة</h2>
          <p className="text-xs text-neutral-600">ارفع PDF لكل مشارك. يُولَّد كود تلقائياً أو أدخل كوداً مخصصاً.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input className="px-3 py-2 border rounded-xl" value={certNameAr} onChange={(e) => setCertNameAr(e.target.value)} placeholder="اسم المشارك (عربي) *" />
            <input className="px-3 py-2 border rounded-xl" dir="ltr" value={certNameEn} onChange={(e) => setCertNameEn(e.target.value)} placeholder="Name (English)" />
            <input className="px-3 py-2 border rounded-xl font-mono" dir="ltr" value={certCode} onChange={(e) => setCertCode(e.target.value)} placeholder="كود اختياري (فارغ = تلقائي)" />
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setCertFile(e.target.files?.[0] ?? null)} />
          </div>
          <button type="button" onClick={addCertificate} className="px-4 py-2 rounded-xl bg-[#31BD9C] text-white font-bold text-sm">
            إضافة شهادة
          </button>
          {certs.length > 0 && (
            <table className="w-full text-sm mt-3 border bg-white rounded-xl overflow-hidden">
              <thead className="bg-neutral-100 font-bold">
                <tr>
                  <td className="p-2">الكود</td>
                  <td className="p-2">الاسم</td>
                  <td className="p-2 w-20">حذف</td>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{c.code}</td>
                    <td className="p-2">{c.participantNameAr}</td>
                    <td className="p-2">
                      <button type="button" className="text-red-600 font-bold text-xs" onClick={() => void removeCertificate(c.id)}>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={!canSubmit} className="px-6 py-3 rounded-xl bg-[#31BD9C] text-white font-bold disabled:opacity-50">
          {isSaving ? "…" : mode === "create" ? "إنشاء" : "حفظ"}
        </button>
        <a href="/admin/continuing-education" className="px-6 py-3 rounded-xl bg-neutral-100 font-bold">
          رجوع
        </a>
      </div>
    </form>
  );
}
