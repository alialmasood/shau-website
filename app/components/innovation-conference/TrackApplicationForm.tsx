"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { IcApplicationStatus } from "@/lib/innovationConferenceTypes";
import {
  getStatusPublicCopy,
  getTrackProgressVisual,
  IC_TRACK_PROGRESS_STEPS,
} from "@/lib/innovationConferenceStatus";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31BD9C] focus-visible:ring-offset-2";

const inputClass =
  `w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition hover:border-neutral-300 focus:border-[#31BD9C] ${focus}`;

type TrackResult = {
  participationCode: string;
  projectTitle: string;
  status: IcApplicationStatus;
  statusTitle: string;
  statusMessage: string;
  submittedAt: string;
  updatedAt: string;
};

function formatArDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const toneBadge: Record<string, string> = {
  info: "bg-[#eef2f8] text-[#163364]",
  success: "bg-[#eef8f5] text-[#187c67]",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-neutral-100 text-neutral-700",
  neutral: "bg-neutral-100 text-neutral-600",
};

export default function TrackApplicationForm() {
  const formId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const [participationCode, setParticipationCode] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const resetToForm = () => {
    setResult(null);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/innovation-conference/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participationCode,
          trackingToken,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        application?: TrackResult;
        error?: { message?: string; code?: string };
      };

      if (res.status === 429) {
        setError(
          json.error?.message ||
            "تم إجراء عدد كبير من محاولات التحقق. حاول مرة أخرى لاحقاً."
        );
        return;
      }

      if (!res.ok || !json.ok || !json.application) {
        if (res.status >= 500) {
          setError(
            json.error?.message ||
              "تعذر التحقق من حالة الطلب حالياً. حاول مرة أخرى بعد قليل."
          );
        } else {
          setError(
            json.error?.message ||
              "تعذر التحقق من بيانات المتابعة. تأكد من رقم المشاركة ورمز المتابعة."
          );
        }
        return;
      }

      setResult(json.application);
    } catch {
      setError("تعذر التحقق من حالة الطلب حالياً. حاول مرة أخرى بعد قليل.");
    } finally {
      setLoading(false);
    }
  };

  const copy = result ? getStatusPublicCopy(result.status) : null;
  const progress = result ? getTrackProgressVisual(result.status) : null;

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
        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="text-sm font-bold text-[#31BD9C]">متابعة المشاركة</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            تابع حالة طلبك
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            أدخل رقم المشاركة ورمز المتابعة الذي حصلت عليه عند إرسال الطلب.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {!result ? (
          <>
            <form
              onSubmit={onSubmit}
              className="space-y-5"
              aria-describedby={`${formId}-help`}
              noValidate
            >
              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-[#163364]"
                  htmlFor={`${formId}-code`}
                >
                  رقم المشاركة
                </label>
                <input
                  id={`${formId}-code`}
                  name="participationCode"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="IC26-12345678"
                  className={`${inputClass} text-left font-mono`}
                  value={participationCode}
                  onChange={(e) => setParticipationCode(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${formId}-error` : `${formId}-help`}
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-[#163364]"
                  htmlFor={`${formId}-token`}
                >
                  رمز المتابعة
                </label>
                <div className="relative">
                  <input
                    id={`${formId}-token`}
                    name="trackingToken"
                    type={showToken ? "text" : "password"}
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="XXXX-XXXX"
                    className={`${inputClass} pe-24 text-left font-mono`}
                    value={trackingToken}
                    onChange={(e) => setTrackingToken(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={`${formId}-token-hint`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className={`absolute inset-y-0 end-2 my-auto h-9 rounded-lg px-3 text-xs font-semibold text-[#163364] hover:bg-[#eef2f8] ${focus}`}
                  >
                    {showToken ? "إخفاء" : "إظهار"}
                  </button>
                </div>
                <p id={`${formId}-token-hint`} className="mt-1.5 text-xs text-neutral-500">
                  يتكون رمز المتابعة من 8 أحرف وأرقام.
                </p>
              </div>

              <div
                id={`${formId}-help`}
                className="rounded-xl border border-[#31BD9C]/20 bg-[#eef8f5] px-4 py-3 text-sm leading-relaxed text-[#163364]"
              >
                يمكنك العثور على رقم المشاركة ورمز المتابعة في شاشة نجاح التسجيل أو النسخة التي
                قمت بطباعتها.
              </div>

              {error && (
                <div
                  ref={errorRef}
                  id={`${formId}-error`}
                  role="alert"
                  tabIndex={-1}
                  aria-live="assertive"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 outline-none"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-xl bg-[#31BD9C] px-6 py-3.5 text-sm font-bold text-[#061528] hover:brightness-105 disabled:opacity-70 sm:w-auto ${focus}`}
              >
                {loading ? "جاري التحقق..." : "عرض حالة الطلب"}
              </button>
            </form>

            <div className="mt-8">
              <Link
                href="/ar/innovation-conference"
                className={`text-sm font-semibold text-[#187c67] hover:underline ${focus}`}
              >
                العودة إلى المؤتمر
              </Link>
            </div>
          </>
        ) : (
          <section
            ref={resultRef}
            tabIndex={-1}
            aria-live="polite"
            className="space-y-6 outline-none"
          >
            <div className="rounded-2xl border border-neutral-100 bg-[#F7FAF9] p-5 sm:p-6">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  toneBadge[copy?.tone || "info"]
                }`}
              >
                {result.statusTitle}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-[#163364]">
                {result.statusTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
                {result.statusMessage}
              </p>

              <dl className="mt-6 grid gap-4 border-t border-neutral-200/70 pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-neutral-500">رقم المشاركة</dt>
                  <dd className="mt-1 font-mono text-sm font-bold text-[#163364]" dir="ltr">
                    {result.participationCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500">اسم المشروع</dt>
                  <dd className="mt-1 text-sm font-bold text-[#163364]">{result.projectTitle}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500">تاريخ الإرسال</dt>
                  <dd className="mt-1 text-sm text-neutral-800">
                    {formatArDate(result.submittedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500">آخر تحديث</dt>
                  <dd className="mt-1 text-sm text-neutral-800">
                    {formatArDate(result.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {progress && progress.activeIndex >= 0 && (
              <div aria-label="مسار حالة الطلب">
                <p className="mb-3 text-sm font-bold text-[#163364]">مسار المعالجة</p>
                <ol className="grid gap-2 sm:grid-cols-5">
                  {IC_TRACK_PROGRESS_STEPS.map((step, i) => {
                    const done = progress.completed[i];
                    const current = progress.activeIndex === i;
                    const negativeCurrent =
                      progress.terminalNegative && current && result.status === "REJECTED";
                    return (
                      <li
                        key={step.id}
                        className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold ${
                          negativeCurrent
                            ? "border-neutral-300 bg-neutral-100 text-neutral-600"
                            : done || current
                              ? "border-[#31BD9C]/35 bg-[#eef8f5] text-[#187c67]"
                              : "border-neutral-100 bg-white text-neutral-400"
                        }`}
                      >
                        <span
                          className={`mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                            negativeCurrent
                              ? "bg-neutral-300 text-neutral-700"
                              : done || current
                                ? "bg-[#31BD9C] text-[#061528]"
                                : "bg-neutral-200 text-neutral-500"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {step.label}
                      </li>
                    );
                  })}
                </ol>
                {progress.terminalNegative && result.status === "REJECTED" && (
                  <p className="mt-3 text-xs text-neutral-500">
                    اكتملت المراجعة دون الانتقال إلى مرحلة النهائيات.
                  </p>
                )}
              </div>
            )}

            {result.status === "WITHDRAWN" && (
              <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                هذا الطلب مسحوب ولم يعد ضمن مسار المشاركة النشط.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetToForm}
                className={`rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-[#163364] ${focus}`}
              >
                التحقق من طلب آخر
              </button>
              <Link
                href="/ar/innovation-conference"
                className={`rounded-xl bg-[#31BD9C] px-5 py-3 text-center text-sm font-bold text-[#061528] ${focus}`}
              >
                العودة إلى المؤتمر
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
