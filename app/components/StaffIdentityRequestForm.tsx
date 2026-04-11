"use client";

import { useMemo, useState } from "react";
import {
  filterArabicFieldInput,
  filterEnglishNameInput,
  filterIraqiPhoneInput,
  filterUniversityEmailInput,
  isValidArabicFullName,
  isValidArabicOptional,
  isValidArabicWorkplace,
  isValidEnglishFullName,
  isValidIraqiMobile,
  isValidShauUniversityEmail,
} from "@/lib/staffIdentityRequestValidation";

export type StaffIdentityLabels = Record<string, string>;

type Props = {
  locale: "ar" | "en";
  labels: StaffIdentityLabels;
};

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StaffIdentityRequestForm({ locale, labels }: Props) {
  const L = (k: string) => labels[k] ?? (fallback as Record<string, string>)[k] ?? "";
  const isRtl = locale === "ar";

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [academicTitle, setAcademicTitle] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [universityEmail, setUniversityEmail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const maxDob = useMemo(() => yesterdayYmd(), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nameAr.trim() || !nameEn.trim() || !dateOfBirth || !workplace.trim() || !phone.trim() || !universityEmail.trim()) {
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
    if (!dateOfBirth || dateOfBirth > maxDob) {
      setError(L("dobHint"));
      return;
    }
    if (!isValidArabicOptional(academicTitle)) {
      setError(L("errorArabicField"));
      return;
    }
    if (!isValidArabicWorkplace(workplace)) {
      setError(L("errorArabicField"));
      return;
    }
    if (!isValidArabicOptional(position)) {
      setError(L("errorArabicField"));
      return;
    }
    const phoneNorm = filterIraqiPhoneInput(phone);
    if (!isValidIraqiMobile(phoneNorm)) {
      setError(L("errorPhoneIraqi"));
      return;
    }
    const emailNorm = universityEmail.trim().toLowerCase();
    if (!isValidShauUniversityEmail(emailNorm)) {
      setError(L("errorEmailShau"));
      return;
    }
    if (!photoFile) {
      setError(L("required"));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", photoFile);
      const up = await fetch("/api/media/public", { method: "POST", body: fd });
      const upJson = await up.json().catch(() => ({}));
      if (!up.ok) {
        throw new Error(String(upJson?.error || L("errorUpload")));
      }
      const photoMediaId = String(upJson.id);

      const res = await fetch("/api/staff-identity-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          dateOfBirth,
          academicTitle: academicTitle.trim() || null,
          workplace: workplace.trim(),
          position: position.trim() || null,
          phone: phoneNorm,
          universityEmail: emailNorm,
          photoMediaId,
          locale,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String(j?.error || L("errorGeneric")));
      }

      setSuccess(true);
      setNameAr("");
      setNameEn("");
      setDateOfBirth("");
      setAcademicTitle("");
      setWorkplace("");
      setPosition("");
      setPhone("");
      setUniversityEmail("");
      setPhotoFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : L("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10" dir={isRtl ? "rtl" : "ltr"}>
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">{L("title")}</h1>
        <p className="text-sm text-neutral-600 mb-8 leading-relaxed">{L("subtitle")}</p>

        {success && (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
            role="status"
          >
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
              autoComplete="name"
              required
              maxLength={200}
            />
            <p className="mt-1 text-xs text-neutral-500">{L("nameArHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("nameEn")}</label>
            <input
              className={fieldClass}
              value={nameEn}
              onChange={(e) => setNameEn(filterEnglishNameInput(e.target.value))}
              autoComplete="name"
              required
              maxLength={200}
            />
            <p className="mt-1 text-xs text-neutral-500">{L("nameEnHint")}</p>
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
            <label className="block text-sm font-semibold text-neutral-800 mb-1">
              {L("academicTitle")}{" "}
              <span className="text-neutral-400 font-normal">({L("academicTitleOptional")})</span>
            </label>
            <input
              className={fieldClass}
              value={academicTitle}
              onChange={(e) => setAcademicTitle(filterArabicFieldInput(e.target.value))}
              maxLength={120}
            />
            <p className="mt-1 text-xs text-neutral-500">{L("arabicFieldsHint")}</p>
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
            <p className="mt-1 text-xs text-neutral-500">{L("arabicFieldsHint")}</p>
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
            <p className="mt-1 text-xs text-neutral-500">{L("arabicFieldsHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("phone")}</label>
            <input
              type="text"
              inputMode="numeric"
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(filterIraqiPhoneInput(e.target.value))}
              autoComplete="tel"
              placeholder={L("phonePlaceholder")}
              required
              maxLength={11}
            />
            <p className="mt-1 text-xs text-neutral-500">{L("phonePlaceholder")}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("universityEmail")}</label>
            <input
              type="email"
              className={fieldClass}
              value={universityEmail}
              onChange={(e) => setUniversityEmail(filterUniversityEmailInput(e.target.value))}
              autoComplete="email"
              placeholder="name@shau.edu.iq"
              required
              maxLength={120}
            />
            <p className="mt-1 text-xs text-neutral-500">{L("emailHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-1">{L("photo")}</label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-neutral-600 file:me-3 file:rounded-lg file:border-0 file:bg-[#31BD9C]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#31BD9C] hover:file:bg-[#31BD9C]/20"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              required
            />
            <p className="mt-1 text-xs text-neutral-500">{L("photoHint")}</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#31BD9C] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2aa88a] disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            {submitting ? L("submitting") : L("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

const fallback: Record<string, string> = {
  title: "",
  subtitle: "",
  nameAr: "",
  nameEn: "",
  dob: "",
  dobHint: "",
  academicTitle: "",
  academicTitleOptional: "",
  workplace: "",
  position: "",
  positionOptional: "",
  phone: "",
  universityEmail: "",
  phonePlaceholder: "",
  emailHint: "",
  nameArHint: "",
  nameEnHint: "",
  arabicFieldsHint: "",
  errorNameArArabic: "",
  errorNameEnEnglish: "",
  errorArabicField: "",
  errorPhoneIraqi: "",
  errorEmailShau: "",
  photo: "",
  photoHint: "",
  submit: "",
  submitting: "",
  success: "",
  errorGeneric: "",
  errorUpload: "",
  required: "",
};
