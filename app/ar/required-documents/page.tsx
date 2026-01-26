import Link from "next/link";

export default async function RequiredDocumentsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
          المستمسكات المطلوبة
        </h1>
        
        <div className="mb-6">
          <p className="text-neutral-700 leading-relaxed mb-4">
            يرجى الاطلاع على قائمة المستمسكات المطلوبة للتسجيل في الكلية.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/ar/required-documents/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#31BD9C] hover:bg-[#2aa88a] transition-colors shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            تحميل المستمسكات
          </Link>
        </div>
      </div>
    </div>
  );
}
