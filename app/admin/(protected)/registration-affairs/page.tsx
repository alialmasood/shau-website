import Link from "next/link";

export default async function AdminRegistrationAffairsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          إدارة شؤون التسجيل
        </h1>
        <Link
          href="/admin"
          className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          رجوع
        </Link>
      </div>
      
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                المستمسكات المطلوبة
              </h2>
              <p className="text-sm text-neutral-600">
                إدارة قائمة المستمسكات المطلوبة للتسجيل
              </p>
            </div>
            <Link
              href="/admin/registration-affairs/required-documents"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              المستمسكات المطلوبة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
