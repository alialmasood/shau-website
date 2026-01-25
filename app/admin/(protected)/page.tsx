import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            لوحة التحكم
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/news"
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a] transition-colors"
            >
              الأخبار
            </Link>
            <Link
              href="/admin/ticker"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-bold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
            >
              الشريط الإخباري
            </Link>
            <Link
              href="/admin/tuition-fees"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-bold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
            >
              إدارة الرسوم الدراسية
            </Link>
            <Link
              href="/admin/applications"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-neutral-200 text-neutral-800 text-sm font-bold hover:border-[#31BD9C] hover:text-[#31BD9C] transition-colors"
            >
              طلبات التقديم
            </Link>
            <Link
              href="/admin/logout"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              تسجيل خروج
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6">
          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
            هذه صفحة لوحة تحكم مبدئية. الخطوة القادمة: إدارة الأخبار (إنشاء/تعديل/نشر)،
            وإدارة شريط الأخبار (Ticker)، ورفع الوسائط (Media).
          </p>
        </div>
      </div>
    </div>
  );
}

