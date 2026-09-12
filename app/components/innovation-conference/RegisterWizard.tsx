"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  IC_APPLICANT_ROLES,
  type IcApplicantRole,
  type IcGender,
  type IcInnovationField,
  type IcPatentStatus,
  type IcProjectStage,
} from "@/lib/innovationConferenceTypes";
import {
  firstErrorKey,
  validateAllSteps,
  validateStep,
} from "@/lib/innovationConferenceClientValidation";
import {
  ageOnEventDate,
  buildRegisterPayload,
  clearDraft,
  clearSuccess,
  createEmptyForm,
  emptyTeamMember,
  formHasMeaningfulData,
  IC_FIELD_LIMITS,
  IC_FIELD_OPTIONS,
  IC_GENDER_LABELS,
  IC_IRAQI_GOVERNORATES,
  IC_PATENT_LABELS,
  IC_ROLE_LABELS,
  IC_STAGE_OPTIONS,
  IC_STEP_LABELS,
  loadDraft,
  loadSuccess,
  roleNeedsInstitution,
  saveDraft,
  saveSuccess,
  type IcRegisterFormState,
  type IcSuccessPayload,
} from "@/lib/innovationConferenceUi";
import IcFileUploadZone from "./IcFileUploadZone";
import {
  CharCounter,
  FieldError,
  focusFieldByKey,
  IcIcon,
  icDatePickerGuardProps,
  icFocus,
  icHintClass,
  icInputClass,
  icLabelClass,
  SectionLead,
  SectionTitle,
} from "./IcFormChrome";

type Props = {
  registrationOpen: boolean;
  eventDate: string;
  titleAr: string;
};

export default function RegisterWizard({ registrationOpen, eventDate, titleAr }: Props) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(false);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [form, setForm] = useState<IcRegisterFormState>(() => createEmptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<IcSuccessPayload | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const existingSuccess = loadSuccess();
    if (existingSuccess?.trackingToken) {
      setSuccess(existingSuccess);
      setBootstrapped(true);
      return;
    }
    const draft = loadDraft();
    if (draft && formHasMeaningfulData(draft.form)) {
      setDraftPrompt(true);
    }
    setBootstrapped(true);
  }, []);

  const persistDraft = useEffectEvent(() => {
    if (!registrationOpen || success || !bootstrapped || draftPrompt) return;
    if (!formHasMeaningfulData(form) && step === 1) {
      clearDraft();
      return;
    }
    saveDraft({
      version: 1,
      step,
      maxReached,
      form,
      savedAt: new Date().toISOString(),
    });
  });

  useEffect(() => {
    const t = window.setTimeout(() => persistDraft(), 400);
    return () => window.clearTimeout(t);
  }, [form, step, maxReached, registrationOpen, success, bootstrapped, draftPrompt]);

  useEffect(() => {
    if (!registrationOpen || success) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formHasMeaningfulData(form) && !success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form, registrationOpen, success]);

  const resumeDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setForm(draft.form);
      setStep(Math.min(6, Math.max(1, draft.step || 1)));
      setMaxReached(Math.min(6, Math.max(1, draft.maxReached || draft.step || 1)));
    }
    setDraftPrompt(false);
  };

  const startFresh = () => {
    clearDraft();
    setForm(createEmptyForm());
    setStep(1);
    setMaxReached(1);
    setErrors({});
    setDraftPrompt(false);
  };

  const patchApplicant = useCallback(
    (patch: Partial<IcRegisterFormState["applicant"]>) => {
      setForm((f) => ({ ...f, applicant: { ...f.applicant, ...patch } }));
    },
    []
  );
  const patchProject = useCallback((patch: Partial<IcRegisterFormState["project"]>) => {
    setForm((f) => ({ ...f, project: { ...f.project, ...patch } }));
  }, []);

  const goNext = () => {
    const errs = validateStep(step, form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const k = firstErrorKey(errs);
      if (k) window.setTimeout(() => focusFieldByKey(k), 50);
      return;
    }
    const next = Math.min(6, step + 1);
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
  };

  const goToStep = (n: number) => {
    if (n < 1 || n > 6) return;
    if (n > maxReached) return;
    if (n > step) {
      const errs = validateStep(step, form);
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
    }
    setStep(n);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || submitState === "loading") return;

    const errs = validateAllSteps(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      for (let s = 1; s <= 6; s++) {
        const stepErrs = validateStep(s, form);
        if (Object.keys(stepErrs).length) {
          setStep(s);
          setMaxReached((m) => Math.max(m, s));
          window.setTimeout(() => {
            const k = firstErrorKey(stepErrs);
            if (k) focusFieldByKey(k);
          }, 80);
          break;
        }
      }
      return;
    }

    submittingRef.current = true;
    setSubmitState("loading");
    setSubmitError(null);

    try {
      const res = await fetch("/api/innovation-conference/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRegisterPayload(form)),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        application?: IcSuccessPayload;
        error?: { message?: string; fields?: Record<string, string>; code?: string };
      };

      if (!res.ok || !json.ok || !json.application) {
        if (json.error?.fields) setErrors(json.error.fields);
        setSubmitState("error");
        setSubmitError(json.error?.message || "تعذر إرسال الطلب. حاول مرة أخرى.");
        return;
      }

      const payload = json.application;
      saveSuccess(payload);
      clearDraft();
      setSuccess(payload);
      setSubmitState("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitState("error");
      setSubmitError("تعذر الاتصال بالخادم. بياناتك محفوظة محلياً.");
    } finally {
      submittingRef.current = false;
    }
  };

  if (!bootstrapped) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-neutral-500">
        جاري التحميل...
      </div>
    );
  }

  if (!registrationOpen && !success) {
    return (
      <div dir="rtl" className="overflow-x-hidden bg-white">
        <div className="bg-[#061528] px-4 py-14 text-center text-white">
          <h1 className="text-3xl font-extrabold">التسجيل لم يُفتح بعد</h1>
          <Link
            href="/ar/innovation-conference"
            className={`mt-8 inline-flex rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] ${icFocus}`}
          >
            العودة إلى صفحة المؤتمر
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <SuccessPanel
        data={success}
        onDone={() => {
          clearSuccess();
        }}
      />
    );
  }

  const age = form.applicant.birthDate ? ageOnEventDate(form.applicant.birthDate) : null;
  const needsInst = roleNeedsInstitution(form.applicant.applicantRole);
  const progressPct = ((step - 1) / 5) * 100;

  return (
    <div dir="rtl" className="overflow-x-hidden bg-white text-neutral-800">
      <header className="relative isolate overflow-hidden bg-[#061528] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(49,189,156,0.25), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-bold text-[#31BD9C]">تسجيل المشاركين</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">سجّل ابتكارك</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            أكمل الخطوات التالية لإرسال مشروعك للمشاركة في مؤتمر الشرق الدولي الأول للابتكار والإبداع
            2026.
          </p>
          <span className="mt-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 sm:text-sm">
            6 خطوات • يستغرق تقريباً 10–15 دقيقة
          </span>
        </div>
      </header>

      {draftPrompt && (
        <div className="border-b border-[#31BD9C]/25 bg-[#eef8f5]">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-[#163364]">وجدنا بيانات تسجيل غير مكتملة.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resumeDraft}
                className={`rounded-xl bg-[#31BD9C] px-4 py-2 text-sm font-bold text-[#061528] ${icFocus}`}
              >
                استكمال التسجيل
              </button>
              <button
                type="button"
                onClick={startFresh}
                className={`rounded-xl border border-[#163364]/20 bg-white px-4 py-2 text-sm font-semibold text-[#163364] ${icFocus}`}
              >
                بدء تسجيل جديد
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-neutral-100 bg-[#F7FAF9]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
          {/* Mobile progress */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#31BD9C]">
                الخطوة {step} من 6
              </span>
              <span className="text-[#163364]">{IC_STEP_LABELS[step - 1]}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-[#31BD9C] transition-all duration-300"
                style={{ width: `${Math.max(8, progressPct + 100 / 6)}%` }}
              />
            </div>
          </div>

          {/* Desktop steps */}
          <ol className="hidden gap-1 sm:grid sm:grid-cols-6">
            {IC_STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              const clickable = n <= maxReached;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => goToStep(n)}
                    className={`flex w-full flex-col items-start gap-1 rounded-xl px-2 py-2 text-right transition ${
                      clickable ? "cursor-pointer hover:bg-white/80" : "cursor-default opacity-60"
                    } ${icFocus}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-[#31BD9C] text-[#061528]"
                          : current
                            ? "bg-[#163364] text-white"
                            : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {done ? <IcIcon name="check" className="h-3.5 w-3.5" /> : n}
                    </span>
                    <span
                      className={`text-[11px] font-semibold leading-snug ${
                        current ? "text-[#163364]" : done ? "text-[#187c67]" : "text-neutral-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10" noValidate>
        {/* honeypot */}
        <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
          <label>
            الموقع
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </label>
        </div>

        {step === 1 && (
          <section className="space-y-6">
            <div>
              <SectionTitle>بيانات المشارك</SectionTitle>
              <SectionLead>أدخل بياناتك الشخصية وبيانات التواصل بدقة.</SectionLead>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2" data-field="applicant.fullName">
                <label className={icLabelClass} htmlFor="fullName">
                  الاسم الكامل *
                </label>
                <input
                  id="fullName"
                  name="applicant.fullName"
                  className={icInputClass}
                  value={form.applicant.fullName}
                  onChange={(e) => patchApplicant({ fullName: e.target.value })}
                  aria-invalid={!!errors["applicant.fullName"]}
                  aria-describedby={errors["applicant.fullName"] ? "err-fullName" : undefined}
                />
                <FieldError id="err-fullName" message={errors["applicant.fullName"]} />
              </div>

              <div data-field="applicant.birthDate">
                <label className={icLabelClass} htmlFor="birthDate">
                  تاريخ الميلاد *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  name="applicant.birthDate"
                  className={icInputClass}
                  value={form.applicant.birthDate}
                  onChange={(e) => patchApplicant({ birthDate: e.target.value })}
                  aria-invalid={!!errors["applicant.birthDate"]}
                  aria-describedby="hint-age"
                  {...icDatePickerGuardProps()}
                />
                <p id="hint-age" className={icHintClass}>
                  {age != null
                    ? `العمر يوم المؤتمر (${eventDate}): حوالي ${age} سنة`
                    : `يُحسب العمر بالنسبة لتاريخ المؤتمر ${eventDate}`}
                </p>
                <FieldError message={errors["applicant.birthDate"]} />
              </div>

              <div data-field="applicant.gender">
                <label className={icLabelClass} htmlFor="gender">
                  الجنس (اختياري)
                </label>
                <select
                  id="gender"
                  className={icInputClass}
                  value={form.applicant.gender}
                  onChange={(e) =>
                    patchApplicant({ gender: e.target.value as "" | IcGender })
                  }
                >
                  <option value="">—</option>
                  {(Object.keys(IC_GENDER_LABELS) as IcGender[]).map((g) => (
                    <option key={g} value={g}>
                      {IC_GENDER_LABELS[g]}
                    </option>
                  ))}
                </select>
              </div>

              <div data-field="applicant.governorate">
                <label className={icLabelClass} htmlFor="governorate">
                  المحافظة *
                </label>
                <select
                  id="governorate"
                  className={icInputClass}
                  value={form.applicant.governorate}
                  onChange={(e) => patchApplicant({ governorate: e.target.value })}
                  aria-invalid={!!errors["applicant.governorate"]}
                >
                  <option value="">اختر المحافظة</option>
                  {IC_IRAQI_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <FieldError message={errors["applicant.governorate"]} />
              </div>

              <div data-field="applicant.phone">
                <label className={icLabelClass} htmlFor="phone">
                  رقم الهاتف *
                </label>
                <input
                  id="phone"
                  inputMode="numeric"
                  className={icInputClass}
                  placeholder="07XXXXXXXXX"
                  value={form.applicant.phone}
                  onChange={(e) => patchApplicant({ phone: e.target.value })}
                  aria-invalid={!!errors["applicant.phone"]}
                />
                <FieldError message={errors["applicant.phone"]} />
              </div>

              <div data-field="applicant.email">
                <label className={icLabelClass} htmlFor="email">
                  البريد الإلكتروني *
                </label>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  className={`${icInputClass} text-left`}
                  value={form.applicant.email}
                  onChange={(e) => patchApplicant({ email: e.target.value })}
                  aria-invalid={!!errors["applicant.email"]}
                />
                <FieldError message={errors["applicant.email"]} />
              </div>

              <div className="sm:col-span-2" data-field="applicant.applicantRole">
                <label className={icLabelClass} htmlFor="applicantRole">
                  الصفة *
                </label>
                <select
                  id="applicantRole"
                  className={icInputClass}
                  value={form.applicant.applicantRole}
                  onChange={(e) =>
                    patchApplicant({
                      applicantRole: e.target.value as "" | IcApplicantRole,
                    })
                  }
                >
                  <option value="">اختر الصفة</option>
                  {IC_APPLICANT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {IC_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <FieldError message={errors["applicant.applicantRole"]} />
              </div>

              <div data-field="applicant.institutionName">
                <label className={icLabelClass} htmlFor="institutionName">
                  اسم المدرسة/الجامعة/المؤسسة{needsInst ? " *" : ""}
                </label>
                <input
                  id="institutionName"
                  className={icInputClass}
                  value={form.applicant.institutionName}
                  onChange={(e) => patchApplicant({ institutionName: e.target.value })}
                />
                <FieldError message={errors["applicant.institutionName"]} />
              </div>

              <div data-field="applicant.stageOrMajor">
                <label className={icLabelClass} htmlFor="stageOrMajor">
                  المرحلة / التخصص{needsInst ? " *" : ""}
                </label>
                <input
                  id="stageOrMajor"
                  className={icInputClass}
                  value={form.applicant.stageOrMajor}
                  onChange={(e) => patchApplicant({ stageOrMajor: e.target.value })}
                />
                <FieldError message={errors["applicant.stageOrMajor"]} />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <SectionTitle>بيانات المشروع</SectionTitle>
              <SectionLead>صف مشروعك بوضوح ليتمكن المقيّمون من فهم فكرته وأثره.</SectionLead>
            </div>

            <div data-field="project.projectTitle">
              <label className={icLabelClass} htmlFor="projectTitle">
                اسم المشروع *
              </label>
              <input
                id="projectTitle"
                className={icInputClass}
                value={form.project.projectTitle}
                maxLength={IC_FIELD_LIMITS.projectTitle.max}
                onChange={(e) => patchProject({ projectTitle: e.target.value })}
              />
              <CharCounter
                value={form.project.projectTitle}
                min={IC_FIELD_LIMITS.projectTitle.min}
                max={IC_FIELD_LIMITS.projectTitle.max}
              />
              <FieldError message={errors["project.projectTitle"]} />
            </div>

            <fieldset data-field="project.innovationField">
              <legend className={icLabelClass}>مجال الابتكار *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {IC_FIELD_OPTIONS.map((opt) => {
                  const selected = form.project.innovationField === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        patchProject({ innovationField: opt.value as IcInnovationField })
                      }
                      className={`rounded-2xl border p-4 text-right transition ${icFocus} ${
                        selected
                          ? "border-[#31BD9C] bg-[#eef8f5] ring-2 ring-[#31BD9C]/35"
                          : "border-neutral-200 bg-[#F7FAF9] hover:border-[#31BD9C]/40"
                      }`}
                      aria-pressed={selected}
                    >
                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#187c67]">
                        <IcIcon name={opt.icon as "health"} className="h-4 w-4" />
                      </span>
                      <span className="block text-sm font-bold text-[#163364]">{opt.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors["project.innovationField"]} />
            </fieldset>

            {(
              [
                ["projectSummary", "وصف مختصر *", IC_FIELD_LIMITS.projectSummary],
                ["problem", "المشكلة التي يعالجها *", IC_FIELD_LIMITS.problem],
                ["solution", "الحل المقترح *", IC_FIELD_LIMITS.solution],
                ["novelty", "الجانب المبتكر / الجديد *", IC_FIELD_LIMITS.novelty],
                ["beneficiaries", "الفئة المستفيدة *", IC_FIELD_LIMITS.beneficiaries],
                ["expectedImpact", "الأثر المتوقع على المجتمع *", IC_FIELD_LIMITS.expectedImpact],
              ] as const
            ).map(([key, label, lim]) => (
              <div key={key} data-field={`project.${key}`}>
                <label className={icLabelClass} htmlFor={key}>
                  {label}
                </label>
                <textarea
                  id={key}
                  rows={key === "beneficiaries" ? 2 : 4}
                  className={`${icInputClass} resize-y`}
                  value={form.project[key]}
                  maxLength={lim.max}
                  onChange={(e) => patchProject({ [key]: e.target.value })}
                />
                <CharCounter value={form.project[key]} min={lim.min} max={lim.max} />
                <FieldError message={errors[`project.${key}`]} />
              </div>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>الفريق ومرحلة المشروع</SectionTitle>
              <SectionLead>حدد نوع المشاركة ومرحلة نضج مشروعك.</SectionLead>
            </div>

            <fieldset data-field="participation.participationType">
              <legend className={icLabelClass}>نوع المشاركة *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["individual", "فردي", "تقديم المشروع باسمك كمشارك فردي."],
                    ["team", "فريق", "أنت القائد مع حتى 3 أعضاء إضافيين."],
                  ] as const
                ).map(([val, title, desc]) => {
                  const selected = form.participation.participationType === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          participation: {
                            participationType: val,
                            teamMembers: val === "individual" ? [] : f.participation.teamMembers,
                          },
                        }))
                      }
                      className={`rounded-2xl border p-5 text-right transition ${icFocus} ${
                        selected
                          ? "border-[#31BD9C] bg-[#eef8f5] ring-2 ring-[#31BD9C]/35"
                          : "border-neutral-200 bg-white hover:border-[#31BD9C]/40"
                      }`}
                      aria-pressed={selected}
                    >
                      <span className="block text-base font-bold text-[#163364]">{title}</span>
                      <span className="mt-1 block text-sm text-neutral-500">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {form.participation.participationType === "team" && (
              <div data-field="participation.teamMembers" className="space-y-4">
                <div className="rounded-2xl border border-[#163364]/10 bg-[#eef2f8] p-4">
                  <p className="text-xs font-bold text-[#31BD9C]">قائد الفريق</p>
                  <p className="mt-1 font-bold text-[#163364]">
                    {form.applicant.fullName || "— أكمل بيانات الخطوة 1"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {[form.applicant.email, form.applicant.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {form.participation.teamMembers.map((m, idx) => (
                  <div
                    key={idx}
                    className="space-y-4 rounded-2xl border border-neutral-200 bg-[#F7FAF9] p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-[#163364]">عضو إضافي {idx + 1}</p>
                      <button
                        type="button"
                        className={`text-sm font-semibold text-red-600 hover:underline ${icFocus}`}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            participation: {
                              ...f.participation,
                              teamMembers: f.participation.teamMembers.filter((_, i) => i !== idx),
                            },
                          }))
                        }
                      >
                        إزالة
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2" data-field={`participation.teamMembers.${idx}.fullName`}>
                        <label className={icLabelClass}>الاسم الكامل *</label>
                        <input
                          className={icInputClass}
                          value={m.fullName}
                          onChange={(e) =>
                            setForm((f) => {
                              const teamMembers = [...f.participation.teamMembers];
                              teamMembers[idx] = { ...m, fullName: e.target.value };
                              return { ...f, participation: { ...f.participation, teamMembers } };
                            })
                          }
                        />
                        <FieldError
                          message={errors[`participation.teamMembers.${idx}.fullName`]}
                        />
                      </div>
                      {(
                        [
                          ["roleInTeam", "الدور في الفريق"],
                          ["phone", "الهاتف"],
                          ["email", "البريد"],
                          ["birthDate", "تاريخ الميلاد"],
                          ["institutionName", "الجهة"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} data-field={`participation.teamMembers.${idx}.${key}`}>
                          <label className={icLabelClass}>{label}</label>
                          <input
                            type={key === "birthDate" ? "date" : key === "email" ? "email" : "text"}
                            className={icInputClass}
                            value={m[key]}
                            onChange={(e) =>
                              setForm((f) => {
                                const teamMembers = [...f.participation.teamMembers];
                                teamMembers[idx] = { ...m, [key]: e.target.value };
                                return {
                                  ...f,
                                  participation: { ...f.participation, teamMembers },
                                };
                              })
                            }
                            {...(key === "birthDate" ? icDatePickerGuardProps() : {})}
                          />
                          <FieldError
                            message={errors[`participation.teamMembers.${idx}.${key}`]}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {form.participation.teamMembers.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        participation: {
                          ...f.participation,
                          teamMembers: [...f.participation.teamMembers, emptyTeamMember()],
                        },
                      }))
                    }
                    className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-[#31BD9C]/50 bg-white px-4 py-3 text-sm font-bold text-[#163364] hover:bg-[#eef8f5] ${icFocus}`}
                  >
                    <IcIcon name="plus" className="h-4 w-4" />
                    إضافة عضو
                  </button>
                )}
                <FieldError message={errors["participation.teamMembers"]} />
              </div>
            )}

            <fieldset data-field="project.projectStage">
              <legend className={icLabelClass}>مرحلة المشروع *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {IC_STAGE_OPTIONS.map((opt) => {
                  const selected = form.project.projectStage === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        patchProject({ projectStage: opt.value as IcProjectStage })
                      }
                      className={`rounded-2xl border p-5 text-right transition ${icFocus} ${
                        selected
                          ? "border-[#163364] bg-[#eef2f8] ring-2 ring-[#163364]/25"
                          : "border-neutral-200 bg-white hover:border-[#163364]/30"
                      }`}
                      aria-pressed={selected}
                    >
                      <span className="block font-bold text-[#163364]">{opt.title}</span>
                      <span className="mt-1 block text-sm text-neutral-500">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors["project.projectStage"]} />
            </fieldset>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>الملكية الفكرية والمشاركات السابقة</SectionTitle>
              <SectionLead>
                لا يشترط امتلاك براءة اختراع للمشاركة في المؤتمر.
              </SectionLead>
            </div>

            <fieldset data-field="intellectualProperty.shownBefore">
              <legend className={icLabelClass}>هل سبق عرض المشروع؟ *</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {(
                  [
                    [true, "نعم"],
                    [false, "لا"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        intellectualProperty: {
                          ...f.intellectualProperty,
                          shownBefore: val,
                          shownBeforeDetails: val
                            ? f.intellectualProperty.shownBeforeDetails
                            : "",
                        },
                      }))
                    }
                    className={`min-w-[7rem] rounded-xl border px-5 py-3 text-sm font-bold transition ${icFocus} ${
                      form.intellectualProperty.shownBefore === val
                        ? "border-[#31BD9C] bg-[#eef8f5] text-[#163364]"
                        : "border-neutral-200 bg-white text-neutral-600"
                    }`}
                    aria-pressed={form.intellectualProperty.shownBefore === val}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <FieldError message={errors["intellectualProperty.shownBefore"]} />
            </fieldset>

            {form.intellectualProperty.shownBefore === true && (
              <div data-field="intellectualProperty.shownBeforeDetails">
                <label className={icLabelClass} htmlFor="shownBeforeDetails">
                  أين ومتى تم عرض المشروع؟ *
                </label>
                <textarea
                  id="shownBeforeDetails"
                  rows={3}
                  className={`${icInputClass} resize-y`}
                  value={form.intellectualProperty.shownBeforeDetails}
                  maxLength={IC_FIELD_LIMITS.shownBeforeDetails.max}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      intellectualProperty: {
                        ...f.intellectualProperty,
                        shownBeforeDetails: e.target.value,
                      },
                    }))
                  }
                />
                <CharCounter
                  value={form.intellectualProperty.shownBeforeDetails}
                  min={IC_FIELD_LIMITS.shownBeforeDetails.min}
                  max={IC_FIELD_LIMITS.shownBeforeDetails.max}
                />
                <FieldError message={errors["intellectualProperty.shownBeforeDetails"]} />
              </div>
            )}

            <fieldset data-field="intellectualProperty.patentStatus">
              <legend className={icLabelClass}>حالة البراءة *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(Object.keys(IC_PATENT_LABELS) as IcPatentStatus[]).map((status) => {
                  const selected = form.intellectualProperty.patentStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          intellectualProperty: {
                            ...f.intellectualProperty,
                            patentStatus: status,
                            patentNumber:
                              status === "none" ? "" : f.intellectualProperty.patentNumber,
                          },
                          attachments:
                            status === "none"
                              ? { ...f.attachments, patentDocument: null }
                              : f.attachments,
                        }))
                      }
                      className={`rounded-2xl border p-4 text-center font-bold transition ${icFocus} ${
                        selected
                          ? "border-[#163364] bg-[#eef2f8] text-[#163364]"
                          : "border-neutral-200 bg-white text-neutral-600"
                      }`}
                      aria-pressed={selected}
                    >
                      {IC_PATENT_LABELS[status]}
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors["intellectualProperty.patentStatus"]} />
            </fieldset>

            {(form.intellectualProperty.patentStatus === "pending" ||
              form.intellectualProperty.patentStatus === "registered") && (
              <div data-field="intellectualProperty.patentNumber">
                <label className={icLabelClass} htmlFor="patentNumber">
                  رقم البراءة / الطلب *
                </label>
                <input
                  id="patentNumber"
                  className={icInputClass}
                  value={form.intellectualProperty.patentNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      intellectualProperty: {
                        ...f.intellectualProperty,
                        patentNumber: e.target.value,
                      },
                    }))
                  }
                />
                <FieldError message={errors["intellectualProperty.patentNumber"]} />
              </div>
            )}

            <p className="rounded-xl border border-[#31BD9C]/20 bg-[#eef8f5] px-4 py-3 text-sm text-[#163364]">
              لا يشترط امتلاك براءة اختراع للمشاركة في المؤتمر.
            </p>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>المرفقات</SectionTitle>
              <SectionLead>
                ارفع صور المشروع وملف PDF التعريفي. يتم الرفع مباشرة ثم تُربط الملفات عند الإرسال.
              </SectionLead>
            </div>

            <IcFileUploadZone
              kind="image"
              fieldKey="attachments.project_image"
              label="صور المشروع *"
              hint="من 1 إلى 5 صور · JPG / PNG / WEBP · حتى 5MB لكل صورة"
              multiple
              maxFiles={5}
              value={form.attachments.images}
              onChange={(images) =>
                setForm((f) => ({ ...f, attachments: { ...f.attachments, images } }))
              }
              error={errors["attachments.project_image"]}
            />

            <IcFileUploadZone
              kind="pdf"
              fieldKey="attachments.project_pdf"
              label="ملف PDF المشروع *"
              hint="ملف واحد · حتى 10MB"
              maxFiles={1}
              value={form.attachments.projectPdf ? [form.attachments.projectPdf] : []}
              onChange={(files) =>
                setForm((f) => ({
                  ...f,
                  attachments: { ...f.attachments, projectPdf: files[0] ?? null },
                }))
              }
              error={errors["attachments.project_pdf"]}
            />

            {(form.intellectualProperty.patentStatus === "pending" ||
              form.intellectualProperty.patentStatus === "registered") && (
              <IcFileUploadZone
                kind="pdf"
                fieldKey="attachments.patent_document"
                label="مستند البراءة *"
                hint="ملف PDF واحد · حتى 10MB"
                maxFiles={1}
                value={
                  form.attachments.patentDocument ? [form.attachments.patentDocument] : []
                }
                onChange={(files) =>
                  setForm((f) => ({
                    ...f,
                    attachments: { ...f.attachments, patentDocument: files[0] ?? null },
                  }))
                }
                error={errors["attachments.patent_document"]}
              />
            )}

            <div data-field="project.videoUrl">
              <label className={icLabelClass} htmlFor="videoUrl">
                رابط فيديو تعريفي (اختياري)
              </label>
              <input
                id="videoUrl"
                type="url"
                dir="ltr"
                placeholder="https://"
                className={`${icInputClass} text-left`}
                value={form.project.videoUrl}
                maxLength={IC_FIELD_LIMITS.videoUrl.max}
                onChange={(e) => patchProject({ videoUrl: e.target.value })}
              />
              <p className={icHintClass}>يجب أن يكون الرابط بصيغة HTTPS.</p>
              <FieldError message={errors["project.videoUrl"]} />
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>المراجعة والإقرار والإرسال</SectionTitle>
              <SectionLead>راجع بياناتك ثم وافق على الإقرارات قبل الإرسال.</SectionLead>
            </div>

            <SummaryBlock title="بيانات المشارك" onEdit={() => goToStep(1)}>
              <SummaryRow label="الاسم" value={form.applicant.fullName} />
              <SummaryRow label="الميلاد" value={form.applicant.birthDate} />
              <SummaryRow label="المحافظة" value={form.applicant.governorate} />
              <SummaryRow label="الهاتف" value={form.applicant.phone} />
              <SummaryRow label="البريد" value={form.applicant.email} />
              <SummaryRow
                label="الصفة"
                value={
                  form.applicant.applicantRole
                    ? IC_ROLE_LABELS[form.applicant.applicantRole]
                    : "—"
                }
              />
            </SummaryBlock>

            <SummaryBlock title="المشروع" onEdit={() => goToStep(2)}>
              <SummaryRow label="الاسم" value={form.project.projectTitle} />
              <SummaryRow
                label="المجال"
                value={
                  IC_FIELD_OPTIONS.find((f) => f.value === form.project.innovationField)?.title ||
                  "—"
                }
              />
              <SummaryRow label="الملخص" value={form.project.projectSummary} />
            </SummaryBlock>

            <SummaryBlock title="الفريق" onEdit={() => goToStep(3)}>
              <SummaryRow
                label="النوع"
                value={form.participation.participationType === "team" ? "فريق" : "فردي"}
              />
              <SummaryRow
                label="المرحلة"
                value={
                  IC_STAGE_OPTIONS.find((s) => s.value === form.project.projectStage)?.title || "—"
                }
              />
              {form.participation.participationType === "team" && (
                <SummaryRow
                  label="الأعضاء"
                  value={
                    form.participation.teamMembers.map((m) => m.fullName).filter(Boolean).join("، ") ||
                    "—"
                  }
                />
              )}
            </SummaryBlock>

            <SummaryBlock title="الملكية الفكرية" onEdit={() => goToStep(4)}>
              <SummaryRow
                label="عُرض سابقاً"
                value={
                  form.intellectualProperty.shownBefore === null
                    ? "—"
                    : form.intellectualProperty.shownBefore
                      ? "نعم"
                      : "لا"
                }
              />
              <SummaryRow
                label="البراءة"
                value={
                  form.intellectualProperty.patentStatus
                    ? IC_PATENT_LABELS[form.intellectualProperty.patentStatus]
                    : "—"
                }
              />
            </SummaryBlock>

            <SummaryBlock title="المرفقات" onEdit={() => goToStep(5)}>
              <SummaryRow
                label="الصور"
                value={`${form.attachments.images.length} ملف(ات)`}
              />
              <SummaryRow
                label="PDF"
                value={form.attachments.projectPdf?.fileName || "—"}
              />
              {(form.intellectualProperty.patentStatus === "pending" ||
                form.intellectualProperty.patentStatus === "registered") && (
                <SummaryRow
                  label="مستند البراءة"
                  value={form.attachments.patentDocument?.fileName || "—"}
                />
              )}
              {form.project.videoUrl && (
                <SummaryRow label="فيديو" value={form.project.videoUrl} />
              )}
            </SummaryBlock>

            <fieldset data-field="consents" className="space-y-3 rounded-2xl border border-neutral-200 bg-[#F7FAF9] p-5">
              <legend className="px-1 text-sm font-bold text-[#163364]">الإقرارات *</legend>
              {(
                [
                  ["accuracy", "أقر بصحة المعلومات المدخلة."],
                  ["ownership", "أقر بملكية المشروع أو حقي القانوني في تقديمه."],
                  ["terms", "أوافق على شروط المشاركة في المؤتمر."],
                  [
                    "media",
                    "أوافق على استخدام الصور والمعلومات العامة لأغراض المؤتمر والتغطية الإعلامية وفق سياسة الكلية.",
                  ],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-neutral-700">
                  <input
                    type="checkbox"
                    className={`mt-1 h-4 w-4 rounded border-neutral-300 text-[#31BD9C] ${icFocus}`}
                    checked={form.consents[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        consents: { ...f.consents, [key]: e.target.checked },
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
              <FieldError message={errors["consents"]} />
            </fieldset>

            {submitError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
                <p className="mt-1 text-xs text-red-600/80">بياناتك محفوظة محلياً ويمكنك إعادة المحاولة.</p>
              </div>
            )}
          </section>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || submitState === "loading"}
            className={`rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-[#163364] disabled:opacity-40 ${icFocus}`}
          >
            السابق
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              className={`rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] hover:brightness-105 ${icFocus}`}
            >
              التالي
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === "loading"}
              className={`rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] hover:brightness-105 disabled:opacity-70 ${icFocus}`}
            >
              {submitState === "loading" ? "جاري إرسال طلبك..." : "إرسال طلب المشاركة"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SummaryBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
        <h3 className="font-bold text-[#163364]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className={`text-sm font-semibold text-[#187c67] hover:underline ${icFocus}`}
        >
          تعديل
        </button>
      </div>
      <div className="space-y-2 px-4 py-4 sm:px-5">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-800 break-words">{value || "—"}</dd>
    </div>
  );
}

function SuccessPanel({
  data,
  onDone,
}: {
  data: IcSuccessPayload;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div dir="rtl" className="overflow-x-hidden bg-white print:bg-white">
      <div className="bg-[#061528] px-4 py-12 text-white sm:px-6 print:bg-white print:text-black">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#31BD9C] text-[#061528] print:border print:border-neutral-300">
            <IcIcon name="check" className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">تم استلام طلبك بنجاح</h1>
          <p className="mt-3 text-sm text-white/70 print:text-neutral-600">
            احتفظ بمعلومات المتابعة أدناه في مكان آمن.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6" id="ic-success-print">
        <div className="space-y-3 rounded-2xl border border-neutral-100 bg-[#F7FAF9] p-5">
          <SuccessRow label="رقم المشاركة" value={data.participationCode} />
          <SuccessRow label="اسم المشروع" value={data.projectTitle} />
          <SuccessRow label="الحالة" value="تم الاستلام" />
          <div>
            <p className="text-xs font-semibold text-neutral-500">رمز المتابعة</p>
            <p
              className="mt-1 break-all font-mono text-2xl font-extrabold tracking-wider text-[#163364] sm:text-3xl"
              dir="ltr"
            >
              {data.trackingToken}
            </p>
          </div>
        </div>

        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          احفظ رمز المتابعة الآن، لأنه لن يُعرض لك مرة أخرى بهذه الصيغة.
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => void copy("code", data.participationCode)}
          >
            {copied === "code" ? "تم النسخ" : "نسخ رقم المشاركة"}
          </button>
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => void copy("token", data.trackingToken)}
          >
            {copied === "token" ? "تم النسخ" : "نسخ رمز المتابعة"}
          </button>
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => window.print()}
          >
            طباعة
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2 print:hidden sm:flex-row">
          <Link
            href="/ar/innovation-conference/track"
            className={`rounded-xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-semibold text-[#163364] ${icFocus}`}
          >
            متابعة الطلب
          </Link>
          <Link
            href="/ar/innovation-conference"
            onClick={onDone}
            className={`rounded-xl bg-[#31BD9C] px-5 py-3 text-center text-sm font-bold text-[#061528] ${icFocus}`}
          >
            العودة إلى صفحة المؤتمر
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p
        className={`mt-0.5 break-all text-sm font-bold text-[#163364] ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
