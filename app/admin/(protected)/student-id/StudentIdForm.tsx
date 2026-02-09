"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DEPARTMENT_OPTIONS = [
  "تقنيات صـــناعـــــــة الاســــنان",
  "تقنــــــــــــــــــــيات التـخـــديــــــــر",
  "تقنيـــــــــــــات الاشـــــــــــــــــعــة",
  "تقـــــــــــــــنيات البصـــــــــــريات",
  "تقنـــــــــيات طــب الطــــــوارئ",
  "تقنيات صحــــــة المجتمـــــــــع",
  "تقنـــيات العــلاج الطبيعــــــــي",
  "هندسة تقنيات الفيزياء الصحية",
  "هندسـة تقنيات النفط والغـاز",
  "هندسة تقنيات الامن السيبراني",
  "هندسة تقنيات البناء والانشاءات",
];
const STAGE_OPTIONS = ["الاولــــــــــى", "الثـــــانيــــــة", "الثـــــالثــــــة", "الــرابعـــــــة"];
const STAGE_EN_MAP: Record<string, string> = {
  "الاولــــــــــى": "First",
  "الثـــــانيــــــة": "Second",
  "الثـــــالثــــــة": "Third",
  "الــرابعـــــــة": "Fourth",
};

function normalizeArabic(text: string): string {
  return String(text || "")
    .trim()
    .replace(/[\sـ]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizeBloodType(value: string): string {
  return String(value || "").trim().toUpperCase();
}

function mapDepartmentToOption(value: string): string {
  const normalized = normalizeArabic(value);
  const match = DEPARTMENT_OPTIONS.find((opt) => normalizeArabic(opt) === normalized);
  return match || value;
}

function mapStageToOption(value: string): string {
  const normalized = normalizeArabic(value);
  const match = STAGE_OPTIONS.find((opt) => normalizeArabic(opt) === normalized);
  return match || value;
}

type DirectorySuggestion = {
  id: string;
  nameAr: string;
  nameEn: string;
  dob: string;
  address: string;
  bloodType: string;
  department: string;
  stage: string;
};

export default function StudentIdForm({ initialSerial }: { initialSerial?: string }) {
  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    dob: "",
    address: "",
    addressEn: "",
    bloodType: "",
    department: "",
    departmentEn: "",
    stage: "",
    stageEn: "",
    serial: "",
  });
  const [existingPhotoId, setExistingPhotoId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<DirectorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [removingBg, setRemovingBg] = useState(false);
  const [removeStatus, setRemoveStatus] = useState<string | null>(null);
  const [translatingAddress, setTranslatingAddress] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translatingDept, setTranslatingDept] = useState(false);
  const [translateDeptError, setTranslateDeptError] = useState<string | null>(null);
  const [translatingStage, setTranslatingStage] = useState(false);
  const [translateStageError, setTranslateStageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.nameAr.trim() &&
      form.nameEn.trim() &&
      form.dob &&
      form.address.trim() &&
      form.addressEn.trim() &&
      form.bloodType.trim() &&
      form.department.trim() &&
      form.departmentEn.trim() &&
      form.stage.trim() &&
      form.stageEn.trim() &&
      form.serial.trim() &&
      !loading
    );
  }, [form, loading]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === "address" || name === "addressEn") {
      setTranslateError(null);
    }
    if (name === "department" || name === "departmentEn") {
      setTranslateDeptError(null);
    }
    if (name === "stage" || name === "stageEn") {
      setTranslateStageError(null);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function translateText(source: string): Promise<string> {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=" +
      encodeURIComponent(source);
    const res = await fetch(url);
    if (!res.ok) throw new Error("translate_failed");
    const data = (await res.json()) as Array<Array<[string, string, null, null]>>;
    const translated = Array.isArray(data?.[0]) ? data[0].map((chunk) => chunk[0]).join("") : "";
    if (!translated) throw new Error("translate_empty");
    return translated;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      let photoMediaId: string | null = existingPhotoId;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch("/api/media", { method: "POST", body: fd });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(upJson?.error || "فشل رفع صورة الطالب");
        }
        photoMediaId = String(upJson.id);
      }

      const res = await fetch("/api/student-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          photoMediaId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "فشل حفظ بيانات الهوية");
      }
      setSuccess("تم حفظ بيانات الهوية بنجاح.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function loadBySerial(serial: string) {
    const s = serial.trim();
    if (!s) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/student-id/${encodeURIComponent(s)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "فشل تحميل بيانات الهوية");
      }
      const card = json.card;
      setForm({
        nameAr: String(card.nameAr || ""),
        nameEn: String(card.nameEn || ""),
        dob: String(card.dob || "").slice(0, 10),
        address: String(card.address || ""),
        addressEn: String(card.addressEn || ""),
        bloodType: String(card.bloodType || ""),
        department: String(card.department || ""),
        departmentEn: String(card.departmentEn || ""),
        stage: String(card.stage || ""),
        stageEn: String(card.stageEn || ""),
        serial: String(card.serial || s),
      });
      setExistingPhotoId(card.photoMediaId ? String(card.photoMediaId) : null);
      setSuccess("تم تحميل بيانات الهوية.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function generateSerial(department: string) {
    const dept = department.trim();
    if (!dept) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/student-id/next-serial?department=${encodeURIComponent(dept)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "فشل توليد السيريال");
      }
      setForm((prev) => ({ ...prev, serial: String(json.serial || "") }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(file: File | null) {
    setRemoveStatus(null);
    if (!file) {
      setPhotoFile(null);
      return;
    }
    if (!autoRemoveBg) {
      setPhotoFile(file);
      return;
    }
    setRemovingBg(true);
    try {
      const mod = await import("@imgly/background-removal");
      const blob = await mod.removeBackground(file);
      const nameBase = file.name.replace(/\.[^.]+$/, "");
      const cleaned = new File([blob], `${nameBase}-bg.png`, { type: "image/png" });
      setPhotoFile(cleaned);
      setRemoveStatus("تمت إزالة الخلفية بنجاح.");
    } catch (err) {
      setPhotoFile(file);
      setRemoveStatus("تعذر إزالة الخلفية تلقائياً، سيتم حفظ الصورة كما هي.");
    } finally {
      setRemovingBg(false);
    }
  }

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoFile]);

  async function handleAutoTranslateAddress() {
    const source = form.address.trim();
    if (!source) {
      setTranslateError("أدخل العنوان العربي أولاً.");
      return;
    }
    setTranslatingAddress(true);
    setTranslateError(null);
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=" +
        encodeURIComponent(source);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("translate_failed");
      }
      const data = (await res.json()) as Array<Array<[string, string, null, null]>>;
      const translated = Array.isArray(data?.[0])
        ? data[0].map((chunk) => chunk[0]).join("")
        : "";
      if (!translated) {
        throw new Error("translate_empty");
      }
      setForm((prev) => ({ ...prev, addressEn: translated }));
    } catch {
      setTranslateError("تعذر ترجمة العنوان تلقائياً، يرجى الإدخال يدوياً.");
    } finally {
      setTranslatingAddress(false);
    }
  }

  async function handleAutoTranslateDepartment() {
    const source = form.department.trim();
    if (!source) {
      setTranslateDeptError("اختر القسم العربي أولاً.");
      return;
    }
    setTranslatingDept(true);
    setTranslateDeptError(null);
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=" +
        encodeURIComponent(source);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("translate_failed");
      }
      const data = (await res.json()) as Array<Array<[string, string, null, null]>>;
      const translated = Array.isArray(data?.[0])
        ? data[0].map((chunk) => chunk[0]).join("")
        : "";
      if (!translated) {
        throw new Error("translate_empty");
      }
      setForm((prev) => ({ ...prev, departmentEn: translated }));
    } catch {
      setTranslateDeptError("تعذر ترجمة القسم تلقائياً، يرجى الإدخال يدوياً.");
    } finally {
      setTranslatingDept(false);
    }
  }

  async function handleAutoTranslateStage() {
    const source = form.stage.trim();
    if (!source) {
      setTranslateStageError("اختر المرحلة العربية أولاً.");
      return;
    }
    setTranslatingStage(true);
    setTranslateStageError(null);
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=" +
        encodeURIComponent(source);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("translate_failed");
      }
      const data = (await res.json()) as Array<Array<[string, string, null, null]>>;
      const translated = Array.isArray(data?.[0])
        ? data[0].map((chunk) => chunk[0]).join("")
        : "";
      if (!translated) {
        throw new Error("translate_empty");
      }
      setForm((prev) => ({ ...prev, stageEn: translated }));
    } catch {
      setTranslateStageError("تعذر ترجمة المرحلة تلقائياً، يرجى الإدخال يدوياً.");
    } finally {
      setTranslatingStage(false);
    }
  }

  useEffect(() => {
    if (initialSerial) {
      loadBySerial(initialSerial);
    }
  }, [initialSerial]);

  useEffect(() => {
    const q = form.nameAr.trim();
    if (q.length < 2) {
      setNameSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/student-directory/search?q=${encodeURIComponent(q)}`);
        const json = await res.json().catch(() => ({}));
        setNameSuggestions(Array.isArray(json.results) ? json.results : []);
      } catch {
        setNameSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form.nameAr]);


  useEffect(() => {
    if (!initialSerial && !form.serial && form.department) {
      generateSerial(form.department);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.department]);

  useEffect(() => {
    if (initialSerial) return;
    try {
      const savedDept = localStorage.getItem("studentId:lastDepartment") || "";
      const savedStage = localStorage.getItem("studentId:lastStage") || "";
      setForm((prev) => ({
        ...prev,
        department: prev.department || savedDept,
        stage: prev.stage || savedStage,
      }));
    } catch {
      // ignore storage errors
    }
  }, [initialSerial]);

  useEffect(() => {
    if (initialSerial) return;
    if (form.department) {
      try {
        localStorage.setItem("studentId:lastDepartment", form.department);
      } catch {
        // ignore storage errors
      }
    }
  }, [form.department, initialSerial]);

  useEffect(() => {
    if (initialSerial) return;
    if (form.stage) {
      try {
        localStorage.setItem("studentId:lastStage", form.stage);
      } catch {
        // ignore storage errors
      }
      if (!form.stageEn.trim() && STAGE_EN_MAP[form.stage]) {
        setForm((prev) => ({ ...prev, stageEn: STAGE_EN_MAP[form.stage] }));
      }
    }
  }, [form.stage, form.stageEn, initialSerial]);

  function formatDobForInput(iso: string): string {
    if (!iso) return "";
    const str = String(iso).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.slice(0, 10);
    const parts = str.split(/[\/\-]/).map((p) => p.trim());
    if (parts.length === 3) {
      const [d, m, y] = parts.map((p) => Number(p));
      if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
        const mm = String(m).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
      }
    }
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function applySuggestion(s: DirectorySuggestion) {
    const mappedDepartment = mapDepartmentToOption(s.department);
    const mappedStage = mapStageToOption(s.stage);
    const mappedBloodType = normalizeBloodType(s.bloodType);
    setForm((prev) => ({
      ...prev,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      dob: formatDobForInput(s.dob),
      address: s.address,
      addressEn: "",
      bloodType: mappedBloodType,
      department: mappedDepartment,
      departmentEn: "",
      stage: mappedStage,
      stageEn: "",
    }));

    try {
      if (!form.addressEn.trim()) {
        const translated = await translateText(s.address);
        setForm((prev) => ({ ...prev, addressEn: translated }));
      }
    } catch {
      // ignore translation errors
    }

    try {
      if (!form.departmentEn.trim()) {
        const translated = await translateText(mappedDepartment);
        setForm((prev) => ({ ...prev, departmentEn: translated }));
      }
    } catch {
      // ignore translation errors
    }

    if (!form.stageEn.trim() && STAGE_EN_MAP[mappedStage]) {
      setForm((prev) => ({ ...prev, stageEn: STAGE_EN_MAP[mappedStage] }));
    }

    setShowSuggestions(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div>{success}</div>
          {form.serial.trim() && (
            <Link
              href={`/admin/student-id/preview/${encodeURIComponent(form.serial.trim())}`}
              className="inline-flex items-center mt-2 text-[#31BD9C] hover:underline"
            >
              عرض معاينة الهوية
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">الاسم (عربي)</label>
          <input
            name="nameAr"
            value={form.nameAr}
            onChange={onChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          />
          {showSuggestions && nameSuggestions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-lg max-h-56 overflow-y-auto">
              {nameSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                  className="w-full text-start px-4 py-2 hover:bg-neutral-50"
                >
                  <div className="text-sm font-semibold text-neutral-900">{s.nameAr}</div>
                  <div className="text-xs text-neutral-500">{s.department} • {s.stage}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">الاسم (إنكليزي)</label>
          <input
            name="nameEn"
            value={form.nameEn}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">تاريخ الولادة</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">العنوان</label>
          <input
            name="address"
            value={form.address}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">العنوان (إنكليزي)</label>
          <div className="flex items-center gap-2">
            <input
              name="addressEn"
              value={form.addressEn}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={handleAutoTranslateAddress}
              disabled={translatingAddress}
              className="px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {translatingAddress ? "جارٍ الترجمة..." : "ترجمة تلقائية"}
            </button>
          </div>
          {translateError && <div className="text-xs text-red-600 mt-2">{translateError}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">فصيلة الدم</label>
          <select
            name="bloodType"
            value={form.bloodType}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          >
            <option value="">اختر فصيلة الدم</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">القسم</label>
          <select
            name="department"
            value={form.department}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          >
            <option value="">اختر القسم</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">القسم (إنكليزي)</label>
          <div className="flex items-center gap-2">
            <input
              name="departmentEn"
              value={form.departmentEn}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={handleAutoTranslateDepartment}
              disabled={translatingDept}
              className="px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {translatingDept ? "جارٍ الترجمة..." : "ترجمة تلقائية"}
            </button>
          </div>
          {translateDeptError && <div className="text-xs text-red-600 mt-2">{translateDeptError}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">المرحلة</label>
          <select
            name="stage"
            value={form.stage}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
            required
          >
            <option value="">اختر المرحلة</option>
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">المرحلة (إنكليزي)</label>
          <div className="flex items-center gap-2">
            <input
              name="stageEn"
              value={form.stageEn}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              required
            />
            <button
              type="button"
              onClick={handleAutoTranslateStage}
              disabled={translatingStage}
              className="px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {translatingStage ? "جارٍ الترجمة..." : "ترجمة تلقائية"}
            </button>
          </div>
          {translateStageError && <div className="text-xs text-red-600 mt-2">{translateStageError}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">السيريال</label>
          <div className="flex items-center gap-2">
            <input
              name="serial"
              value={form.serial}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
              required
              readOnly
            />
            <button
              type="button"
              onClick={() => loadBySerial(form.serial)}
              className="px-4 py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              تحميل
            </button>
            <button
              type="button"
              onClick={() => generateSerial(form.department)}
              className="px-4 py-3 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
            >
              توليد
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">صورة الطالب</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={autoRemoveBg}
              onChange={(e) => setAutoRemoveBg(e.target.checked)}
              className="w-4 h-4"
            />
            إزالة الخلفية تلقائياً
          </label>
          {existingPhotoId && (
            <div className="text-xs text-neutral-500 mt-2">
              صورة حالية محفوظة.
            </div>
          )}
          {(photoPreviewUrl || existingPhotoId) && (
            <div className="mt-3">
              <img
                src={photoPreviewUrl || `/api/media/${existingPhotoId}`}
                alt="student preview"
                className="w-28 h-36 rounded-lg border border-neutral-200 object-cover bg-white"
              />
            </div>
          )}
          {removingBg && (
            <div className="text-xs text-neutral-500 mt-2">جاري إزالة الخلفية...</div>
          )}
          {removeStatus && (
            <div className="text-xs text-neutral-600 mt-2">{removeStatus}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الحفظ..." : "حفظ الهوية"}
        </button>
      </div>
    </form>
  );
}
