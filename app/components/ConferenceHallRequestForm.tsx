"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONFERENCE_HALL_ACTIVITY_TYPES,
  CONFERENCE_HALL_STAGES,
  CONFERENCE_HALL_STUDY_TYPES,
  todayLocalYmd,
} from "@/lib/conferenceHallConfig";
import type { ConferenceHallDepartmentOption } from "@/lib/conferenceHallRepo";

type BusyDay = {
  date: string;
  kinds: Array<"booking" | "event">;
  labels: string[];
};

type Labels = Record<string, string>;

type Props = {
  locale: "ar" | "en";
  labels: Labels;
  departments: ConferenceHallDepartmentOption[];
};

function monthBounds(year: number, monthIndex: number): { from: string; to: string } {
  const from = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const to = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function ConferenceHallRequestForm({ locale, labels, departments }: Props) {
  const L = (k: string) => labels[k] ?? k;
  const isRtl = locale === "ar";
  const minDate = useMemo(() => todayLocalYmd(), []);

  const [selectedDeptKeys, setSelectedDeptKeys] = useState<string[]>([]);
  const [allDepartments, setAllDepartments] = useState(false);
  const [stage, setStage] = useState("");
  const [studyType, setStudyType] = useState("");
  const [activityType, setActivityType] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityBrief, setActivityBrief] = useState("");
  const [organizers, setOrganizers] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [busyDays, setBusyDays] = useState<BusyDay[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const busyMap = useMemo(() => {
    const m = new Map<string, BusyDay>();
    for (const b of busyDays) m.set(b.date, b);
    return m;
  }, [busyDays]);

  useEffect(() => {
    if (!picking) return;
    const { from, to } = monthBounds(viewYear, viewMonth);
    let cancelled = false;
    setBusyLoading(true);
    fetch(
      `/api/conference-hall/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&locale=${locale}`
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && Array.isArray(data.busyDays)) {
          setBusyDays(data.busyDays as BusyDay[]);
        }
      })
      .catch(() => {
        if (!cancelled) setBusyDays([]);
      })
      .finally(() => {
        if (!cancelled) setBusyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [picking, viewYear, viewMonth, locale]);

  const fieldClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20";

  const allDeptKeys = useMemo(() => departments.map((d) => d.key), [departments]);
  const allChecked =
    allDepartments ||
    (allDeptKeys.length > 0 && allDeptKeys.every((k) => selectedDeptKeys.includes(k)));

  function toggleAllDepartments() {
    if (allChecked) {
      setAllDepartments(false);
      setSelectedDeptKeys([]);
      return;
    }
    setAllDepartments(true);
    setSelectedDeptKeys(allDeptKeys);
  }

  function toggleDepartment(key: string) {
    if (allChecked) {
      setAllDepartments(false);
      setSelectedDeptKeys(allDeptKeys.filter((k) => k !== key));
      return;
    }
    setAllDepartments(false);
    setSelectedDeptKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  }

  function openPicker(which: "from" | "to") {
    const base = which === "to" && dateFrom ? new Date(dateFrom + "T12:00:00") : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setPicking(which);
    setError(null);
  }

  function selectDay(day: string) {
    if (day < minDate) {
      setError(L("errorPastDate"));
      return;
    }
    const busy = busyMap.get(day);
    if (busy?.kinds.includes("booking")) {
      setError(L("errorDayBooked"));
      return;
    }
    if (picking === "from") {
      setDateFrom(day);
      if (dateTo && dateTo < day) setDateTo("");
      // الانتقال التلقائي لاختيار تاريخ «إلى»
      const d = new Date(day + "T12:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setPicking("to");
      setError(null);
      return;
    }
    if (picking === "to") {
      const start = dateFrom;
      if (start && day < start) {
        setError(L("errorEndBeforeStart"));
        return;
      }
      setDateTo(day);
      setPicking(null);
      setError(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      (!allDepartments && selectedDeptKeys.length === 0) ||
      !stage ||
      !studyType ||
      !activityType ||
      !activityTitle.trim() ||
      !activityBrief.trim() ||
      !organizers.trim() ||
      !dateFrom ||
      !dateTo
    ) {
      setError(L("required"));
      return;
    }
    if (dateFrom < minDate || dateTo < minDate) {
      setError(L("errorPastDate"));
      return;
    }
    if (dateTo < dateFrom) {
      setError(L("errorEndBeforeStart"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/conference-hall/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentKeys: allDepartments || allChecked ? allDeptKeys : selectedDeptKeys,
          allDepartments: allDepartments || allChecked,
          stage,
          studyType,
          activityType,
          activityTitle: activityTitle.trim(),
          activityBrief: activityBrief.trim(),
          organizers: organizers.trim(),
          dateFrom,
          dateTo,
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data.error || L("errorSubmit")));
        return;
      }
      setSuccess(true);
      setSelectedDeptKeys([]);
      setAllDepartments(false);
      setStage("");
      setStudyType("");
      setActivityType("");
      setActivityTitle("");
      setActivityBrief("");
      setOrganizers("");
      setDateFrom("");
      setDateTo("");
      setPicking(null);
    } catch {
      setError(L("errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sunday=0 to Saturday-start for AR feel: keep Sun-Sat international
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth, 1));

  const weekdayLabels =
    locale === "ar"
      ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full max-w-3xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{L("title")}</h1>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{L("subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("department")}</label>
          <p className="text-xs text-neutral-500 mb-2">{L("departmentHint")}</p>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2 max-h-64 overflow-auto">
            <label className="flex items-center gap-2 rounded-lg bg-white border border-neutral-200 px-3 py-2.5 cursor-pointer hover:border-[#31BD9C]/50">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAllDepartments}
                className="h-4 w-4 rounded border-neutral-300 text-[#31BD9C] focus:ring-[#31BD9C]"
              />
              <span className="text-sm font-bold text-neutral-900">{L("allDepartments")}</span>
            </label>
            {departments.map((d) => {
              const checked = allChecked || selectedDeptKeys.includes(d.key);
              return (
                <label
                  key={d.key}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDepartment(d.key)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#31BD9C] focus:ring-[#31BD9C]"
                  />
                  <span className="text-sm text-neutral-800">
                    {locale === "en" ? d.nameEn || d.nameAr : d.nameAr}
                  </span>
                </label>
              );
            })}
            {departments.length === 0 && (
              <p className="text-xs text-amber-700 px-1">{L("noDepartments")}</p>
            )}
          </div>
          {(allChecked || selectedDeptKeys.length > 0) && (
            <p className="mt-1.5 text-xs text-[#31BD9C] font-semibold">
              {allChecked
                ? L("allDepartmentsSelected")
                : L("departmentsSelectedCount").replace("{count}", String(selectedDeptKeys.length))}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("stage")}</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className={fieldClass} required>
              <option value="">{L("select")}</option>
              {CONFERENCE_HALL_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s[locale]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("studyType")}</label>
            <select
              value={studyType}
              onChange={(e) => setStudyType(e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">{L("select")}</option>
              {CONFERENCE_HALL_STUDY_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("activityType")}</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className={fieldClass}
            required
          >
            <option value="">{L("select")}</option>
            {CONFERENCE_HALL_ACTIVITY_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("activityTitle")}</label>
          <input
            type="text"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            className={fieldClass}
            placeholder={L("activityTitlePlaceholder")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("activityBrief")}</label>
          <textarea
            value={activityBrief}
            onChange={(e) => setActivityBrief(e.target.value)}
            rows={4}
            className={fieldClass}
            placeholder={L("activityBriefPlaceholder")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-800 mb-1.5">{L("organizers")}</label>
          <textarea
            value={organizers}
            onChange={(e) => setOrganizers(e.target.value)}
            rows={3}
            className={fieldClass}
            placeholder={L("organizersPlaceholder")}
            required
          />
        </div>

        <div>
          <p className="text-sm font-bold text-neutral-800 mb-2">{L("activityDates")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openPicker("from")}
              className={`${fieldClass} text-start ${picking === "from" ? "ring-2 ring-[#31BD9C]/30 border-[#31BD9C]" : ""}`}
            >
              <span className="block text-xs text-neutral-500 mb-0.5">{L("dateFrom")}</span>
              <span className="font-semibold text-neutral-900">{dateFrom || L("pickDate")}</span>
            </button>
            <button
              type="button"
              onClick={() => openPicker("to")}
              className={`${fieldClass} text-start ${picking === "to" ? "ring-2 ring-[#31BD9C]/30 border-[#31BD9C]" : ""}`}
            >
              <span className="block text-xs text-neutral-500 mb-0.5">{L("dateTo")}</span>
              <span className="font-semibold text-neutral-900">{dateTo || L("pickDate")}</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">{L("dateHint")}</p>
        </div>

        {picking && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white border border-neutral-200 hover:bg-neutral-100"
                onClick={() => {
                  const d = new Date(viewYear, viewMonth - 1, 1);
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
              >
                {isRtl ? "→" : "←"}
              </button>
              <div className="text-center">
                <p className="font-bold text-neutral-900">{monthLabel}</p>
                <p className="text-xs text-neutral-500">
                  {picking === "from" ? L("pickingFrom") : L("pickingTo")}
                  {busyLoading ? ` · ${L("loadingCalendar")}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white border border-neutral-200 hover:bg-neutral-100"
                onClick={() => {
                  const d = new Date(viewYear, viewMonth + 1, 1);
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
              >
                {isRtl ? "←" : "→"}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-neutral-500 mb-1.5">
              {weekdayLabels.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const day = ymd(viewYear, viewMonth, dayNum);
                const busy = busyMap.get(day);
                const isPast = day < minDate;
                const isToday = day === minDate;
                const isBooked = Boolean(busy?.kinds.includes("booking"));
                const hasEvent = Boolean(busy?.kinds.includes("event"));
                const selected = day === dateFrom || day === dateTo;
                const inRange =
                  dateFrom && dateTo && day >= dateFrom && day <= dateTo && dateFrom !== dateTo;
                let cls =
                  "aspect-square rounded-xl text-sm font-semibold transition-colors border";
                // Past days: muted gray (distinct from booked)
                if (isPast) {
                  cls += " bg-neutral-100 text-neutral-400 border-neutral-200/80 cursor-not-allowed line-through decoration-neutral-300";
                } else if (isBooked) {
                  // Booked: unique violet — clearly different from past gray
                  cls +=
                    " bg-violet-600 text-white border-violet-700 shadow-sm shadow-violet-200 cursor-not-allowed ring-1 ring-violet-300/80";
                } else if (selected) {
                  cls += " bg-[#31BD9C] text-white border-[#2aa88a] shadow-sm";
                } else if (inRange) {
                  cls += " bg-[#31BD9C]/20 text-neutral-900 border-[#31BD9C]/30";
                } else if (hasEvent) {
                  cls += " bg-amber-100 text-amber-950 hover:bg-amber-200 border-amber-300";
                } else if (isToday) {
                  cls +=
                    " bg-white text-neutral-900 border-[#31BD9C] ring-1 ring-[#31BD9C]/35 hover:bg-[#31BD9C]/10";
                } else {
                  cls += " bg-white hover:bg-[#31BD9C]/10 text-neutral-800 border-neutral-200";
                }
                const titleParts = [
                  ...(busy?.labels ?? []),
                  isPast ? L("legendPast") : null,
                  isBooked ? L("legendBooked") : null,
                ].filter(Boolean);
                const title = titleParts.length ? titleParts.join(" · ") : undefined;
                return (
                  <button
                    key={day}
                    type="button"
                    title={title}
                    disabled={isPast || isBooked}
                    onClick={() => selectDay(day)}
                    className={cls}
                    aria-label={title ? `${dayNum} — ${title}` : String(dayNum)}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-neutral-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-neutral-100 border border-neutral-300" />{" "}
                {L("legendPast")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-violet-600 border border-violet-700" />{" "}
                {L("legendBooked")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-300" />{" "}
                {L("legendEvent")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#31BD9C]" /> {L("legendSelected")}
              </span>
            </div>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
              onClick={() => setPicking(null)}
            >
              {L("closeCalendar")}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        {success && <p className="text-sm text-[#31BD9C] font-semibold">{L("success")}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] disabled:opacity-60 transition-colors"
        >
          {submitting ? L("submitting") : L("submit")}
        </button>
      </form>
    </div>
  );
}
