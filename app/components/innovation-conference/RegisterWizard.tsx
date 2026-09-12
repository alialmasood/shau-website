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
  localizeServerFieldErrors,
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
  IC_IRAQI_GOVERNORATES,
  icUi,
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

type IcLocale = "ar" | "en";

/** رسائل أخطاء الخادم تعود بالعربية، لذا نعرض مقابلها الإنجليزي بحسب الرمز. */
const EN_ERROR_BY_CODE: Record<string, string> = {
  VALIDATION_ERROR: "Please review the details you entered.",
  INVALID_ATTACHMENTS: "The attachments are not valid.",
  REGISTRATION_CLOSED: "Conference registration is not available at the moment.",
  RATE_LIMITED: "You have exceeded the number of allowed attempts. Please try again later.",
  SUBMISSION_FAILED: "The application could not be sent. Please try again.",
};

/** كل النصوص الظاهرة في المعالج بحسب اللغة (القيم المرسلة للخادم لا تتغير). */
const WIZARD_COPY = {
  ar: {
    loading: "جاري التحميل...",
    closedHeading: "التسجيل لم يُفتح بعد",
    backToConference: "العودة إلى صفحة المؤتمر",
    eyebrow: "تسجيل المشاركين",
    heading: "سجّل ابتكارك",
    lead: "أكمل الخطوات التالية لإرسال مشروعك للمشاركة في مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026.",
    badge: "6 خطوات • يستغرق تقريباً 10–15 دقيقة",
    draftFound: "وجدنا بيانات تسجيل غير مكتملة.",
    draftResume: "استكمال التسجيل",
    draftFresh: "بدء تسجيل جديد",
    stepOf: (n: number) => `الخطوة ${n} من 6`,
    prev: "السابق",
    next: "التالي",
    submit: "إرسال طلب المشاركة",
    submitting: "جاري إرسال طلبك...",
    edit: "تعديل",
    submitFailed: "تعذر إرسال الطلب. حاول مرة أخرى.",
    networkFailed: "تعذر الاتصال بالخادم. بياناتك محفوظة محلياً.",
    successHeading: "تم استلام طلبك بنجاح",
    successLead: "احتفظ بمعلومات المتابعة أدناه في مكان آمن.",
    successCode: "رقم المشاركة",
    successProject: "اسم المشروع",
    successStatus: "الحالة",
    successStatusValue: "تم الاستلام",
    successToken: "رمز المتابعة",
    successWarning: "احفظ رمز المتابعة الآن، لأنه لن يُعرض لك مرة أخرى بهذه الصيغة.",
    copied: "تم النسخ",
    copyCode: "نسخ رقم المشاركة",
    copyToken: "نسخ رمز المتابعة",
    print: "طباعة",
    track: "متابعة الطلب",
    honeypot: "الموقع",
    s1: {
      title: "بيانات المشارك",
      lead: "أدخل بياناتك الشخصية وبيانات التواصل بدقة.",
      fullName: "الاسم الكامل *",
      birthDate: "تاريخ الميلاد *",
      ageKnown: (age: number, eventDate: string) =>
        `العمر يوم المؤتمر (${eventDate}): حوالي ${age} سنة`,
      ageHint: (eventDate: string) => `يُحسب العمر بالنسبة لتاريخ المؤتمر ${eventDate}`,
      gender: "الجنس (اختياري)",
      governorate: "المحافظة *",
      governoratePlaceholder: "اختر المحافظة",
      phone: "رقم الهاتف *",
      email: "البريد الإلكتروني *",
      role: "الصفة *",
      rolePlaceholder: "اختر الصفة",
      institution: "اسم المدرسة/الجامعة/المؤسسة",
      stageOrMajor: "المرحلة / التخصص",
    },
    s2: {
      title: "بيانات المشروع",
      lead: "صف مشروعك بوضوح ليتمكن المقيّمون من فهم فكرته وأثره.",
      projectTitle: "اسم المشروع *",
      innovationField: "مجال الابتكار *",
      projectSummary: "وصف مختصر *",
      problem: "المشكلة التي يعالجها *",
      solution: "الحل المقترح *",
      novelty: "الجانب المبتكر / الجديد *",
      beneficiaries: "الفئة المستفيدة *",
      expectedImpact: "الأثر المتوقع على المجتمع *",
    },
    s3: {
      title: "الفريق ومرحلة المشروع",
      lead: "حدد نوع المشاركة ومرحلة نضج مشروعك.",
      participationType: "نوع المشاركة *",
      individual: "فردي",
      individualDesc: "تقديم المشروع باسمك كمشارك فردي.",
      team: "فريق",
      teamDesc: "أنت القائد مع حتى 3 أعضاء إضافيين.",
      leader: "قائد الفريق",
      leaderEmpty: "— أكمل بيانات الخطوة 1",
      member: (n: number) => `عضو إضافي ${n}`,
      remove: "إزالة",
      memberFullName: "الاسم الكامل *",
      memberRoleInTeam: "الدور في الفريق",
      memberPhone: "الهاتف",
      memberEmail: "البريد",
      memberBirthDate: "تاريخ الميلاد",
      memberInstitutionName: "الجهة",
      addMember: "إضافة عضو",
      projectStage: "مرحلة المشروع *",
    },
    s4: {
      title: "الملكية الفكرية والمشاركات السابقة",
      lead: "لا يشترط امتلاك براءة اختراع للمشاركة في المؤتمر.",
      shownBefore: "هل سبق عرض المشروع؟ *",
      yes: "نعم",
      no: "لا",
      shownBeforeDetails: "أين ومتى تم عرض المشروع؟ *",
      patentStatus: "حالة البراءة *",
      patentNumber: "رقم البراءة / الطلب *",
      patentNote: "لا يشترط امتلاك براءة اختراع للمشاركة في المؤتمر.",
    },
    s5: {
      title: "المرفقات",
      lead: "ارفع صور المشروع وملف PDF التعريفي. يتم الرفع مباشرة ثم تُربط الملفات عند الإرسال.",
      images: "صور المشروع *",
      imagesHint: "من 1 إلى 5 صور · JPG / PNG / WEBP · حتى 5MB لكل صورة",
      projectPdf: "ملف PDF المشروع *",
      projectPdfHint: "ملف واحد · حتى 10MB",
      patentDocument: "مستند البراءة *",
      patentDocumentHint: "ملف PDF واحد · حتى 10MB",
      videoUrl: "رابط فيديو تعريفي (اختياري)",
      videoUrlHint: "يجب أن يكون الرابط بصيغة HTTPS.",
    },
    s6: {
      title: "المراجعة والإقرار والإرسال",
      lead: "راجع بياناتك ثم وافق على الإقرارات قبل الإرسال.",
      applicantBlock: "بيانات المشارك",
      projectBlock: "المشروع",
      teamBlock: "الفريق",
      ipBlock: "الملكية الفكرية",
      attachmentsBlock: "المرفقات",
      name: "الاسم",
      birthDate: "الميلاد",
      governorate: "المحافظة",
      phone: "الهاتف",
      email: "البريد",
      role: "الصفة",
      field: "المجال",
      summary: "الملخص",
      type: "النوع",
      stage: "المرحلة",
      members: "الأعضاء",
      membersSeparator: "، ",
      shownBefore: "عُرض سابقاً",
      patent: "البراءة",
      images: "الصور",
      pdf: "PDF",
      patentDocument: "مستند البراءة",
      video: "فيديو",
      filesCount: (n: number) => `${n} ملف(ات)`,
      yes: "نعم",
      no: "لا",
      consentsLegend: "الإقرارات *",
      consentAccuracy: "أقر بصحة المعلومات المدخلة.",
      consentOwnership: "أقر بملكية المشروع أو حقي القانوني في تقديمه.",
      consentTerms: "أوافق على شروط المشاركة في المؤتمر.",
      consentMedia:
        "أوافق على استخدام الصور والمعلومات العامة لأغراض المؤتمر والتغطية الإعلامية وفق سياسة الكلية.",
      submitErrorNote: "بياناتك محفوظة محلياً ويمكنك إعادة المحاولة.",
    },
  },
  en: {
    loading: "Loading...",
    closedHeading: "Registration is not open yet",
    backToConference: "Back to the conference page",
    eyebrow: "Participant registration",
    heading: "Register your innovation",
    lead: "Complete the following steps to submit your project to the First Al-Sharq International Conference on Innovation & Creativity 2026.",
    badge: "6 steps • takes about 10–15 minutes",
    draftFound: "We found an incomplete registration.",
    draftResume: "Resume registration",
    draftFresh: "Start a new registration",
    stepOf: (n: number) => `Step ${n} of 6`,
    prev: "Previous",
    next: "Next",
    submit: "Submit application",
    submitting: "Submitting your application...",
    edit: "Edit",
    submitFailed: "The application could not be sent. Please try again.",
    networkFailed: "Could not reach the server. Your data is saved locally.",
    successHeading: "Your application has been received",
    successLead: "Keep the follow-up details below in a safe place.",
    successCode: "Participation number",
    successProject: "Project name",
    successStatus: "Status",
    successStatusValue: "Received",
    successToken: "Tracking code",
    successWarning: "Save the tracking code now — it will not be shown to you again in this form.",
    copied: "Copied",
    copyCode: "Copy participation number",
    copyToken: "Copy tracking code",
    print: "Print",
    track: "Track application",
    honeypot: "Website",
    s1: {
      title: "Participant details",
      lead: "Enter your personal and contact details accurately.",
      fullName: "Full name *",
      birthDate: "Date of birth *",
      ageKnown: (age: number, eventDate: string) =>
        `Age on the conference date (${eventDate}): about ${age} years`,
      ageHint: (eventDate: string) =>
        `Age is calculated as of the conference date ${eventDate}`,
      gender: "Gender (optional)",
      governorate: "Governorate *",
      governoratePlaceholder: "Select a governorate",
      phone: "Phone number *",
      email: "Email address *",
      role: "Role *",
      rolePlaceholder: "Select a role",
      institution: "School / university / institution name",
      stageOrMajor: "Grade / major",
    },
    s2: {
      title: "Project details",
      lead: "Describe your project clearly so reviewers can understand its idea and impact.",
      projectTitle: "Project name *",
      innovationField: "Innovation field *",
      projectSummary: "Brief description *",
      problem: "Problem it addresses *",
      solution: "Proposed solution *",
      novelty: "Innovative / novel aspect *",
      beneficiaries: "Target beneficiaries *",
      expectedImpact: "Expected impact on society *",
    },
    s3: {
      title: "Team and project stage",
      lead: "Choose your participation type and how mature your project is.",
      participationType: "Participation type *",
      individual: "Individual",
      individualDesc: "Submit the project in your own name as an individual participant.",
      team: "Team",
      teamDesc: "You are the leader, with up to 3 additional members.",
      leader: "Team leader",
      leaderEmpty: "— Complete the details in step 1",
      member: (n: number) => `Additional member ${n}`,
      remove: "Remove",
      memberFullName: "Full name *",
      memberRoleInTeam: "Role in team",
      memberPhone: "Phone",
      memberEmail: "Email",
      memberBirthDate: "Date of birth",
      memberInstitutionName: "Institution",
      addMember: "Add member",
      projectStage: "Project stage *",
    },
    s4: {
      title: "Intellectual property and previous participation",
      lead: "A patent is not required to take part in the conference.",
      shownBefore: "Has the project been presented before? *",
      yes: "Yes",
      no: "No",
      shownBeforeDetails: "Where and when was the project presented? *",
      patentStatus: "Patent status *",
      patentNumber: "Patent / application number *",
      patentNote: "A patent is not required to take part in the conference.",
    },
    s5: {
      title: "Attachments",
      lead: "Upload your project images and the introductory PDF. Files are uploaded immediately and linked to your application when you submit.",
      images: "Project images *",
      imagesHint: "1 to 5 images · JPG / PNG / WEBP · up to 5MB each",
      projectPdf: "Project PDF file *",
      projectPdfHint: "One file · up to 10MB",
      patentDocument: "Patent document *",
      patentDocumentHint: "One PDF file · up to 10MB",
      videoUrl: "Introductory video link (optional)",
      videoUrlHint: "The link must use HTTPS.",
    },
    s6: {
      title: "Review, declarations and submit",
      lead: "Review your details, then agree to the declarations before submitting.",
      applicantBlock: "Participant details",
      projectBlock: "Project",
      teamBlock: "Team",
      ipBlock: "Intellectual property",
      attachmentsBlock: "Attachments",
      name: "Name",
      birthDate: "Date of birth",
      governorate: "Governorate",
      phone: "Phone",
      email: "Email",
      role: "Role",
      field: "Field",
      summary: "Summary",
      type: "Type",
      stage: "Stage",
      members: "Members",
      membersSeparator: ", ",
      shownBefore: "Presented before",
      patent: "Patent",
      images: "Images",
      pdf: "PDF",
      patentDocument: "Patent document",
      video: "Video",
      filesCount: (n: number) => `${n} file(s)`,
      yes: "Yes",
      no: "No",
      consentsLegend: "Declarations *",
      consentAccuracy: "I declare that the information entered is accurate.",
      consentOwnership:
        "I declare that I own the project or have the legal right to submit it.",
      consentTerms: "I agree to the conference participation terms.",
      consentMedia:
        "I agree to the use of images and public information for conference purposes and media coverage in line with the college policy.",
      submitErrorNote: "Your data is saved locally and you can try again.",
    },
  },
} as const;

type Props = {
  registrationOpen: boolean;
  eventDate: string;
  title: string;
  locale?: IcLocale;
};

export default function RegisterWizard({ registrationOpen, eventDate, locale = "ar" }: Props) {
  const t = WIZARD_COPY[locale];
  const ui = icUi(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const conferenceHref = `/${locale}/innovation-conference`;
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
    const errs = validateStep(step, form, locale);
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
      const errs = validateStep(step, form, locale);
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

    const errs = validateAllSteps(form, locale);
    setErrors(errs);
    if (Object.keys(errs).length) {
      for (let s = 1; s <= 6; s++) {
        const stepErrs = validateStep(s, form, locale);
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
        if (json.error?.fields) {
          setErrors(localizeServerFieldErrors(json.error.fields, form, locale));
        }
        setSubmitState("error");
        setSubmitError(
          locale === "en"
            ? (json.error?.code && EN_ERROR_BY_CODE[json.error.code]) || t.submitFailed
            : json.error?.message || t.submitFailed
        );
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
      setSubmitError(t.networkFailed);
    } finally {
      submittingRef.current = false;
    }
  };

  if (!bootstrapped) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-neutral-500">
        {t.loading}
      </div>
    );
  }

  if (!registrationOpen && !success) {
    return (
      <div dir={dir} className="overflow-x-hidden bg-white">
        <div className="bg-[#061528] px-4 py-14 text-center text-white">
          <h1 className="text-3xl font-extrabold">{t.closedHeading}</h1>
          <Link
            href={conferenceHref}
            className={`mt-8 inline-flex rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] ${icFocus}`}
          >
            {t.backToConference}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <SuccessPanel
        data={success}
        locale={locale}
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
    <div dir={dir} className="overflow-x-hidden bg-white text-neutral-800">
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
          <p className="text-sm font-bold text-[#31BD9C]">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.heading}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {t.lead}
          </p>
          <span className="mt-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 sm:text-sm">
            {t.badge}
          </span>
        </div>
      </header>

      {draftPrompt && (
        <div className="border-b border-[#31BD9C]/25 bg-[#eef8f5]">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-[#163364]">{t.draftFound}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resumeDraft}
                className={`rounded-xl bg-[#31BD9C] px-4 py-2 text-sm font-bold text-[#061528] ${icFocus}`}
              >
                {t.draftResume}
              </button>
              <button
                type="button"
                onClick={startFresh}
                className={`rounded-xl border border-[#163364]/20 bg-white px-4 py-2 text-sm font-semibold text-[#163364] ${icFocus}`}
              >
                {t.draftFresh}
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
              <span className="text-[#31BD9C]">{t.stepOf(step)}</span>
              <span className="text-[#163364]">{ui.stepLabels[step - 1]}</span>
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
            {ui.stepLabels.map((label, i) => {
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
                    className={`flex w-full flex-col items-start gap-1 rounded-xl px-2 py-2 text-start transition ${
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
            {t.honeypot}
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
              <SectionTitle>{t.s1.title}</SectionTitle>
              <SectionLead>{t.s1.lead}</SectionLead>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2" data-field="applicant.fullName">
                <label className={icLabelClass} htmlFor="fullName">
                  {t.s1.fullName}
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
                  {t.s1.birthDate}
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
                  {age != null ? t.s1.ageKnown(age, eventDate) : t.s1.ageHint(eventDate)}
                </p>
                <FieldError message={errors["applicant.birthDate"]} />
              </div>

              <div data-field="applicant.gender">
                <label className={icLabelClass} htmlFor="gender">
                  {t.s1.gender}
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
                  {(Object.keys(ui.genderLabels) as IcGender[]).map((g) => (
                    <option key={g} value={g}>
                      {ui.genderLabels[g]}
                    </option>
                  ))}
                </select>
              </div>

              <div data-field="applicant.governorate">
                <label className={icLabelClass} htmlFor="governorate">
                  {t.s1.governorate}
                </label>
                <select
                  id="governorate"
                  className={icInputClass}
                  value={form.applicant.governorate}
                  onChange={(e) => patchApplicant({ governorate: e.target.value })}
                  aria-invalid={!!errors["applicant.governorate"]}
                >
                  <option value="">{t.s1.governoratePlaceholder}</option>
                  {IC_IRAQI_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {ui.governorateLabel(g)}
                    </option>
                  ))}
                </select>
                <FieldError message={errors["applicant.governorate"]} />
              </div>

              <div data-field="applicant.phone">
                <label className={icLabelClass} htmlFor="phone">
                  {t.s1.phone}
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
                  {t.s1.email}
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
                  {t.s1.role}
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
                  <option value="">{t.s1.rolePlaceholder}</option>
                  {IC_APPLICANT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ui.roleLabels[r]}
                    </option>
                  ))}
                </select>
                <FieldError message={errors["applicant.applicantRole"]} />
              </div>

              <div data-field="applicant.institutionName">
                <label className={icLabelClass} htmlFor="institutionName">
                  {t.s1.institution}
                  {needsInst ? " *" : ""}
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
                  {t.s1.stageOrMajor}
                  {needsInst ? " *" : ""}
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
              <SectionTitle>{t.s2.title}</SectionTitle>
              <SectionLead>{t.s2.lead}</SectionLead>
            </div>

            <div data-field="project.projectTitle">
              <label className={icLabelClass} htmlFor="projectTitle">
                {t.s2.projectTitle}
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
                locale={locale}
              />
              <FieldError message={errors["project.projectTitle"]} />
            </div>

            <fieldset data-field="project.innovationField">
              <legend className={icLabelClass}>{t.s2.innovationField}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ui.fieldOptions.map((opt) => {
                  const selected = form.project.innovationField === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        patchProject({ innovationField: opt.value as IcInnovationField })
                      }
                      className={`rounded-2xl border p-4 text-start transition ${icFocus} ${
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
                ["projectSummary", t.s2.projectSummary, IC_FIELD_LIMITS.projectSummary],
                ["problem", t.s2.problem, IC_FIELD_LIMITS.problem],
                ["solution", t.s2.solution, IC_FIELD_LIMITS.solution],
                ["novelty", t.s2.novelty, IC_FIELD_LIMITS.novelty],
                ["beneficiaries", t.s2.beneficiaries, IC_FIELD_LIMITS.beneficiaries],
                ["expectedImpact", t.s2.expectedImpact, IC_FIELD_LIMITS.expectedImpact],
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
                <CharCounter
                  value={form.project[key]}
                  min={lim.min}
                  max={lim.max}
                  locale={locale}
                />
                <FieldError message={errors[`project.${key}`]} />
              </div>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>{t.s3.title}</SectionTitle>
              <SectionLead>{t.s3.lead}</SectionLead>
            </div>

            <fieldset data-field="participation.participationType">
              <legend className={icLabelClass}>{t.s3.participationType}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["individual", t.s3.individual, t.s3.individualDesc],
                    ["team", t.s3.team, t.s3.teamDesc],
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
                      className={`rounded-2xl border p-5 text-start transition ${icFocus} ${
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
                  <p className="text-xs font-bold text-[#31BD9C]">{t.s3.leader}</p>
                  <p className="mt-1 font-bold text-[#163364]">
                    {form.applicant.fullName || t.s3.leaderEmpty}
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
                      <p className="font-bold text-[#163364]">{t.s3.member(idx + 1)}</p>
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
                        {t.s3.remove}
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2" data-field={`participation.teamMembers.${idx}.fullName`}>
                        <label className={icLabelClass}>{t.s3.memberFullName}</label>
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
                          ["roleInTeam", t.s3.memberRoleInTeam],
                          ["phone", t.s3.memberPhone],
                          ["email", t.s3.memberEmail],
                          ["birthDate", t.s3.memberBirthDate],
                          ["institutionName", t.s3.memberInstitutionName],
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
                    {t.s3.addMember}
                  </button>
                )}
                <FieldError message={errors["participation.teamMembers"]} />
              </div>
            )}

            <fieldset data-field="project.projectStage">
              <legend className={icLabelClass}>{t.s3.projectStage}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ui.stageOptions.map((opt) => {
                  const selected = form.project.projectStage === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        patchProject({ projectStage: opt.value as IcProjectStage })
                      }
                      className={`rounded-2xl border p-5 text-start transition ${icFocus} ${
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
              <SectionTitle>{t.s4.title}</SectionTitle>
              <SectionLead>{t.s4.lead}</SectionLead>
            </div>

            <fieldset data-field="intellectualProperty.shownBefore">
              <legend className={icLabelClass}>{t.s4.shownBefore}</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {(
                  [
                    [true, t.s4.yes],
                    [false, t.s4.no],
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
                  {t.s4.shownBeforeDetails}
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
                  locale={locale}
                />
                <FieldError message={errors["intellectualProperty.shownBeforeDetails"]} />
              </div>
            )}

            <fieldset data-field="intellectualProperty.patentStatus">
              <legend className={icLabelClass}>{t.s4.patentStatus}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(Object.keys(ui.patentLabels) as IcPatentStatus[]).map((status) => {
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
                      {ui.patentLabels[status]}
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
                  {t.s4.patentNumber}
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
              {t.s4.patentNote}
            </p>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>{t.s5.title}</SectionTitle>
              <SectionLead>{t.s5.lead}</SectionLead>
            </div>

            <IcFileUploadZone
              kind="image"
              fieldKey="attachments.project_image"
              label={t.s5.images}
              hint={t.s5.imagesHint}
              locale={locale}
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
              label={t.s5.projectPdf}
              hint={t.s5.projectPdfHint}
              locale={locale}
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
                label={t.s5.patentDocument}
                hint={t.s5.patentDocumentHint}
                locale={locale}
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
                {t.s5.videoUrl}
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
              <p className={icHintClass}>{t.s5.videoUrlHint}</p>
              <FieldError message={errors["project.videoUrl"]} />
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="space-y-8">
            <div>
              <SectionTitle>{t.s6.title}</SectionTitle>
              <SectionLead>{t.s6.lead}</SectionLead>
            </div>

            <SummaryBlock title={t.s6.applicantBlock} editLabel={t.edit} onEdit={() => goToStep(1)}>
              <SummaryRow label={t.s6.name} value={form.applicant.fullName} />
              <SummaryRow label={t.s6.birthDate} value={form.applicant.birthDate} />
              <SummaryRow
                label={t.s6.governorate}
                value={
                  form.applicant.governorate
                    ? ui.governorateLabel(form.applicant.governorate)
                    : ""
                }
              />
              <SummaryRow label={t.s6.phone} value={form.applicant.phone} />
              <SummaryRow label={t.s6.email} value={form.applicant.email} />
              <SummaryRow
                label={t.s6.role}
                value={
                  form.applicant.applicantRole
                    ? ui.roleLabels[form.applicant.applicantRole]
                    : "—"
                }
              />
            </SummaryBlock>

            <SummaryBlock title={t.s6.projectBlock} editLabel={t.edit} onEdit={() => goToStep(2)}>
              <SummaryRow label={t.s6.name} value={form.project.projectTitle} />
              <SummaryRow
                label={t.s6.field}
                value={
                  ui.fieldOptions.find((f) => f.value === form.project.innovationField)?.title ||
                  "—"
                }
              />
              <SummaryRow label={t.s6.summary} value={form.project.projectSummary} />
            </SummaryBlock>

            <SummaryBlock title={t.s6.teamBlock} editLabel={t.edit} onEdit={() => goToStep(3)}>
              <SummaryRow
                label={t.s6.type}
                value={
                  form.participation.participationType === "team" ? t.s3.team : t.s3.individual
                }
              />
              <SummaryRow
                label={t.s6.stage}
                value={
                  ui.stageOptions.find((s) => s.value === form.project.projectStage)?.title || "—"
                }
              />
              {form.participation.participationType === "team" && (
                <SummaryRow
                  label={t.s6.members}
                  value={
                    form.participation.teamMembers
                      .map((m) => m.fullName)
                      .filter(Boolean)
                      .join(t.s6.membersSeparator) || "—"
                  }
                />
              )}
            </SummaryBlock>

            <SummaryBlock title={t.s6.ipBlock} editLabel={t.edit} onEdit={() => goToStep(4)}>
              <SummaryRow
                label={t.s6.shownBefore}
                value={
                  form.intellectualProperty.shownBefore === null
                    ? "—"
                    : form.intellectualProperty.shownBefore
                      ? t.s6.yes
                      : t.s6.no
                }
              />
              <SummaryRow
                label={t.s6.patent}
                value={
                  form.intellectualProperty.patentStatus
                    ? ui.patentLabels[form.intellectualProperty.patentStatus]
                    : "—"
                }
              />
            </SummaryBlock>

            <SummaryBlock
              title={t.s6.attachmentsBlock}
              editLabel={t.edit}
              onEdit={() => goToStep(5)}
            >
              <SummaryRow
                label={t.s6.images}
                value={t.s6.filesCount(form.attachments.images.length)}
              />
              <SummaryRow
                label={t.s6.pdf}
                value={form.attachments.projectPdf?.fileName || "—"}
              />
              {(form.intellectualProperty.patentStatus === "pending" ||
                form.intellectualProperty.patentStatus === "registered") && (
                <SummaryRow
                  label={t.s6.patentDocument}
                  value={form.attachments.patentDocument?.fileName || "—"}
                />
              )}
              {form.project.videoUrl && (
                <SummaryRow label={t.s6.video} value={form.project.videoUrl} />
              )}
            </SummaryBlock>

            <fieldset data-field="consents" className="space-y-3 rounded-2xl border border-neutral-200 bg-[#F7FAF9] p-5">
              <legend className="px-1 text-sm font-bold text-[#163364]">
                {t.s6.consentsLegend}
              </legend>
              {(
                [
                  ["accuracy", t.s6.consentAccuracy],
                  ["ownership", t.s6.consentOwnership],
                  ["terms", t.s6.consentTerms],
                  ["media", t.s6.consentMedia],
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
                <p className="mt-1 text-xs text-red-600/80">{t.s6.submitErrorNote}</p>
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
            {t.prev}
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              className={`rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] hover:brightness-105 ${icFocus}`}
            >
              {t.next}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === "loading"}
              className={`rounded-xl bg-[#31BD9C] px-6 py-3 text-sm font-bold text-[#061528] hover:brightness-105 disabled:opacity-70 ${icFocus}`}
            >
              {submitState === "loading" ? t.submitting : t.submit}
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
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
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
          {editLabel}
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
  locale = "ar",
}: {
  data: IcSuccessPayload;
  onDone: () => void;
  locale?: IcLocale;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const t = WIZARD_COPY[locale];
  // صفحة متابعة الطلب متاحة بالعربية فقط حالياً.
  const trackHref = "/ar/innovation-conference/track";

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
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="overflow-x-hidden bg-white print:bg-white">
      <div className="bg-[#061528] px-4 py-12 text-white sm:px-6 print:bg-white print:text-black">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#31BD9C] text-[#061528] print:border print:border-neutral-300">
            <IcIcon name="check" className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.successHeading}</h1>
          <p className="mt-3 text-sm text-white/70 print:text-neutral-600">{t.successLead}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6" id="ic-success-print">
        <div className="space-y-3 rounded-2xl border border-neutral-100 bg-[#F7FAF9] p-5">
          <SuccessRow label={t.successCode} value={data.participationCode} />
          <SuccessRow label={t.successProject} value={data.projectTitle} />
          <SuccessRow label={t.successStatus} value={t.successStatusValue} />
          <div>
            <p className="text-xs font-semibold text-neutral-500">{t.successToken}</p>
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
          {t.successWarning}
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => void copy("code", data.participationCode)}
          >
            {copied === "code" ? t.copied : t.copyCode}
          </button>
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => void copy("token", data.trackingToken)}
          >
            {copied === "token" ? t.copied : t.copyToken}
          </button>
          <button
            type="button"
            className={`rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#163364] ${icFocus}`}
            onClick={() => window.print()}
          >
            {t.print}
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-2 print:hidden sm:flex-row">
          <Link
            href={trackHref}
            className={`rounded-xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-semibold text-[#163364] ${icFocus}`}
          >
            {t.track}
          </Link>
          <Link
            href={`/${locale}/innovation-conference`}
            onClick={onDone}
            className={`rounded-xl bg-[#31BD9C] px-5 py-3 text-center text-sm font-bold text-[#061528] ${icFocus}`}
          >
            {t.backToConference}
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
