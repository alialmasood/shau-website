"use client";

import { useState } from "react";
import { SOCIAL_PLATFORMS } from "@/lib/socialMediaPlatforms";
import { saveSocialLinks } from "./actions";

const PLACEHOLDERS: Record<string, string> = {
  whatsapp: "مثال: https://wa.me/9647701234567 أو رقم مثل 07701234567",
  telegram: "مثال: https://t.me/username أو @username",
  facebook: "مثال: https://facebook.com/PageName",
  instagram: "مثال: https://instagram.com/username",
  linkedin: "مثال: https://linkedin.com/company/name",
  tiktok: "مثال: https://tiktok.com/@username",
  youtube: "مثال: https://youtube.com/@channel",
  x: "مثال: https://x.com/username",
};

export default function SocialMediaForm({ initial }: { initial: Record<string, string> }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string>>(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await saveSocialLinks(vals);
      setSuccess("تم حفظ روابط السوشيال ميديا.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-green-700 text-sm bg-green-50 px-4 py-2 rounded-lg">{success}</p>}
      {SOCIAL_PLATFORMS.map((p) => (
        <div key={p.key}>
          <label htmlFor={`sm-${p.key}`} className="block text-sm font-semibold text-neutral-700 mb-1.5">
            {p.labelAr}
          </label>
          <input
            id={`sm-${p.key}`}
            type="url"
            placeholder={PLACEHOLDERS[p.key] || "أدخل الرابط"}
            value={vals[p.key] ?? ""}
            onChange={(e) => setVals((v) => ({ ...v, [p.key]: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none text-sm"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] disabled:opacity-50 transition-colors"
      >
        {saving ? "جاري الحفظ…" : "حفظ الروابط"}
      </button>
    </form>
  );
}
