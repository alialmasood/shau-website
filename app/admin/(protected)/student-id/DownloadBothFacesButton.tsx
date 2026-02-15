"use client";

import { useState } from "react";

function getFilenameFromDisposition(disposition: string | null): string {
  if (!disposition) return "id.png";
  const match = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1].trim());
    } catch {
      return "id.png";
    }
  }
  const ascii = disposition.match(/filename="([^"]+)"/);
  return ascii ? ascii[1] : "id.png";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DownloadBothFacesButton({ serial }: { serial: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownloadBoth(e: React.MouseEvent) {
    e.preventDefault();
    const arUrl = `/api/id/render?serial=${encodeURIComponent(serial)}&side=ar`;
    const enUrl = `/api/id/render?serial=${encodeURIComponent(serial)}&side=en`;
    setLoading(true);
    try {
      const [resAr, resEn] = await Promise.all([fetch(arUrl), fetch(enUrl)]);
      const nameAr = getFilenameFromDisposition(resAr.headers.get("Content-Disposition"));
      const nameEn = getFilenameFromDisposition(resEn.headers.get("Content-Disposition"));
      const blobAr = await resAr.blob();
      const blobEn = await resEn.blob();
      downloadBlob(blobAr, nameAr);
      downloadBlob(blobEn, nameEn);
    } catch {
      // fallback: open in new tabs so user can save manually
      window.open(arUrl, "_blank");
      setTimeout(() => window.open(enUrl, "_blank"), 300);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownloadBoth}
      disabled={loading}
      className="text-neutral-700 hover:underline disabled:opacity-50"
    >
      {loading ? "جاري التحميل..." : "تحميل الوجهين"}
    </button>
  );
}
