"use client";

export default function DownloadBothFacesButton({ serial }: { serial: string }) {
  function handleDownloadBoth(e: React.MouseEvent) {
    e.preventDefault();
    const arUrl = `/api/id/render?serial=${encodeURIComponent(serial)}&side=ar`;
    const enUrl = `/api/id/render?serial=${encodeURIComponent(serial)}&side=en`;
    const a1 = document.createElement("a");
    a1.href = arUrl;
    a1.style.display = "none";
    document.body.appendChild(a1);
    a1.click();
    document.body.removeChild(a1);
    setTimeout(() => {
      const a2 = document.createElement("a");
      a2.href = enUrl;
      a2.style.display = "none";
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
    }, 400);
  }

  return (
    <button
      type="button"
      onClick={handleDownloadBoth}
      className="text-neutral-700 hover:underline"
    >
      تحميل الوجهين
    </button>
  );
}
