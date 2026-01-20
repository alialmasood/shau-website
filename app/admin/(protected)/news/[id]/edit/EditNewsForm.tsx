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

type Props = {
  id: string;
  initial: {
    title: string;
    slug: string | null;
    excerpt: string | null;
    content: string;
    categoryCode: CategoryCode | null;
    published: boolean;
    featured: boolean;
    coverImageId: string | null;
  };
};

export default function EditNewsForm({ id, initial }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? "");
  const [content, setContent] = useState(initial.content);
  const [category, setCategory] = useState<CategoryCode>(
    initial.categoryCode ?? "SCIENTIFIC"
  );
  const [published, setPublished] = useState(initial.published);
  const [featured, setFeatured] = useState(initial.featured);
  const [file, setFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
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
      let coverImageId: string | null | undefined = undefined;

      if (removeCover) {
        coverImageId = null;
      }

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
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

      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug.trim() || null,
          excerpt: excerpt.trim() || null,
          content,
          category,
          published,
          featured,
          ...(coverImageId !== undefined ? { coverImageId } : {}),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "فشل حفظ التغييرات");
      }

      setSuccess("تم حفظ التغييرات بنجاح.");
      setRemoveCover(false);
      setFile(null);
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
          Slug (يُولّد تلقائياً إذا تركته فارغاً)
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all font-mono"
          placeholder="مثال: اعلان-بدء-التسجيل"
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
          className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all min-h-[200px]"
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
            صورة الغلاف (اختياري)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={removeCover}
              onChange={(e) => setRemoveCover(e.target.checked)}
              className="w-4 h-4"
            />
            إزالة صورة الغلاف الحالية
          </label>
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className={[
            "px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-md",
            canSubmit
              ? "bg-[#31BD9C] hover:bg-[#2aa88a] text-white hover:shadow-lg"
              : "bg-neutral-200 text-neutral-500 cursor-not-allowed",
          ].join(" ")}
        >
          {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>

        <a
          href={`/news/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl font-bold border border-neutral-200 text-neutral-800 hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
        >
          عرض الخبر
        </a>
      </div>
    </form>
  );
}

