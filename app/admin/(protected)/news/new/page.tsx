import Link from "next/link";
import NewNewsForm from "./NewNewsForm";

export default function AdminNewNewsPage() {
  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              إنشاء خبر جديد
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              ارفع صورة الغلاف وأنشئ الخبر، وسيتم عرضه للعامة عند النشر.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            رجوع
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 sm:p-8">
          <NewNewsForm />
        </div>
      </div>
    </div>
  );
}

