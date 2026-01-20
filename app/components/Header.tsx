"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
      { 
        label: "عن الكلية", 
        href: "/about",
        submenu: [
          { 
            label: "عن الكلية", 
            href: "/about",
            submenu: [
              { label: "حول الكلية", href: "/about" },
              { label: "مجلس الكلية", href: "/college-council" },
              { label: "الكادر الجامعي", href: "/faculty" },
              { label: "احصائيات الكلية", href: "/statistics" },
              { label: "تصنيفات الكلية", href: "/rankings" },
            ]
          },
          { 
            label: "اقسام وشعب", 
            href: "/departments",
            submenu: [
              { label: "قسم النشاطات الطلابية", href: "/student-activities" },
              { label: "قسم الشؤون العلمية", href: "/academic-affairs" },
              { label: "شعبة تكنولوجيا المعلومات", href: "/it-division" },
              { label: "شعبة الارشاد النفسي والتوجيه التربوي", href: "/psychological-guidance" },
              { label: "شعبة ضمان الجودة والاداء الجامعي", href: "/quality-assurance" },
              { label: "شعبة التعليم المستمر", href: "/continuing-education" },
              { label: "شعبة الدراسات والتخطيط", href: "/studies-planning" },
              { label: "شعبة الاتمتة الالكترونية", href: "/electronic-automation" },
            ]
          },
          { 
            label: "الاقسام الدراسية", 
            href: "/academic-departments",
            submenu: [
              { label: "قسم تقنيات صناعة الاسنان", href: "/dental-technology" },
              { label: "قسم تقنيات التخدير", href: "/anesthesia-technology" },
              { label: "قسم تقنيات الاشعة", href: "/radiology-technology" },
              { label: "قسم تقنيات البصريات", href: "/optics-technology" },
              { label: "قسم تقنيات طب الطوارئ والاسعافات الاولية", href: "/emergency-medicine" },
              { label: "قسم تقنيات صحة المجتمع", href: "/community-health" },
              { label: "قسم تقنيات العلاج الطبيعي", href: "/physical-therapy" },
              { label: "قسم هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي", href: "/medical-physics-radiotherapy" },
              { label: "قسم هندسة تقنيات النفط والغاز", href: "/oil-gas-engineering" },
              { label: "قسم هندسة تقنيات الامن السيبراني والحوسبة السحابية", href: "/cybersecurity-cloud-computing" },
              { label: "قسم هندسة تقنيات البناء والانشاءات", href: "/construction-engineering" },
            ]
          },
        ]
      },
  { 
    label: "الحياة الجامعية", 
    href: "/campus-life",
    submenu: [
      { label: "البرامج الدراسية للاقسام", href: "/academic-programs" },
      { label: "شهادات الحضور", href: "/attendance-certificates" },
      { label: "الحياة الجامعية", href: "/campus-life" },
    ]
  },
  { 
    label: "البحث العلمي", 
    href: "/research",
    submenu: [
      { label: "المستودع العراقي الرقمي للاطاريح والرسائل الجامعية", href: "/iraqi-digital-repository" },
      { label: "خدمة الاستشهاد للاطاريح والرسائل", href: "/citation-service" },
      { label: "الابحاث العلمية في الكلية", href: "/college-research" },
      { label: "مشاريع تكنولوجيا", href: "/technology-projects" },
      { 
        label: "المكتبة", 
        href: "/library",
        submenu: [
          { label: "المكتبة العراقية الافتراضية", href: "/iraqi-virtual-library" },
          { label: "مكتبة الكلية", href: "/college-library" },
        ]
      },
    ]
  },
  { label: "الاحداث", href: "/events" },
  { 
    label: "خدماتنا", 
    href: "/services",
    submenu: [
      { 
        label: "التسجيل والقبول", 
        href: "/registration-admission",
        submenu: [
          { label: "التسجيل الالكتروني", href: "/electronic-registration" },
          { label: "دليل القبول", href: "/admission-guide" },
          { label: "الوثائق المطلوبة", href: "/required-documents" },
          { label: "الرسوم الدراسية", href: "/tuition-fees" },
        ]
      },
      { 
        label: "خدمات الطلاب", 
        href: "/student-services",
        submenu: [
          { label: "الطلاب", href: "/students" },
          { label: "طلبتنا الاوائل", href: "/top-students" },
          { label: "دعم ذوي الاحتياجات الخاصة", href: "/special-needs-support" },
          { label: "خدمة المجتمع", href: "/community-service" },
          { label: "الشكاوى والمقترحات", href: "/complaints-suggestions" },
          { label: "الاسئلة الشائعة", href: "/faq" },
          { label: "التدريب والتطوير", href: "/training-development" },
          { label: "المراكز التخصصية", href: "/specialized-centers" },
          { label: "الدعم الاكاديمي", href: "/academic-support" },
          { label: "فرص التدريب", href: "/training-opportunities" },
        ]
      },
      { 
        label: "خدمات الاكاديميين", 
        href: "/academic-services",
        submenu: [
          { label: "التقويم الجامعي", href: "/academic-calendar" },
          { label: "البريد الالكتروني", href: "/email" },
          { label: "قوائم متابعة البحوث المنشورة", href: "/published-research-tracking" },
          { label: "جدول المحاضرات الاسبوعي", href: "/weekly-schedule" },
          { label: "استمارة الخطة الدراسية", href: "/study-plan-form" },
        ]
      },
    ]
  },
  { label: "المنصة البحثية", href: "https://plan.shau.edu.iq/", external: true },
  { label: "المجلة العلمية", href: "/journal" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [nestedMenuOpen, setNestedMenuOpen] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nestedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (nestedTimeoutRef.current) {
        clearTimeout(nestedTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-[100] w-full bg-white shadow-sm border-b border-neutral-200 overflow-x-hidden overflow-y-visible md:overflow-visible">
      <div className="w-full px-4 md:pr-8 md:pl-10 lg:pr-10 lg:pl-14 xl:pr-12 xl:pl-20 overflow-visible">
        <div className="flex items-center justify-between h-16 md:h-20 lg:h-24 gap-2 sm:gap-3 md:gap-4">
          
          {/* المنطقة 1: الشعار (Logo) - اليسار - ثابت لا ينضغط */}
          <div 
            className="flex items-center justify-center shrink whitespace-nowrap overflow-hidden max-w-[220px] sm:max-w-[260px] md:max-w-[320px] md:min-w-[320px] md:w-[320px] md:shrink-0"
          >
            <Link href="/" className="flex items-center justify-center w-full h-full">
              <div 
                className="relative flex items-center justify-center overflow-visible h-10 md:h-auto w-auto"
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
          <nav className="hidden md:flex items-center justify-center flex-1 min-w-0 max-w-none overflow-visible px-2">
            <div className="flex items-center justify-center gap-0 flex-nowrap overflow-visible">
              {navItems.map((item, index) => (
                <div 
                  key={item.href} 
                  className="flex items-center flex-shrink-0 relative"
                >
                  {item.submenu ? (
                    <div 
                      className="relative"
                      onMouseEnter={() => {
                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current);
                          timeoutRef.current = null;
                        }
                        setOpenMenu(item.href);
                      }}
                      onMouseLeave={() => {
                        timeoutRef.current = setTimeout(() => {
                          setOpenMenu(null);
                        }, 200); // تأخير 200ms قبل الإغلاق
                      }}
                    >
                      <button
                        onClick={() => setOpenMenu(openMenu === item.href ? null : item.href)}
                        className="group relative px-2.5 py-2.5 text-sm font-semibold text-neutral-700 whitespace-nowrap transition-all duration-300 ease-in-out hover:text-[#31BD9C] border-2 border-transparent hover:border-[#31BD9C] rounded-lg flex items-center gap-1"
                      >
                        {/* النص */}
                        <span className="relative z-10 flex items-center">
                          {item.label}
                        </span>
                        {/* أيقونة السهم */}
                        <svg
                          className={`w-3 h-3 transition-transform duration-300 ${openMenu === item.href ? 'rotate-180' : ''}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>

                      {/* القائمة المنبثقة */}
                      {openMenu === item.href && (
                        <div 
                          className="absolute top-full right-0 pt-2 w-64 bg-transparent z-[9999] overflow-visible"
                          onMouseEnter={() => {
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current);
                              timeoutRef.current = null;
                            }
                          }}
                          onMouseLeave={() => {
                            timeoutRef.current = setTimeout(() => {
                              setOpenMenu(null);
                            }, 200);
                          }}
                        >
                          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#31BD9C] overflow-visible backdrop-blur-sm animate-dropdown">
                          {/* تأثير الإضاءة العلوي */}
                          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C]"></div>
                          
                          <div className="py-2 overflow-visible">
                            {item.submenu.map((subItem, subIndex) => {
                              const isNestedOpen = nestedMenuOpen === subItem.href;
                              return (
                              <div
                                key={subItem.href}
                                className="relative overflow-visible"
                                onMouseEnter={() => {
                                  if (subItem.submenu) {
                                    if (nestedTimeoutRef.current) {
                                      clearTimeout(nestedTimeoutRef.current);
                                      nestedTimeoutRef.current = null;
                                    }
                                    setNestedMenuOpen(subItem.href);
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (subItem.submenu) {
                                    nestedTimeoutRef.current = setTimeout(() => {
                                      setNestedMenuOpen(null);
                                    }, 200);
                                  }
                                }}
                              >
                                {subItem.submenu ? (
                                  <div className="group relative block px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:text-[#31BD9C] transition-all duration-300 hover:bg-gradient-to-l hover:from-[#31BD9C]/10 hover:to-transparent cursor-pointer">
                                    <div className="flex items-center gap-3 relative">
                                      {/* خط جانبي يظهر عند hover */}
                                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#31BD9C] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r-full"></div>
                                      
                                      {/* أيقونة */}
                                      <div className="w-2 h-2 rounded-full bg-[#31BD9C] opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300"></div>
                                      
                                      <span className="flex-1 relative z-10">{subItem.label}</span>
                                      
                                      {/* أيقونة السهم */}
                                      <svg
                                        className={`w-4 h-4 text-[#31BD9C] transition-all duration-300 ${isNestedOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0'}`}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M9 5l7 7-7 7"></path>
                                      </svg>
                                    </div>
                                    
                                    {/* خط فاصل */}
                                    {subIndex < item.submenu.length - 1 && (
                                      <div className="absolute bottom-0 right-5 left-5 h-px bg-gradient-to-r from-transparent via-neutral-100 to-transparent"></div>
                                    )}

                                    {/* القائمة المتداخلة */}
                                    {isNestedOpen && subItem.submenu && (
                                      <div 
                                        className="absolute top-0 right-full mr-2 w-64 bg-transparent z-[10000]"
                                        onMouseEnter={() => {
                                          if (nestedTimeoutRef.current) {
                                            clearTimeout(nestedTimeoutRef.current);
                                            nestedTimeoutRef.current = null;
                                          }
                                          setNestedMenuOpen(subItem.href);
                                        }}
                                        onMouseLeave={() => {
                                          nestedTimeoutRef.current = setTimeout(() => {
                                            setNestedMenuOpen(null);
                                          }, 200);
                                        }}
                                      >
                                        <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#31BD9C] overflow-hidden backdrop-blur-sm animate-dropdown" style={{ display: 'block', visibility: 'visible' as const, opacity: 1 }}>
                                          {/* تأثير الإضاءة العلوي */}
                                          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#31BD9C] via-[#2aa88a] to-[#31BD9C]"></div>
                                          
                                          <div className="py-2">
                                            {subItem.submenu.map((nestedItem, nestedIndex) => (
                                              <Link
                                                key={nestedItem.href}
                                                href={nestedItem.href}
                                                className="group relative block px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:text-[#31BD9C] transition-all duration-300 hover:bg-gradient-to-l hover:from-[#31BD9C]/10 hover:to-transparent"
                                              >
                                                <div className="flex items-center gap-3 relative">
                                                  {/* خط جانبي يظهر عند hover */}
                                                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#31BD9C] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r-full"></div>
                                                  
                                                  {/* أيقونة */}
                                                  <div className="w-2 h-2 rounded-full bg-[#31BD9C] opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300"></div>
                                                  
                                                  <span className="flex-1 relative z-10">{nestedItem.label}</span>
                                                  
                                                  {/* أيقونة السهم */}
                                                  <svg
                                                    className="w-4 h-4 text-[#31BD9C] opacity-0 group-hover:opacity-100 transform -translate-x-3 group-hover:translate-x-0 transition-all duration-300"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2.5"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                  >
                                                    <path d="M9 5l7 7-7 7"></path>
                                                  </svg>
                                                </div>
                                                
                                                {/* خط فاصل */}
                                                {nestedIndex < subItem.submenu.length - 1 && (
                                                  <div className="absolute bottom-0 right-5 left-5 h-px bg-gradient-to-r from-transparent via-neutral-100 to-transparent"></div>
                                                )}
                                              </Link>
                                            ))}
                                          </div>
                                          
                                          {/* تأثير الإضاءة السفلي */}
                                          <div className="absolute bottom-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#31BD9C]/20 to-transparent"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Link
                                    href={subItem.href}
                                    className="group relative block px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:text-[#31BD9C] transition-all duration-300 hover:bg-gradient-to-l hover:from-[#31BD9C]/10 hover:to-transparent"
                                  >
                                    <div className="flex items-center gap-3 relative">
                                      {/* خط جانبي يظهر عند hover */}
                                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#31BD9C] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center rounded-r-full"></div>
                                      
                                      {/* أيقونة */}
                                      <div className="w-2 h-2 rounded-full bg-[#31BD9C] opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300"></div>
                                      
                                      <span className="flex-1 relative z-10">{subItem.label}</span>
                                      
                                      {/* أيقونة السهم */}
                                      <svg
                                        className="w-4 h-4 text-[#31BD9C] opacity-0 group-hover:opacity-100 transform -translate-x-3 group-hover:translate-x-0 transition-all duration-300"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M9 5l7 7-7 7"></path>
                                      </svg>
                                    </div>
                                    
                                    {/* خط فاصل */}
                                    {subIndex < item.submenu.length - 1 && (
                                      <div className="absolute bottom-0 right-5 left-5 h-px bg-gradient-to-r from-transparent via-neutral-100 to-transparent"></div>
                                    )}
                                  </Link>
                                )}
                              </div>
                            );
                            })}
                          </div>
                          
                          {/* تأثير الإضاءة السفلي */}
                          <div className="absolute bottom-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#31BD9C]/20 to-transparent"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative px-2.5 py-2.5 text-sm font-semibold text-neutral-700 whitespace-nowrap transition-all duration-300 ease-in-out hover:text-[#31BD9C] border-2 border-transparent hover:border-[#31BD9C] rounded-lg"
                      >
                        {/* النص */}
                        <span className="relative z-10 flex items-center">
                          {item.label}
                        </span>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="group relative px-2.5 py-2.5 text-sm font-semibold text-neutral-700 whitespace-nowrap transition-all duration-300 ease-in-out hover:text-[#31BD9C] border-2 border-transparent hover:border-[#31BD9C] rounded-lg"
                      >
                        {/* النص */}
                        <span className="relative z-10 flex items-center">
                          {item.label}
                        </span>
                      </Link>
                    )
                  )}
                  
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
            {/* Search Button */}
            <button
              className="group relative flex items-center justify-center w-9 h-9 bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-[#31BD9C] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#31BD9C] focus:ring-offset-2"
              aria-label="البحث"
            >
              <svg
                className="w-4 h-4 text-neutral-400 group-hover:text-[#31BD9C] transition-colors duration-200"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>

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
              className="md:hidden flex-shrink-0 p-2 text-neutral-700 hover:text-[#31BD9C] rounded-lg hover:bg-[#31BD9C]/5 transition-colors duration-200"
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
          <div className="md:hidden border-t border-neutral-200 bg-white animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col py-4">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 text-sm font-semibold text-neutral-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-3 text-sm font-semibold text-neutral-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 border-b border-neutral-100 last:border-b-0"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
