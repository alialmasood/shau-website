import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import { getAdminCeById } from "@/lib/ceAdminRepo";
import CeActivityForm from "../../CeActivityForm";

export default async function AdminCeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await canAdmin("continuing-education", "edit");
  if (!ok) redirect("/admin");
  const { id } = await params;
  const row = await getAdminCeById(id);
  if (!row) notFound();
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold">تعديل النشاط</h1>
        <Link href="/admin/continuing-education" className="text-sm font-bold text-[#31BD9C]">
          ← القائمة
        </Link>
      </div>
      <CeActivityForm mode="edit" activityId={row.id} initial={row} />
    </div>
  );
}
