"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "عن الكلية", href: "/about" },
  { label: "الحياة الجامعية", href: "/campus-life" },
  { label: "البحث العلمي", href: "/research" },
  { label: "الاخبار", href: "/news" },
  { label: "الاحداث", href: "/events" },
  { label: "خدماتنا", href: "/services" },
  { label: "المنصة البحثة", href: "/research-platform" },
  { label: "المجلة العلمية", href: "/journal" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-neutral-200">
      <div className="w-full pr-4 sm:pr-6 md:pr-8 lg:pr-10 xl:pr-12 pl-8 sm:pl-10 md:pl-12 lg:pl-14 xl:pl-20">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-2 sm:gap-3 md:gap-4">
          
          {/* المنطقة 1: الشعار (Logo) - اليسار - ثابت لا ينضغط */}
          <div 
            className="flex items-center justify-center flex-shrink-0 whitespace-nowrap overflow-hidden"
            style={{ 
              maxWidth: '320px',
              minWidth: '320px',
              width: '320px'
            }}
          >
            <Link href="/" className="flex items-center justify-center w-full h-full">
              <div 
                className="relative flex items-center justify-center overflow-visible"
                style={{
                  width: '140px',
                  height: '112px',
                  maxWidth: '140px',
                  maxHeight: '112px',
                  transform: 'scale(2.15)',
                  transformOrigin: 'center center'
                }}
              >
                <Image
                  src="/Untit4545led-1.png"
                  alt="شعار كلية الشرق"
                  fill
                  className="object-contain object-center"
                  priority
                  unoptimized
                  sizes="(max-width: 640px) 70px, (max-width: 768px) 90px, (max-width: 1024px) 110px, 140px"
                />
              </div>
            </Link>
          </div>

          {/* المنطقة 2: وسط - التبويبات (Nav) */}
          <nav className="hidden xl:flex items-center justify-center flex-1 min-w-0 max-w-none overflow-x-auto px-2 scrollbar-hide">
            <div className="flex items-center justify-center gap-0 flex-nowrap">
              {navItems.map((item, index) => (
                <div key={item.href} className="flex items-center flex-shrink-0">
                  <Link
                    href={item.href}
                    className="group relative px-2.5 py-2.5 text-xs font-semibold text-neutral-700 whitespace-nowrap transition-all duration-300 ease-in-out hover:text-[#31BD9C] border-2 border-transparent hover:border-[#31BD9C] rounded-lg"
                  >
                    {/* النص */}
                    <span className="relative z-10 flex items-center">
                      {item.label}
                    </span>
                  </Link>
                  
                  {/* الخط الفاصل العمودي */}
                  {index < navItems.length - 1 && (
                    <div className="h-5 w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-0.5"></div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* المنطقة 3: يمين - اللغة والبحث */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Search Bar - Windows 11 Style */}
            <div className="relative group">
              <div className="flex items-center bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#31BD9C] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus-within:border-[#31BD9C] focus-within:bg-white focus-within:shadow-md focus-within:[&_svg]:text-[#31BD9C]">
                <input
                  type="text"
                  placeholder="ابحث..."
                  className="w-[90px] sm:w-[115px] md:w-[135px] lg:w-[160px] px-8 py-1.5 pl-3 text-sm text-neutral-700 bg-transparent border-0 outline-none placeholder:text-neutral-400 focus:placeholder:text-neutral-300"
                  aria-label="البحث"
                />
                <div className="absolute right-2.5 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-neutral-400 transition-colors duration-200"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Language Switcher Button - كبسولة */}
            <div className="hidden sm:flex items-center">
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-2"></div>
              <button
                className="group relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#31BD9C] hover:bg-[#2aa88a] text-white transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:shadow-[#31BD9C]/30 focus:outline-none focus:ring-2 focus:ring-[#31BD9C] focus:ring-offset-2"
                aria-label="تغيير اللغة"
              >
                {/* أيقونة الكرة الأرضية */}
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                
                {/* نص اللغة */}
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                  العربية
                </span>
              </button>
            </div>

            {/* زر القائمة للهواتف المحمولة والشاشات المتوسطة */}
            <button
              className="xl:hidden flex-shrink-0 p-2 text-neutral-700 hover:text-[#31BD9C] rounded-lg hover:bg-[#31BD9C]/5 transition-colors duration-200"
              aria-label="قائمة التنقل"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* القائمة المنسدلة للهواتف المحمولة والشاشات المتوسطة */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-neutral-200 bg-white animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 text-sm font-semibold text-neutral-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
