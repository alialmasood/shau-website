import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "طلب هوية | كلية الشرق",
  description: "اختر نوع الهوية المناسب — كادر تدريسي أو موظف",
};

const ACADEMIC_BLUE = "#04025E";

export default function IdentityRequestChoicePage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-14" dir="rtl">
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">طلب هوية</h1>
        <p className="text-sm text-neutral-600 leading-relaxed">
          اختر نوع الهوية المناسب لشهادتك الأكاديمية
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/ar/identity-request"
          className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm hover:border-[#04025E]/40 hover:shadow-md transition-all"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
            style={{ backgroundColor: ACADEMIC_BLUE }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-[#04025E] transition-colors">
            هوية الكادر التدريسي
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">شهادة ماجستير فما فوق</p>
          <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold" style={{ color: ACADEMIC_BLUE }}>
            متابعة الطلب
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </Link>

        <Link
          href="/ar/employee-identity-request"
          className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm hover:border-[#04025E]/40 hover:shadow-md transition-all"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
            style={{ backgroundColor: ACADEMIC_BLUE }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-[#04025E] transition-colors">
            هوية موظف
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">شهادة بكالوريوس فما دون</p>
          <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold" style={{ color: ACADEMIC_BLUE }}>
            متابعة الطلب
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link href="/ar" className="text-sm font-semibold text-neutral-500 hover:text-[#04025E] transition-colors">
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
