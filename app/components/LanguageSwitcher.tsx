"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  function switchLanguage() {
    if (!pathname) return;

    if (pathname.startsWith("/ar")) {
      router.push(pathname.replace("/ar", "/en"));
    } else if (pathname.startsWith("/en")) {
      router.push(pathname.replace("/en", "/ar"));
    } else {
      router.push("/ar");
    }
  }

  const isArabic = pathname?.startsWith("/ar");

  return (
    <button
      onClick={switchLanguage}
      className="group relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#31BD9C] hover:bg-[#2aa88a] text-white transition-all duration-300 shadow-md"
      aria-label="تغيير اللغة"
      type="button"
    >
      <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
        {isArabic ? "English" : "العربية"}
      </span>
    </button>
  );
}
