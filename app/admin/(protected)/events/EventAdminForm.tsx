"use client";

import { useMemo, useState } from "react";
import type { AdminEventDetails } from "@/lib/eventsAdminRepo";
import { isYouTubeUrl } from "@/lib/youtubeEmbed";

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function datetimeLocalToIso(v: string): string {
  const d = new Date(v);
  return d.toISOString();
}

type Props = {
  mode: "create" | "edit";
  eventId?: string;
  initial?: AdminEventDetails | null;
};

export default function EventAdminForm({ mode, eventId, initial }: Props) {
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [excerptAr, setExcerptAr] = useState(initial?.excerptAr ?? "");
  const [excerptEn, setExcerptEn] = useState(initial?.excerptEn ?? "");
  const [detailsAr, setDetailsAr] = useState(initial?.detailsAr ?? "");
  const [detailsEn, setDetailsEn] = useState(initial?.detailsEn ?? "");
  const [startsAtLocal, setStartsAtLocal] = useState(
    initial?.startsAt ? isoToDatetimeLocal(initial.startsAt) : ""
  );
  const [endsAtLocal, setEndsAtLocal] = useState(
    initial?.endsAt ? isoToDatetimeLocal(initial.endsAt) : ""
  );
  const [registrationLabelAr, setRegistrationLabelAr] = useState(initial?.registrationLabelAr ?? "");
  const [registrationLabelEn, setRegistrationLabelEn] = useState(initial?.registrationLabelEn ?? "");
  const [registrationUrl, setRegistrationUrl] = useState(initial?.registrationUrl ?? "");
  /** افتراضياً «منشور» للحدث الجديد حتى يظهر على الموقع مباشرة؛ يمكن إلغاء التأشير لمسودة. */
  const [published, setPublished] = useState(initial?.published ?? mode === "create");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [removeBrochure, setRemoveBrochure] = useState(false);

  const [galleryIds, setGalleryIds] = useState<string[]>(initial?.galleryMediaIds ?? []);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return titleAr.trim().length > 0 && startsAtLocal.trim().length > 0 && !isSaving;
  }, [titleAr, startsAtLocal, isSaving]);

  async function uploadMedia(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/media", { method: "POST", body: fd });
    const j = await up.json().catch(() => ({}));
    if (!up.ok) throw new Error(j?.error || "فشل رفع الملف");
    return String(j.id);
  }

  async function onAddGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [...galleryIds];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      const id = await uploadMedia(f);
      next.push(id);
    }
    setGalleryIds(next);
  }

  function removeGalleryAt(index: number) {
    setGalleryIds((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      if (videoUrl.trim() && !isYouTubeUrl(videoUrl.trim())) {
        throw new Error("رابط الفيديو يجب أن يكون من يوتيوب");
      }

      let coverImageId: string | null | undefined = undefined;
      if (coverFile) {
        coverImageId = await uploadMedia(coverFile);
      } else if (mode === "edit" && removeCover) {
        coverImageId = null;
      }

      let brochureMediaId: string | null | undefined = undefined;
      if (brochureFile) {
        brochureMediaId = await uploadMedia(brochureFile);
      } else if (mode === "edit" && removeBrochure) {
        brochureMediaId = null;
      }

      const allGallery = [...galleryIds];

      const startsAt = datetimeLocalToIso(startsAtLocal);
      const endsAt =
        endsAtLocal.trim().length > 0 ? datetimeLocalToIso(endsAtLocal) : null;

      const payload: Record<string, unknown> = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || null,
        excerptAr: excerptAr.trim() || null,
        excerptEn: excerptEn.trim() || null,
        detailsAr: detailsAr.trim() || "",
        detailsEn: detailsEn.trim() || null,
        startsAt,
        endsAt,
        registrationLabelAr: registrationLabelAr.trim() || null,
        registrationLabelEn: registrationLabelEn.trim() || null,
        registrationUrl: registrationUrl.trim() || null,
        published,
        featured,
        videoUrl: videoUrl.trim() || null,
        galleryMediaIds: allGallery,
      };

      if (coverImageId !== undefined) payload.coverImageId = coverImageId;
      if (brochureMediaId !== undefined) payload.brochureMediaId = brochureMediaId;

      if (mode === "create") {
        const res = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "فشل إنشاء الحدث");
        setSuccess("تم إنشاء الحدث بنجاح.");
        window.location.href = `/admin/events/${json.id}/edit`;
        return;
      }

      if (!eventId) throw new Error("معرف الحدث مفقود");
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "فشل حفظ التعديلات");
      setSuccess("تم حفظ التعديلات.");
      setCoverFile(null);
      setBrochureFile(null);
      setRemoveCover(false);
      setRemoveBrochure(false);
      setGalleryIds(allGallery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">العربية</h2>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">اسم الحدث (عربي) *</label>
          <input
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">نبذة (عربي)</label>
          <textarea
            value={excerptAr}
            onChange={(e) => setExcerptAr(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">تفاصيل الحدث (عربي)</label>
          <textarea
            value={detailsAr}
            onChange={(e) => setDetailsAr(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 font-mono text-sm"
            placeholder="يمكنك فصل الفقرات بسطر فارغ"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">نص زر التسجيل (عربي)</label>
          <input
            value={registrationLabelAr}
            onChange={(e) => setRegistrationLabelAr(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
            placeholder="مثال: سجّل الآن"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">English</h2>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Event title (English)</label>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Excerpt (English)</label>
          <textarea
            value={excerptEn}
            onChange={(e) => setExcerptEn(e.target.value)}
            rows={3}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Details (English)</label>
          <textarea
            value={detailsEn}
            onChange={(e) => setDetailsEn(e.target.value)}
            rows={8}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Registration button label (English)</label>
          <input
            value={registrationLabelEn}
            onChange={(e) => setRegistrationLabelEn(e.target.value)}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
            placeholder="e.g. Register now"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">الموعد والنشر</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">موعد بدء الحدث *</label>
            <input
              type="datetime-local"
              value={startsAtLocal}
              onChange={(e) => setStartsAtLocal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">نهاية الحدث (اختياري)</label>
            <input
              type="datetime-local"
              value={endsAtLocal}
              onChange={(e) => setEndsAtLocal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C]"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            منشور على الموقع
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            حدث مميز
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-2">الوسائط والروابط</h2>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">رابط التسجيل الخارجي (اختياري)</label>
          <input
            value={registrationUrl}
            onChange={(e) => setRegistrationUrl(e.target.value)}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] font-mono text-sm"
            placeholder="https://..."
          />
          <p className="text-xs text-neutral-500 mt-1">إن وُجد، يصبح زر التسجيل في الموقع يفتح هذا الرابط.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">فيديو يوتيوب (اختياري)</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            dir="ltr"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-[#31BD9C] font-mono text-sm"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">صورة الغلاف</label>
          {mode === "edit" && initial?.coverImageId && !removeCover && !coverFile && (
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/media/${initial.coverImageId}`}
                alt=""
                className="h-20 w-32 object-cover rounded-lg border"
              />
              <label className="text-sm text-red-600 font-semibold cursor-pointer">
                <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> حذف
                الصورة الحالية
              </label>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">بروشور أو ملف للتحميل (PDF / ZIP)</label>
          {mode === "edit" && initial?.brochureMediaId && !removeBrochure && !brochureFile && (
            <label className="mb-2 block text-sm text-red-600 font-semibold cursor-pointer">
              <input type="checkbox" checked={removeBrochure} onChange={(e) => setRemoveBrochure(e.target.checked)} /> حذف
              الملف الحالي
            </label>
          )}
          <input
            type="file"
            accept=".pdf,.zip,application/pdf,application/zip"
            onChange={(e) => setBrochureFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">معرض صور (عدة صور)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => void onAddGalleryFiles(e.target.files)}
            className="block w-full text-sm"
          />
          {galleryIds.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {galleryIds.map((gid, i) => (
                <li key={`${gid}-${i}`} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${gid}`} alt="" className="h-16 w-24 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => removeGalleryAt(i)}
                    className="absolute -top-1 -end-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 leading-5"
                    aria-label="حذف"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] disabled:opacity-50"
        >
          {isSaving ? "جاري الحفظ…" : mode === "create" ? "إنشاء الحدث" : "حفظ التعديلات"}
        </button>
        <a
          href="/admin/events"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-neutral-100 text-neutral-800 font-bold hover:bg-neutral-200"
        >
          إلغاء والعودة للقائمة
        </a>
      </div>
    </form>
  );
}
