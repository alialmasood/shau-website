import Link from "next/link";
import { getProgramById } from "@/lib/programsRepo";
import ProgramForm from "../../ProgramForm";

export default async function AdminProgramsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim() ?? "";
  const initial = id ? await getProgramById(id) : null;

  if (!initial) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10">
        <p className="text-neutral-600 mb-4">البرنامج غير موجود.</p>
        <Link href="/admin/programs" className="text-[#31BD9C] font-semibold">← العودة للقائمة</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">تعديل برنامج: {initial.nameAr || initial.slug}</h1>
          <Link href="/admin/programs" className="px-4 py-2 rounded-full border border-neutral-200 font-semibold text-sm">إلغاء</Link>
        </div>
        <ProgramForm initial={initial} />
      </div>
    </div>
  );
}
