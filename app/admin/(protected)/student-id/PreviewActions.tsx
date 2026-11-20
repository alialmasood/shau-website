"use client";

import { useMemo, useState } from "react";
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

async function resolveQuery(query: string): Promise<ResolveResult> {
  const q = query.trim();
  if (!q) return { ok: false, error: "أدخل الاسم أو السيريال أولًا." };

  try {
    const res = await fetch(`/api/student-id/lookup?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      matches?: Match[];
    };

    if (!res.ok) {
      return { ok: false, error: data.error || "تعذر البحث عن الهوية." };
    }

    const matches = Array.isArray(data.matches) ? data.matches : [];
    if (matches.length === 0) {
      return { ok: false, error: "لم يتم العثور على هوية مطابقة لهذا الاسم أو السيريال." };
    }
    if (matches.length === 1) {
      return { ok: true, serial: matches[0].serial, nameAr: matches[0].nameAr };
    }
    return {
      ok: false,
      error: "وُجد أكثر من تطابق. اختر الهوية من القائمة ثم أعد المحاولة.",
      matches,
    };
  } catch {
    return { ok: false, error: "فشل الاتصال بخادم البحث." };
  }
}

export default function PreviewActions() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resolvedSerial, setResolvedSerial] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canUse = useMemo(() => query.trim().length > 0 && !busy, [query, busy]);

  async function ensureSerial(): Promise<string | null> {
    setError(null);
    setBusy(true);
    try {
      const result = await resolveQuery(query);
      if (!result.ok) {
        setResolvedSerial(null);
        setResolvedName(null);
        setMatches(result.matches || []);
        setError(result.error);
        return null;
      }
      setMatches([]);
      setResolvedSerial(result.serial);
      setResolvedName(result.nameAr);
      setQuery(result.serial);
      return result.serial;
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
    setQuery(m.serial);
    setResolvedSerial(m.serial);
    setResolvedName(m.nameAr);
    setMatches([]);
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900 mb-3">المعاينة والتحميل</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResolvedSerial(null);
            setResolvedName(null);
            setError(null);
          }}
          placeholder="ابحث بالاسم أو السيريال..."
          className="w-full sm:max-w-sm px-4 py-3 rounded-xl bg-white border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all"
        />
        <button
          type="button"
          disabled={!canUse}
          onClick={handlePreview}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            canUse
              ? "bg-[#31BD9C] text-white hover:bg-[#2aa88a]"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          {busy ? "جاري البحث..." : "معاينة الهوية"}
        </button>
        <button
          type="button"
          disabled={!canUse}
          onClick={() => handleDownload("ar")}
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
          onClick={() => handleDownload("en")}
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
      {matches.length > 1 && (
        <ul className="mt-3 space-y-1 max-h-40 overflow-auto border border-neutral-100 rounded-xl p-2">
          {matches.map((m) => (
            <li key={m.serial}>
              <button
                type="button"
                onClick={() => pickMatch(m)}
                className="w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
              >
                <span className="font-bold text-neutral-900">{m.nameAr}</span>
                <span className="text-neutral-500 mx-2">·</span>
                <span className="font-mono text-xs text-neutral-600">{m.serial}</span>
                <span className="text-neutral-400 text-xs mr-2">
                  ({m.department} / {m.stage})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-neutral-500 mt-2">
        يمكنك البحث بالاسم أو السيريال، ثم المعاينة أو تنزيل PNG.
      </p>
    </div>
  );
}
