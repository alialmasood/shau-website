"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CONFERENCE_HALL_ACTIVITY_TYPES,
  CONFERENCE_HALL_STAGES,
  CONFERENCE_HALL_STUDY_TYPES,
  labelActivityType,
  labelStage,
  labelStatus,
  labelStudyType,
  type ConferenceHallStatus,
} from "@/lib/conferenceHallConfig";
import type { ConferenceHallRequestRow } from "@/lib/conferenceHallRepo";

type Props = {
  initialRows: ConferenceHallRequestRow[];
};

function formatCreated(iso: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function statusBadgeClass(status: string): string {
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "completed") return "bg-sky-100 text-sky-800";
  return "bg-neutral-100 text-neutral-700";
}

export default function ConferenceHallAdminClient({ initialRows }: Props) {
  const [rows, setRows] = useState<ConferenceHallRequestRow[]>(initialRows);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [activityType, setActivityType] = useState("");
  const [stage, setStage] = useState("");
  const [studyType, setStudyType] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [liveHint, setLiveHint] = useState<string | null>(null);

  const refresh = useCallback(async (silent = true) => {
    try {
      const res = await fetch("/api/admin/conference-hall", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        rows?: ConferenceHallRequestRow[];
        latestId?: string | null;
        count?: number;
        fetchedAt?: string;
      };
      const next = Array.isArray(data.rows) ? data.rows : [];
      setRows((prev) => {
        const prevLatest = prev[0]?.id ?? null;
        const nextLatest = next[0]?.id ?? null;
        if (silent && prevLatest && nextLatest && prevLatest !== nextLatest) {
          setLiveHint("وصل طلب جديد");
          window.setTimeout(() => setLiveHint(null), 2500);
        } else if (silent && prev.length !== next.length) {
          setLiveHint("تم تحديث القائمة");
          window.setTimeout(() => setLiveHint(null), 2000);
        }
        return next;
      });
      if (data.fetchedAt) setLastSync(data.fetchedAt);
    } catch {
      /* ignore silent poll errors */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh(true);
    }, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (activityType && r.activityType !== activityType) return false;
      if (stage && r.stage !== stage) return false;
      if (studyType && r.studyType !== studyType) return false;
      if (!term) return true;
      const hay = [
        r.departmentNameAr,
        r.departmentNameEn,
        r.organizers,
        labelActivityType(r.activityType, "ar"),
        labelStage(r.stage, "ar"),
        labelStudyType(r.studyType, "ar"),
        labelStatus(r.status, "ar"),
        r.dateFrom,
        r.dateTo,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q, status, activityType, stage, studyType]);

  const exportQuery = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    if (activityType) sp.set("activityType", activityType);
    if (stage) sp.set("stage", stage);
    if (studyType) sp.set("studyType", studyType);
    const s = sp.toString();
    return s ? `?${s}` : "";
  }, [q, status, activityType, stage, studyType]);

  async function setStatusAction(id: string, next: ConferenceHallStatus) {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/conference-hall", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(String(data.error || "فشل تحديث الحالة"));
        return;
      }
      const updated = data.row as ConferenceHallRequestRow | undefined;
      if (updated) {
        setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } else {
        await refresh(false);
      }
    } catch {
      setActionError("فشل الاتصال بالخادم");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">قاعة المؤتمرات</h1>
          <p className="mt-2 text-sm text-neutral-600">
            طلبات إقامة نشاط وحجز القاعة — المعروض: {filtered.length} من {rows.length}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            تحديث صامت كل بضع ثوانٍ
            {lastSync
              ? ` · آخر مزامنة ${new Intl.DateTimeFormat("ar-IQ", { timeStyle: "medium" }).format(new Date(lastSync))}`
              : ""}
            {liveHint ? ` · ${liveHint}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/conference-hall/export-excel${exportQuery}`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
          >
            تصدير Excel
          </a>
          <a
            href={`/api/admin/conference-hall/export-pdf${exportQuery}`}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            تصدير PDF (A4)
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالقسم / القائمين / التاريخ..."
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">موافق عليه</option>
            <option value="rejected">مرفوض</option>
            <option value="completed">منجز</option>
            <option value="cancelled">ملغى</option>
          </select>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل أنواع النشاط</option>
            {CONFERENCE_HALL_ACTIVITY_TYPES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.ar}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل المراحل</option>
            {CONFERENCE_HALL_STAGES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.ar}
              </option>
            ))}
          </select>
          <select
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm"
          >
            <option value="">كل أنواع الدراسة</option>
            {CONFERENCE_HALL_STUDY_TYPES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.ar}
              </option>
            ))}
          </select>
        </div>
        {(q || status || activityType || stage || studyType) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatus("");
              setActivityType("");
              setStage("");
              setStudyType("");
            }}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {actionError && <p className="text-sm text-red-600 font-semibold">{actionError}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
          لا توجد طلبات مطابقة.
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#31BD9C] text-white">
                  <th className="text-center py-3 px-3 font-bold w-12">ت</th>
                  <th className="text-start py-3 px-3 font-bold">القسم</th>
                  <th className="text-start py-3 px-3 font-bold">المرحلة</th>
                  <th className="text-start py-3 px-3 font-bold">الدراسة</th>
                  <th className="text-start py-3 px-3 font-bold">نوع النشاط</th>
                  <th className="text-start py-3 px-3 font-bold">القائمون</th>
                  <th className="text-start py-3 px-3 font-bold">من</th>
                  <th className="text-start py-3 px-3 font-bold">إلى</th>
                  <th className="text-start py-3 px-3 font-bold">الحالة</th>
                  <th className="text-start py-3 px-3 font-bold">تاريخ الطلب</th>
                  <th className="text-start py-3 px-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-neutral-100 ${idx % 2 === 0 ? "bg-neutral-50/80" : "bg-white"}`}
                  >
                    <td className="py-3 px-3 text-center text-neutral-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-900 max-w-[200px]">
                      <span className="line-clamp-2">{r.departmentNameAr}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-700">{labelStage(r.stage, "ar")}</td>
                    <td className="py-3 px-3 text-neutral-700">{labelStudyType(r.studyType, "ar")}</td>
                    <td className="py-3 px-3 text-neutral-700">{labelActivityType(r.activityType, "ar")}</td>
                    <td className="py-3 px-3 text-neutral-700 max-w-[200px]">
                      <span className="line-clamp-2">{r.organizers}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-700 whitespace-nowrap">{r.dateFrom}</td>
                    <td className="py-3 px-3 text-neutral-700 whitespace-nowrap">{r.dateTo}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(r.status)}`}
                      >
                        {labelStatus(r.status, "ar")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap text-xs">
                      {formatCreated(r.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5 min-w-[180px]">
                        <button
                          type="button"
                          disabled={busyId === r.id || r.status === "approved"}
                          onClick={() => void setStatusAction(r.id, "approved")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                        >
                          موافقة
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id || r.status === "rejected"}
                          onClick={() => void setStatusAction(r.id, "rejected")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                        >
                          رفض
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id || r.status === "completed"}
                          onClick={() => void setStatusAction(r.id, "completed")}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40"
                        >
                          منجز
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
