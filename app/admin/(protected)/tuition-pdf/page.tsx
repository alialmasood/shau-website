import Link from "next/link";
import { getTuitionPdfInfo } from "@/lib/tuitionPdfRepo";
import { setTuitionPdf } from "./actions";
import TuitionPdfForm from "./TuitionPdfForm";

export default async function AdminTuitionPdfPage() {
  let current = await getTuitionPdfInfo();

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            تحميل الرسوم الدراسية PDF
          </h1>
          <Link
            href="/admin"
            className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            رجوع
          </Link>
        </div>

        <p className="text-neutral-600 text-sm mb-6">
          ارفع ملف PDF يُعرَض كمرجع للطلاب لتحميل دليل الرسوم الدراسية. الملف يظهر في الهوم بيج ضمن قسم الرسوم الدراسية عبر زر «تحميل دليل الرسوم PDF».
        </p>

        {current ? (
          <div className="mb-8 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
            <p className="text-sm font-medium text-neutral-700 mb-2">الملف المعيّن حالياً:</p>
            <a
              href={`/api/media/${current.mediaId}`}
              download
              className="inline-flex items-center gap-2 text-[#31BD9C] font-semibold hover:underline"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {current.filename}
            </a>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm mb-6">لا يوجد ملف PDF معيّن. ارفع ملفاً لأول مرة.</p>
        )}

        <div className="rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            {current ? "استبدال الملف" : "رفع ملف PDF"}
          </h2>
          <TuitionPdfForm setTuitionPdfAction={setTuitionPdf} />
        </div>
      </div>
    </div>
  );
}
