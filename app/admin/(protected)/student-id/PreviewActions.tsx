"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  serial: string;
  nameAr: string;
  nameEn: string;
  department: string;
  stage: string;
};

type ResolveResult =
  | { ok: true; serial: string; nameAr: string }
  | { ok: false; error: string; matches?: Match[] };

async function fetchMatches(query: string): Promise<Match[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const res = await fetch(`/api/student-id/lookup?q=${encodeURIComponent(q)}`, {
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    matches?: Match[];
  };
  if (!res.ok) throw new Error(data.error || "تعذر البحث عن الهوية.");
  return Array.isArray(data.matches) ? data.matches : [];
}

async function resolveQuery(query: string): Promise<ResolveResult> {
  const q = query.trim();
  if (!q) return { ok: false, error: "أدخل الاسم أو السيريال أولًا." };

  try {
    const matches = await fetchMatches(q);
    if (matches.length === 0) {
      return { ok: false, error: "لم يتم العثور على هوية مطابقة لهذا الاسم أو السيريال." };
    }
    if (matches.length === 1) {
      return { ok: true, serial: matches[0].serial, nameAr: matches[0].nameAr };
    }
    return {
      ok: false,
      error: "وُجد أكثر من تطابق. اختر الهوية من المقترحات.",
      matches,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل الاتصال بخادم البحث.",
    };
  }
}

export default function PreviewActions() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resolvedSerial, setResolvedSerial] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Match[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUse = useMemo(() => query.trim().length > 0 && !busy, [query, busy]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 1 || resolvedSerial) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const matches = await fetchMatches(q);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
        setError(null);
      } catch (err) {
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "تعذر جلب المقترحات.");
      } finally {
        setSuggestLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, resolvedSerial]);

  async function ensureSerial(): Promise<string | null> {
    if (resolvedSerial) return resolvedSerial;
    setError(null);
    setBusy(true);
    try {
      const result = await resolveQuery(query);
      if (!result.ok) {
        setResolvedSerial(null);
        setResolvedName(null);
        setSuggestions(result.matches || []);
        setShowSuggestions((result.matches || []).length > 0);
        setError(result.error);
        return null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      setResolvedSerial(result.serial);
      setResolvedName(result.nameAr);
      setQuery(result.serial);
      return result.serial;
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch() {
    setError(null);
    setBusy(true);
    try {
      const matches = await fetchMatches(query);
      if (matches.length === 0) {
        setSuggestions([]);
        setResolvedSerial(null);
        setResolvedName(null);
        setError("لم يتم العثور على هوية مطابقة.");
        return;
      }
      if (matches.length === 1) {
        pickMatch(matches[0]);
        return;
      }
      setSuggestions(matches);
      setShowSuggestions(true);
      setResolvedSerial(null);
      setResolvedName(null);
      setError("اختر الاسم من المقترحات.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر البحث.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePreview() {
    const serial = await ensureSerial();
    if (!serial) return;
    router.push(`/admin/student-id/preview/${encodeURIComponent(serial)}`);
  }

  async function handleDownload(side: "ar" | "en") {
    const serial = await ensureSerial();
    if (!serial) return;
    window.location.href = `/api/id/render?serial=${encodeURIComponent(serial)}&side=${side}`;
  }

  function pickMatch(m: Match) {
    setQuery(m.nameAr);
    setResolvedSerial(m.serial);
    setResolvedName(m.nameAr);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900 mb-3">المعاينة والتحميل</h2>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div ref={wrapRef} className="relative w-full sm:max-w-sm">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResolvedSerial(null);
              setResolvedName(null);
              setError(null);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="ابحث بالاسم أو السيريال..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
          />
          {suggestLoading && (
            <p className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">
              ...
            </p>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
              {suggestions.map((m) => (
                <li key={m.serial}>
                  <button
                    type="button"
                    onClick={() => pickMatch(m)}
                    className="w-full text-right px-3 py-2.5 text-sm hover:bg-[#31BD9C]/10 transition-colors border-b border-neutral-50 last:border-0"
                  >
                    <span className="block font-bold text-neutral-900">{m.nameAr}</span>
                    <span className="block text-xs text-neutral-500 mt-0.5">
                      {m.serial} · {m.department} · {m.stage}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => void handleSearch()}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          بحث
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => void handlePreview()}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-[#31BD9C] text-white hover:bg-[#2aa88a]"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          {busy ? "جاري..." : "معاينة الهوية"}
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => void handleDownload("ar")}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          تحميل الواجهة PNG
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => void handleDownload("en")}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          تحميل الخلفية PNG
        </button>
      </div>

      {resolvedSerial && (
        <p className="text-xs text-[#31BD9C] mt-2">
          تم التعرف: {resolvedName || "—"} — {resolvedSerial}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <p className="text-xs text-neutral-500 mt-2">
        اكتب الاسم لظهور المقترحات تلقائيًا، أو اضغط بحث، ثم المعاينة أو التنزيل.
      </p>
    </div>
  );
}
