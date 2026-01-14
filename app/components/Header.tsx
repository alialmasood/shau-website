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
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-neutral-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo - الجانب الأيمن */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 transform scale-[2.1] sm:scale-[2.6] md:scale-[2.9] lg:scale-[3.2]">
                <Image
                  src="/Untit4545led-1.png"
                  alt="شعار كلية الشرق"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>

          {/* Navigation and Language Switcher - الجانب الأيسر */}
          <div className="flex items-center gap-2">
            {/* Navigation - الجانب الأيسر */}
            <nav className="hidden md:flex items-center justify-end max-w-[calc(100%-120px)]">
              {navItems.map((item, index) => (
                <div key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    className="group relative px-2.5 py-3 text-sm font-semibold text-neutral-700 whitespace-nowrap transition-all duration-300 ease-in-out hover:text-blue-600"
                  >
                    {/* تأثير الخلفية عند hover */}
                    <span className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-y-0 group-hover:scale-y-100 origin-bottom"></span>
                    
                    {/* تأثير الخط السفلي */}
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-l from-blue-600 via-blue-500 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right rounded-full"></span>
                    
                    {/* النص */}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {item.label}
                      <span className="w-1 h-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-0 group-hover:scale-100"></span>
                    </span>
                    
                    {/* تأثير الـ shadow */}
                    <span className="absolute inset-0 rounded-lg shadow-lg shadow-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                  </Link>
                  
                  {/* الخط الفاصل العمودي */}
                  {index < navItems.length - 1 && (
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-0.5"></div>
                  )}
                </div>
              ))}
            </nav>

            {/* Search Button */}
            <div className="flex items-center">
              {/* الخط الفاصل قبل زر البحث */}
              <div className="hidden md:block h-6 w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-2"></div>
              
              <button
                className="group relative px-3 py-2 md:px-4 md:py-2.5 rounded-lg border border-neutral-200 bg-white hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 ease-in-out shadow-sm hover:shadow-md hover:shadow-blue-200/50"
                aria-label="البحث"
              >
                <div className="flex items-center justify-center">
                  {/* أيقونة البحث */}
                  <svg
                    className="w-5 h-5 text-neutral-600 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-110 transform"
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
                
                {/* تأثير الإضاءة عند hover */}
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            </div>

            {/* Language Switcher Button */}
            <div className="flex items-center">
              {/* الخط الفاصل قبل زر اللغة */}
              <div className="hidden md:block h-6 w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent mx-2"></div>
              
              <button
                className="group relative px-3 py-2 md:px-4 md:py-2.5 rounded-lg border border-neutral-200 bg-white hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 ease-in-out shadow-sm hover:shadow-md hover:shadow-blue-200/50"
                aria-label="تغيير اللغة"
              >
                <div className="flex items-center gap-2">
                  {/* أيقونة اللغة */}
                  <svg
                    className="w-5 h-5 text-neutral-600 group-hover:text-blue-600 transition-colors duration-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                  </svg>
                  
                  {/* نص اللغة */}
                  <span className="hidden sm:inline-block text-sm font-semibold text-neutral-700 group-hover:text-blue-600 transition-colors duration-300">
                    ع
                  </span>
                  
                  {/* أيقونة السهم */}
                  <svg
                    className="w-4 h-4 text-neutral-500 group-hover:text-blue-600 group-hover:rotate-180 transition-all duration-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                {/* تأثير الإضاءة عند hover */}
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-neutral-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              aria-label="قائمة التنقل"
            >
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
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
