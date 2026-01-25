"use client";

import { useState } from "react";
import {
  createDepartmentFee,
  updateDepartmentFee,
} from "./actions";
import { DEPARTMENT_SLUGS } from "@/lib/tuitionData";
import { DEPT_FEE_CATEGORY_OPTIONS } from "@/lib/deptFeeCategories";
import type { DepartmentFeeRow } from "@/lib/departmentFeeRepo";

const APPLY_TYPES: { value: string; labelAr: string }[] = [
  { value: "external_link", labelAr: "رابط خارجي" },
  { value: "internal_page", labelAr: "صفحة داخلية" },
  { value: "whatsapp", labelAr: "رقم واتساب" },
];

type Props = {
  initial?: DepartmentFeeRow | null;
  existingSlugs?: string[];
};

export default function DeptFeeForm({ initial, existingSlugs = [] }: Props) {
  const isEdit = !!initial?.id;

  const [departmentSlug, setDepartmentSlug] = useState(initial?.departmentSlug || "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [displayNameEn, setDisplayNameEn] = useState(initial?.displayNameEn ?? "");
  const [categories, setCategories] = useState<string[]>(initial?.categories ?? []);
  const toggleCategory = (value: string) =>
    setCategories((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  const [cardImageId, setCardImageId] = useState<string | null>(initial?.cardImageId ?? null);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [brief, setBrief] = useState(initial?.brief ?? "");
  const [briefEn, setBriefEn] = useState(initial?.briefEn ?? "");
  const [morningPrice, setMorningPrice] = useState(initial?.morningPrice || "0");
  const [eveningPrice, setEveningPrice] = useState(initial?.eveningPrice || "0");
  const [currency, setCurrency] = useState(initial?.currency || "د.ع");
  const [registrationFee, setRegistrationFee] = useState(initial?.registrationFee ?? "");
  const [extraFees, setExtraFees] = useState(initial?.extraFees ?? "");
  const [extraFeesEn, setExtraFeesEn] = useState(initial?.extraFeesEn ?? "");
  const [feesNotes, setFeesNotes] = useState(initial?.feesNotes ?? "");
  const [feesNotesEn, setFeesNotesEn] = useState(initial?.feesNotesEn ?? "");
  const [morningMinGpa, setMorningMinGpa] = useState(initial?.morningMinGpa || "0");
  const [eveningMinGpa, setEveningMinGpa] = useState(initial?.eveningMinGpa || "0");
  const [admissionNotes, setAdmissionNotes] = useState(initial?.admissionNotes ?? "");
  const [admissionNotesEn, setAdmissionNotesEn] = useState(initial?.admissionNotesEn ?? "");
  const [showApplyButton, setShowApplyButton] = useState(initial?.showApplyButton !== false);
  const [applyTypes, setApplyTypes] = useState<string[]>(initial?.applyTypes ?? []);
  const toggleApplyType = (v: string) =>
    setApplyTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const [applyUrl, setApplyUrl] = useState(initial?.applyUrl ?? "");
  const [applyUrlExternal, setApplyUrlExternal] = useState(initial?.applyUrlExternal ?? "");
  const [applyUrlWhatsapp, setApplyUrlWhatsapp] = useState(initial?.applyUrlWhatsapp ?? "");
  const [applyButtonText, setApplyButtonText] = useState(initial?.applyButtonText ?? "");
  const [applyButtonTextEn, setApplyButtonTextEn] = useState(initial?.applyButtonTextEn ?? "");
  const [requiredDocs, setRequiredDocs] = useState<Array<{ ar: string; en: string }>>(
    initial?.requiredDocs?.length ? initial.requiredDocs : [{ ar: "", en: "" }]
  );
  const [applicationStart, setApplicationStart] = useState(initial?.applicationStart ?? "");
  const [applicationEnd, setApplicationEnd] = useState(initial?.applicationEnd ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive !== false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addDoc = () => setRequiredDocs((d) => [...d, { ar: "", en: "" }]);
  const removeDoc = (i: number) => setRequiredDocs((d) => d.filter((_, j) => j !== i));
  const setDoc = (i: number, f: "ar" | "en", v: string) =>
    setRequiredDocs((d) => d.map((x, j) => (j === i ? { ...x, [f]: v } : x)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      let finalCardImageId: string | null = cardImageId;
      if (cardFile) {
        const fd = new FormData();
        fd.append("file", cardFile);
        const up = await fetch("/api/media", { method: "POST", body: fd });
        const j = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(j?.error || "فشل رفع الصورة");
        finalCardImageId = String(j.id);
      } else if (cardImageId === null && initial?.cardImageId) {
        finalCardImageId = null;
      }

      const docs = requiredDocs.filter((d) => d.ar.trim() || d.en.trim()).map((d) => ({ ar: d.ar.trim() || "", en: d.en.trim() || "" }));

      const data = {
        department_slug: departmentSlug || undefined,
        display_name: displayName.trim() || null,
        display_name_en: displayNameEn.trim() || null,
        categories: categories,
        card_image_id: finalCardImageId,
        brief: brief.trim() || null,
        brief_en: briefEn.trim() || null,
        morning_price: Number(morningPrice) || 0,
        evening_price: Number(eveningPrice) || 0,
        currency: currency.trim() || "د.ع",
        registration_fee: registrationFee.trim() ? Number(registrationFee) : null,
        extra_fees: extraFees.trim() || null,
        extra_fees_en: extraFeesEn.trim() || null,
        fees_notes: feesNotes.trim() || null,
        fees_notes_en: feesNotesEn.trim() || null,
        morning_min_gpa: Number(morningMinGpa) || 0,
        evening_min_gpa: Number(eveningMinGpa) || 0,
        admission_notes: admissionNotes.trim() || null,
        admission_notes_en: admissionNotesEn.trim() || null,
        show_apply_button: showApplyButton,
        apply_types: applyTypes,
        apply_url: applyUrl.trim() || null,
        apply_url_external: applyUrlExternal.trim() || null,
        apply_url_whatsapp: applyUrlWhatsapp.trim() || null,
        apply_button_text: applyButtonText.trim() || null,
        apply_button_text_en: applyButtonTextEn.trim() || null,
        required_docs: docs.length ? docs : null,
        application_start: applicationStart.trim() || null,
        application_end: applicationEnd.trim() || null,
        featured,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      if (isEdit && initial?.id) {
        const res = await updateDepartmentFee(initial.id, data);
        if (!res.ok) throw new Error(res.error);
        setSuccess("تم حفظ التعديلات.");
      } else {
        const res = await createDepartmentFee(data as any);
        if (!res.ok) throw new Error(res.error);
        setSuccess("تم إضافة السجل.");
        if (res.id) window.location.href = "/admin/tuition-fees";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none";
  const labelCls = "block text-sm font-semibold text-neutral-700 mb-1";
  const secCls = "space-y-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      {/* A) بيانات القسم */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">أ) بيانات القسم</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>القسم</label>
            <select value={departmentSlug} onChange={(e) => setDepartmentSlug(e.target.value)} className={inputCls} required disabled={isEdit}>
              <option value="">— اختر —</option>
              {DEPARTMENT_SLUGS.filter((s) => isEdit || !existingSlugs.includes(s)).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div><label className={labelCls}>اسم العرض (عربي، اختياري)</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} placeholder="إن فارغ يُستخدم الاسم الافتراضي" /></div>
          <div><label className={labelCls}>اسم العرض (إنجليزي، اختياري)</label><input type="text" value={displayNameEn} onChange={(e) => setDisplayNameEn(e.target.value)} className={inputCls} /></div>
          <div className="md:col-span-2">
            <label className={labelCls}>التصنيف / Badge (يمكن اختيار أكثر من واحد)</label>
            <div className="flex flex-wrap gap-x-6 gap-y-2 p-3 rounded-lg border border-neutral-200 bg-white">
              {DEPT_FEE_CATEGORY_OPTIONS.map((c) => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(c.value)}
                    onChange={() => toggleCategory(c.value)}
                    className="rounded border-neutral-300 text-[#31BD9C] focus:ring-[#31BD9C]"
                  />
                  <span className="text-sm">{c.labelAr}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>صورة البطاقة</label>
          {cardImageId && !cardFile && <div className="mb-2 flex items-center gap-2"><img src={`/api/media/${cardImageId}`} alt="" className="h-16 w-24 object-cover rounded" /><button type="button" onClick={() => setCardImageId(null)} className="text-red-600 text-sm">إزالة</button></div>}
          <input type="file" accept="image/*" onChange={(e) => { setCardFile(e.target.files?.[0] ?? null); }} className={inputCls} />
        </div>
        <div><label className={labelCls}>وصف مختصر (عربي، اختياري)</label><textarea value={brief} onChange={(e) => setBrief(e.target.value)} className={inputCls} rows={2} /></div>
        <div><label className={labelCls}>وصف مختصر (إنجليزي، اختياري)</label><textarea value={briefEn} onChange={(e) => setBriefEn(e.target.value)} className={inputCls} rows={2} /></div>
      </section>

      {/* B) الرسوم */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">ب) الرسوم الدراسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={labelCls}>رسوم صباحي</label><input type="number" min={0} value={morningPrice} onChange={(e) => setMorningPrice(e.target.value)} className={inputCls} required /></div>
          <div><label className={labelCls}>رسوم مسائي</label><input type="number" min={0} value={eveningPrice} onChange={(e) => setEveningPrice(e.target.value)} className={inputCls} required /></div>
          <div><label className={labelCls}>العملة</label><input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>رسوم تسجيل (اختياري)</label><input type="number" min={0} value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>رسوم إضافية/مختبرات (عربي، اختياري)</label><input type="text" value={extraFees} onChange={(e) => setExtraFees(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>رسوم إضافية (إنجليزي، اختياري)</label><input type="text" value={extraFeesEn} onChange={(e) => setExtraFeesEn(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>ملاحظات على الرسوم (عربي)</label><input type="text" value={feesNotes} onChange={(e) => setFeesNotes(e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>ملاحظات على الرسوم (إنجليزي)</label><input type="text" value={feesNotesEn} onChange={(e) => setFeesNotesEn(e.target.value)} className={inputCls} /></div>
      </section>

      {/* C) شروط القبول */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">ج) شروط القبول</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>الحد الأدنى للمعدل صباحي (%)</label><input type="number" min={0} max={100} step={0.01} value={morningMinGpa} onChange={(e) => setMorningMinGpa(e.target.value)} className={inputCls} required /></div>
          <div><label className={labelCls}>الحد الأدنى للمعدل مسائي (%)</label><input type="number" min={0} max={100} step={0.01} value={eveningMinGpa} onChange={(e) => setEveningMinGpa(e.target.value)} className={inputCls} required /></div>
        </div>
        <div><label className={labelCls}>ملاحظات القبول (عربي)</label><input type="text" value={admissionNotes} onChange={(e) => setAdmissionNotes(e.target.value)} className={inputCls} placeholder="مثال: حسب الطاقة الاستيعابية" /></div>
        <div><label className={labelCls}>ملاحظات القبول (إنجليزي)</label><input type="text" value={admissionNotesEn} onChange={(e) => setAdmissionNotesEn(e.target.value)} className={inputCls} /></div>
      </section>

      {/* D) التقديم */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">د) التقديم</h3>
        <label className="flex items-center gap-2 mb-4"><input type="checkbox" checked={showApplyButton} onChange={(e) => setShowApplyButton(e.target.checked)} /> إظهار زر التقديم؟</label>
        <div className="mb-4">
          <label className={labelCls}>نوع التقديم (يمكن اختيار أكثر من واحد)</label>
          <div className="flex flex-wrap gap-x-6 gap-y-2 p-3 rounded-lg border border-neutral-200 bg-white">
            {APPLY_TYPES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={applyTypes.includes(c.value)} onChange={() => toggleApplyType(c.value)} className="rounded border-neutral-300 text-[#31BD9C] focus:ring-[#31BD9C]" />
                <span className="text-sm">{c.labelAr}</span>
              </label>
            ))}
          </div>
        </div>
        {applyTypes.includes("internal_page") && (
          <div><label className={labelCls}>المسار الداخلي (صفحة داخلية)</label><input type="text" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} className={inputCls} placeholder="apply" /></div>
        )}
        {applyTypes.includes("external_link") && (
          <div><label className={labelCls}>الرابط الخارجي</label><input type="text" value={applyUrlExternal} onChange={(e) => setApplyUrlExternal(e.target.value)} className={inputCls} placeholder="https://..." /></div>
        )}
        {applyTypes.includes("whatsapp") && (
          <div><label className={labelCls}>رقم واتساب</label><input type="text" value={applyUrlWhatsapp} onChange={(e) => setApplyUrlWhatsapp(e.target.value)} className={inputCls} placeholder="9647XXXXXXXX" /></div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div><label className={labelCls}>نص زر التقديم (عربي)</label><input type="text" value={applyButtonText} onChange={(e) => setApplyButtonText(e.target.value)} className={inputCls} placeholder="تقديم الآن" /></div>
          <div><label className={labelCls}>نص زر التقديم (إنجليزي)</label><input type="text" value={applyButtonTextEn} onChange={(e) => setApplyButtonTextEn(e.target.value)} className={inputCls} placeholder="Apply now" /></div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>مستندات مطلوبة (كل عنصر: عربي + إنجليزي)</label>
          {requiredDocs.map((d, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={d.ar} onChange={(e) => setDoc(i, "ar", e.target.value)} className={inputCls} placeholder="اسم المستند (عربي)" />
              <input type="text" value={d.en} onChange={(e) => setDoc(i, "en", e.target.value)} className={inputCls} placeholder="(إنجليزي)" />
              <button type="button" onClick={() => removeDoc(i)} className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm">حذف</button>
            </div>
          ))}
          <button type="button" onClick={addDoc} className="mt-2 px-3 py-2 rounded-lg border border-neutral-200 text-sm">+ إضافة مستند</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div><label className={labelCls}>تاريخ بدء التقديم</label><input type="date" value={applicationStart} onChange={(e) => setApplicationStart(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>تاريخ انتهاء التقديم</label><input type="date" value={applicationEnd} onChange={(e) => setApplicationEnd(e.target.value)} className={inputCls} /></div>
        </div>
      </section>

      {/* E) التحكم بالعرض */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-3">هـ) التحكم بالعرض</h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> مميز (Featured) في الهوم</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> الحالة: ظاهر</label>
          <div><label className={labelCls}>الترتيب (Sort Order)</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`w-24 ${inputCls}`} /></div>
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={isSaving} className="px-6 py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold disabled:opacity-70">{isSaving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة السجل"}</button>
        <a href="/admin/tuition-fees" className="px-6 py-3 rounded-xl border border-neutral-200 font-semibold">إلغاء</a>
      </div>
    </form>
  );
}
