"use client";

import { useState, useEffect } from "react";
import { getTranslations, type Locale } from "@/lib/i18n";
import { DEPT_FEE_CATEGORY_OPTIONS } from "@/lib/deptFeeCategories";

type DeptOption = { id: string; displayName: string | null; displayNameEn: string | null };

type Props = {
  locale: Locale;
  departments: DeptOption[];
  initialDepartmentId?: string | null;
  initialStudyType?: "morning" | "evening" | null;
};

export default function ApplyForm({ locale, departments, initialDepartmentId, initialStudyType }: Props) {
  const t = getTranslations(locale);
  const a = (t as { apply?: Record<string, string> }).apply ?? {};

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [category, setCategory] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [studyType, setStudyType] = useState<"morning" | "evening">("morning");
  const [average, setAverage] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // تعبئة من query params
  useEffect(() => {
    if (initialDepartmentId && departments.some((d) => d.id === initialDepartmentId)) {
      setDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId, departments]);

  useEffect(() => {
    if (initialStudyType === "morning" || initialStudyType === "evening") {
      setStudyType(initialStudyType);
    }
  }, [initialStudyType]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 3 && fullName.trim().length < 6) e.fullName = a.errName || "الاسم 6 أحرف على الأقل";
    const ph = phone.replace(/\D/g, "");
    if (ph.length < 10 || ph.length > 15) e.phone = a.errPhone || "رقم هاتف صحيح";
    if (!schoolName.trim()) e.schoolName = a.errSchool || "اسم المدرسة مطلوب";
    const gy = parseInt(graduationYear.trim(), 10);
    if (!Number.isFinite(gy) || gy < 1900 || gy > 2100 || String(gy).length !== 4) e.graduationYear = a.errYear || "سنة التخرج 4 أرقام";
    if (!address.trim()) e.address = a.errAddress || "عنوان السكن مطلوب";
    if (!category || !DEPT_FEE_CATEGORY_OPTIONS.some((c) => c.value === category)) e.category = a.errCategory || "اختر التصنيف";
    if (!departmentId || !departments.some((d) => d.id === departmentId)) e.department = a.errDepartment || "اختر القسم";
    if (studyType !== "morning" && studyType !== "evening") e.studyType = a.errStudyType || "اختر نوع الدراسة";
    const av = parseFloat(average.replace(",", "."));
    if (!Number.isFinite(av) || av < 0 || av > 100) e.average = a.errAverage || "المعدل 0–100";
    if (total.trim()) {
      const tv = parseFloat(total.replace(",", "."));
      if (!Number.isFinite(tv) || tv < 0) e.total = a.errTotal || "المجموع رقم موجب";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const av = parseFloat(average.replace(",", "."));
      const tv = total.trim() ? parseFloat(total.replace(",", ".")) : null;
      const body = {
        full_name: fullName.trim(),
        graduation_year: parseInt(graduationYear.trim(), 10),
        school_name: schoolName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        category,
        department_id: departmentId,
        study_type: studyType,
        average: av,
        total: tv != null && Number.isFinite(tv) ? tv : undefined,
        notes: notes.trim() || undefined,
      };
      const res = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.id) {
        setSubmittedId(data.id);
      } else {
        setErrors({ submit: data.error || "حدث خطأ" });
      }
    } catch {
      setErrors({ submit: "حدث خطأ" });
    } finally {
      setLoading(false);
    }
  }

  const label = (locale === "ar" ? (d: DeptOption) => d.displayName || d.displayNameEn || d.id : (d: DeptOption) => d.displayNameEn || d.displayName || d.id);
  const inputCls = "w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none";
  const errCls = "text-red-600 text-sm mt-0.5";
  const secCls = "space-y-4 p-5 rounded-xl border border-neutral-200 bg-white";

  if (submittedId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#31BD9C]/20 text-[#31BD9C] mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">{a.success}</h2>
          <p className="text-neutral-600">{a.successWithId?.replace("{id}", submittedId) || `رقم الطلب: ${submittedId}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <header className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{a.title}</h1>
        <p className="text-neutral-600 mt-2">{a.subtitle}</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-8">
      {/* شريط التقدّم */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-2 text-sm">
        <span className="text-[#31BD9C] font-semibold">● {a.progress1}</span>
        <span className="text-neutral-400">→</span>
        <span className="text-neutral-600">{a.progress2}</span>
        <span className="text-neutral-400">→</span>
        <span className="text-neutral-600">{a.progress3}</span>
      </div>

      {/* أ) معلومات الطالب */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-4">{a.sectionStudent}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.fullName} *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} required />
            {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.phone} *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder={a.placeholderPhone} required />
            {errors.phone && <p className={errCls}>{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={a.placeholderEmail} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.address} *</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} required />
            {errors.address && <p className={errCls}>{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.schoolName} *</label>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={inputCls} required />
            {errors.schoolName && <p className={errCls}>{errors.schoolName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.graduationYear} *</label>
            <input type="text" inputMode="numeric" maxLength={4} value={graduationYear} onChange={(e) => setGraduationYear(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="2024" required />
            {errors.graduationYear && <p className={errCls}>{errors.graduationYear}</p>}
          </div>
        </div>
      </section>

      {/* ب) معلومات الدراسة */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-4">{a.sectionStudy}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.category} *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} required>
              <option value="">— {locale === "ar" ? "اختر" : "Select"} —</option>
              {DEPT_FEE_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{locale === "ar" ? c.labelAr : c.labelEn}</option>
              ))}
            </select>
            {errors.category && <p className={errCls}>{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.department} *</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls} required>
              <option value="">{a.placeholderDepartment}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{label(d)}</option>
              ))}
            </select>
            {errors.department && <p className={errCls}>{errors.department}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.studyType} *</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="studyType" checked={studyType === "morning"} onChange={() => setStudyType("morning")} className="text-[#31BD9C]" />
                <span>{a.studyMorning}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="studyType" checked={studyType === "evening"} onChange={() => setStudyType("evening")} className="text-[#31BD9C]" />
                <span>{a.studyEvening}</span>
              </label>
            </div>
            {errors.studyType && <p className={errCls}>{errors.studyType}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.average} *</label>
            <input type="text" inputMode="decimal" value={average} onChange={(e) => setAverage(e.target.value)} className={inputCls} placeholder="75.5" required />
            {errors.average && <p className={errCls}>{errors.average}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.total}</label>
            <input type="text" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={inputCls} />
            {errors.total && <p className={errCls}>{errors.total}</p>}
          </div>
        </div>
      </section>

      {/* ج) ملاحظات وإرسال */}
      <section className={secCls}>
        <h3 className="font-bold text-neutral-900 mb-4">{a.sectionNotes}</h3>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">{a.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={3} placeholder={a.placeholderNotes} />
        </div>
        {errors.submit && <p className={errCls}>{errors.submit}</p>}
        <button type="submit" disabled={loading} className="mt-4 w-full sm:w-auto px-8 py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
          {loading ? a.sending : a.submit}
        </button>
      </section>
    </form>
    </div>
  );
}
