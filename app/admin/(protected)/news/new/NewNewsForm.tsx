"use client";

import { useMemo, useState } from "react";

type CategoryCode =
  | "ADMINISTRATIVE"
  | "SCIENTIFIC"
  | "ACTIVITIES"
  | "ANNOUNCEMENTS";

const categories: Array<{ label: string; value: CategoryCode }> = [
  { label: "أخبار إدارية", value: "ADMINISTRATIVE" },
  { label: "أخبار علمية", value: "SCIENTIFIC" },
  { label: "نشاطات وفعاليات", value: "ACTIVITIES" },
  { label: "إعلانات", value: "ANNOUNCEMENTS" },
];

export default function NewNewsForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryCode>("SCIENTIFIC");
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [secondaryFile1, setSecondaryFile1] = useState<File | null>(null);
  const [secondaryFile2, setSecondaryFile2] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && content.trim().length > 0 && !isSaving;
  }, [content, isSaving, title]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      let coverImageId: string | null = null;
      let secondaryImageId: string | null = null;
      let secondaryImage2Id: string | null = null;

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const up = await fetch("/api/media", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(upJson?.error || "فشل رفع الصورة");
        }
        coverImageId = String(upJson.id);
      }

      if (secondaryFile1) {
        const fd = new FormData();
        fd.append("file", secondaryFile1);
        const up = await fetch("/api/media", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(upJson?.error || "فشل رفع الصورة الإضافية");
        }
        secondaryImageId = String(upJson.id);
      }

      if (secondaryFile2) {
        const fd = new FormData();
        fd.append("file", secondaryFile2);
        const up = await fetch("/api/media", {
          method: "POST",
          body: fd,
        });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(upJson?.error || "فشل رفع الصورة الإضافية الثانية");
        }
        secondaryImage2Id = String(upJson.id);
      }

      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt: excerpt.trim() || null,
          content,
          category,
          published,
          featured,
          coverImageId,
          secondaryImageId,
          secondaryImage2Id,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "فشل إنشاء الخبر");
      }

      setSuccess("تم إنشاء الخبر بنجاح.");
      const id = String(json.id);
      // فتح صفحة الخبر العامة
      window.location.href = `/news/${id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          عنوان الخبر
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
          placeholder="اكتب عنوان الخبر..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          ملخص قصير
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all min-h-[90px]"
          placeholder="ملخص يظهر في بطاقات الأخبار..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          محتوى الخبر
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all min-h-[180px]"
          placeholder={"اكتب المحتوى...\nيمكنك استخدام:\n## عنوان فرعي\n### عنوان فرعي أصغر\nوفصل الفقرات بسطر فارغ."}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            التصنيف
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryCode)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            صورة الغلاف
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <p className="mt-2 text-xs text-neutral-500">
            سيتم حفظ الصورة داخل قاعدة البيانات (Postgres) وعرضها عبر{" "}
            <code>/api/media/&lt;id&gt;</code>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            صورة إضافية (اختياري)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSecondaryFile1(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <p className="mt-2 text-xs text-neutral-500">
            سيتم حفظها أيضاً داخل قاعدة البيانات، ويمكن عرضها داخل صفحة الخبر.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            صورة إضافية ثانية (اختياري)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSecondaryFile2(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <p className="mt-2 text-xs text-neutral-500">
            سيتم حفظها أيضاً داخل قاعدة البيانات، ويمكن عرضها داخل صفحة الخبر.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4"
          />
          نشر الخبر
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          مميز (Featured)
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={[
          "w-full px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-md",
          canSubmit
            ? "bg-[#31BD9C] hover:bg-[#2aa88a] text-white hover:shadow-lg"
            : "bg-neutral-200 text-neutral-500 cursor-not-allowed",
        ].join(" ")}
      >
        {isSaving ? "جارٍ الحفظ..." : "إنشاء الخبر"}
      </button>
    </form>
  );
}

