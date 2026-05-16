"use client";

import { useMemo, useState } from "react";
import { BLOOD_TYPES, EDUCATION_LEVELS, JOB_CATEGORIES } from "@/lib/employeeIdentityConfig";
import {
  filterArabicFieldInput,
  filterEnglishNameInput,
  filterIraqiPhoneInput,
  filterOptionalEmailInput,
  isValidArabicAddress,
  isValidArabicFullName,
  isValidArabicOptional,
  isValidArabicWorkplace,
  isValidBloodType,
  isValidEducationLevel,
  isValidEnglishFullName,
  isValidIraqiMobile,
  isValidJobCategory,
  isValidOptionalEmail,
} from "@/lib/employeeIdentityRequestValidation";

export type EmployeeIdentityLabels = Record<string, string>;

type Props = {
  locale: "ar" | "en";
  labels: EmployeeIdentityLabels;
};

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function EmployeeIdentityRequestForm({ locale, labels }: Props) {
  const L = (k: string) => labels[k] ?? fallback[k] ?? "";
  const isRtl = locale === "ar";

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [position, setPosition] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxDob = useMemo(() => yesterdayYmd(), []);
  const fieldClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-[#04025E] focus:outline-none focus:ring-2 focus:ring-[#04025E]/20";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      !nameAr.trim() ||
      !nameEn.trim() ||
      !dateOfBirth ||
      !address.trim() ||
      !phone.trim() ||
      !bloodType ||
      !educationLevel ||
      !workplace.trim() ||
      !jobCategory ||
      !photoFile
    ) {
      setError(L("required"));
      return;
    }
    if (!isValidArabicFullName(nameAr)) {
      setError(L("errorNameArArabic"));
      return;
    }
    if (!isValidEnglishFullName(nameEn)) {
      setError(L("errorNameEnEnglish"));
      return;
    }
    if (dateOfBirth > maxDob) {
      setError(L("dobHint"));
      return;
    }
    if (!isValidArabicAddress(address)) {
      setError(L("errorAddress"));
      return;
    }
    const phoneNorm = filterIraqiPhoneInput(phone);
    if (!isValidIraqiMobile(phoneNorm)) {
      setError(L("errorPhoneIraqi"));
      return;
    }
    if (!isValidBloodType(bloodType)) {
      setError(L("required"));
      return;
    }
    if (!isValidEducationLevel(educationLevel)) {
      setError(L("required"));
      return;
    }
    if (!isValidArabicWorkplace(workplace)) {
      setError(L("errorArabicField"));
      return;
    }
    if (!isValidJobCategory(jobCategory)) {
      setError(L("required"));
      return;
    }
    if (!isValidArabicOptional(position)) {
      setError(L("errorArabicField"));
      return;
    }
    const emailNorm = officialEmail.trim().toLowerCase();
    if (!isValidOptionalEmail(emailNorm || null)) {
      setError(L("errorEmail"));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", photoFile);
      const up = await fetch("/api/media/public", { method: "POST", body: fd });
      const upJson = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(String(upJson?.error || L("errorUpload")));
      const photoMediaId = String(upJson.id);

      const res = await fetch("/api/employee-identity-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          dateOfBirth,
          address: address.trim(),
          phone: phoneNorm,
          bloodType,
          educationLevel,
          workplace: workplace.trim(),
          jobCategory,
          position: position.trim() || null,
          officialEmail: emailNorm || null,
          photoMediaId,
          locale,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(j?.error || L("errorGeneric")));

      setSuccess(true);
      setNameAr("");
      setNameEn("");
      setDateOfBirth("");
      setAddress("");
      setPhone("");
      setBloodType("");
      setEducationLevel("");
      setWorkplace("");
      setJobCategory("");
      setPosition("");
      setOfficialEmail("");
      setPhotoFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : L("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10" dir={isRtl ? "rtl" : "ltr"}>
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">{L("title")}</h1>
        <p className="text-sm text-neutral-600 mb-8 leading-relaxed">{L("subtitle")}</p>

        {success && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#04025E]" role="status">
            {L("success")}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("nameAr")}</label>
            <input
              className={fieldClass}
              value={nameAr}
              onChange={(e) => setNameAr(filterArabicFieldInput(e.target.value))}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("nameEn")}</label>
            <input
              className={fieldClass}
              value={nameEn}
              onChange={(e) => setNameEn(filterEnglishNameInput(e.target.value))}
              dir="ltr"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("dob")}</label>
            <input
              type="date"
              className={fieldClass}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={maxDob}
              required
            />
            <p className="mt-1 text-xs text-neutral-500">{L("dobHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("address")}</label>
            <textarea
              className={`${fieldClass} min-h-[80px] resize-y`}
              value={address}
              onChange={(e) => setAddress(filterArabicFieldInput(e.target.value))}
              required
              maxLength={300}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("phone")}</label>
            <input
              type="text"
              inputMode="numeric"
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(filterIraqiPhoneInput(e.target.value))}
              placeholder={L("phonePlaceholder")}
              required
              maxLength={11}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("bloodType")}</label>
            <select
              className={fieldClass}
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              required
            >
              <option value="">{L("bloodTypeChoose")}</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("educationLevel")}</label>
            <select
              className={fieldClass}
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              required
            >
              <option value="">{L("educationLevelChoose")}</option>
              {EDUCATION_LEVELS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.labelAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("workplace")}</label>
            <input
              className={fieldClass}
              value={workplace}
              onChange={(e) => setWorkplace(filterArabicFieldInput(e.target.value))}
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("jobCategory")}</label>
            <select
              className={fieldClass}
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
              required
            >
              <option value="">{L("jobCategoryChoose")}</option>
              {JOB_CATEGORIES.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.labelAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">
              {L("position")}{" "}
              <span className="text-neutral-400 font-normal">({L("positionOptional")})</span>
            </label>
            <input
              className={fieldClass}
              value={position}
              onChange={(e) => setPosition(filterArabicFieldInput(e.target.value))}
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">
              {L("officialEmail")}{" "}
              <span className="text-neutral-400 font-normal">({L("officialEmailOptional")})</span>
            </label>
            <input
              type="email"
              className={fieldClass}
              value={officialEmail}
              onChange={(e) => setOfficialEmail(filterOptionalEmailInput(e.target.value))}
              dir="ltr"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("photo")}</label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-neutral-600 file:me-3 file:rounded-lg file:border-0 file:bg-[#04025E]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#04025E] hover:file:bg-[#04025E]/20"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="mt-1 text-xs text-neutral-500">{L("photoHint")}</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#04025E] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#1a3a8f] disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            {submitting ? L("submitting") : L("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

const fallback: Record<string, string> = {
  title: "طلب هوية موظف",
  subtitle: "",
  nameAr: "الاسم الكامل (بالعربية)",
  nameEn: "الاسم الكامل (بالإنجليزية)",
  dob: "التولد",
  dobHint: "",
  address: "عنوان السكن",
  phone: "رقم الهاتف",
  bloodType: "فصيلة الدم",
  educationLevel: "التحصيل العلمي",
  educationLevelChoose: "اختر التحصيل العلمي",
  workplace: "مكان العمل",
  jobCategory: "الوظيفة",
  position: "المنصب",
  officialEmail: "البريد الإلكتروني الرسمي",
  photo: "صورة شخصية",
  submit: "رفع البيانات",
  submitting: "جاري الرفع…",
  success: "تم حفظ البيانات بنجاح",
  required: "هذا الحقل مطلوب",
};
