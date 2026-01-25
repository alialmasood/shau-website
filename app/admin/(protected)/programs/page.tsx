import Link from "next/link";
import { getAllPrograms } from "@/lib/programsRepo";
import { DeleteProgramButton } from "./DeleteProgramButton";

const STUDY_LABELS: Record<string, string> = {
  morning: "صباحي",
  evening: "مسائي",
  both: "صباحي ومسائي",
};

export default async function AdminProgramsPage() {
  const rows = await getAllPrograms();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">إدارة برامج الكلية</h1>
        <div className="flex gap-2">
          <Link href="/admin/programs/new" className="px-4 py-2 rounded-full bg-[#31BD9C] text-white text-sm font-bold hover:bg-[#2aa88a]">
            إضافة برنامج
          </Link>
          <Link href="/admin" className="px-4 py-2 rounded-full border border-neutral-200 text-sm font-semibold hover:border-[#31BD9C]">
            لوحة التحكم
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-neutral-600 mb-4">لا توجد برامج. أضف برنامجاً من الزر أعلاه.</p>
          <Link href="/admin/programs/new" className="text-[#31BD9C] font-semibold hover:underline">إضافة برنامج</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-neutral-800">الاسم (عربي)</th>
                <th className="px-4 py-3 font-semibold text-neutral-800">الرابط</th>
                <th className="px-4 py-3 font-semibold text-neutral-800">التوقيت</th>
                <th className="px-4 py-3 font-semibold text-neutral-800">الحالة</th>
                <th className="px-4 py-3 font-semibold text-neutral-800">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">{r.nameAr || r.slug}</td>
                  <td className="px-4 py-3 font-mono text-sm">{r.slug}</td>
                  <td className="px-4 py-3">{STUDY_LABELS[r.studyShift] || r.studyShift}</td>
                  <td className="px-4 py-3">{r.isActive ? "ظاهر" : "مخفي"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link href={`/admin/programs/${r.id}/edit`} className="text-[#31BD9C] font-semibold hover:underline">تعديل</Link>
                    <DeleteProgramButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/admin" className="inline-block mt-6 text-[#31BD9C] font-semibold hover:underline">← رجوع للأدمن</Link>
    </div>
  );
}
