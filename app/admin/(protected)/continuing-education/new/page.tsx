import Link from "next/link";
import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import CeActivityForm from "../CeActivityForm";

export default async function AdminCeNewPage() {
  const ok = await canAdmin("continuing-education", "create");
  if (!ok) redirect("/admin");
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold">نشاط جديد</h1>
        <Link href="/admin/continuing-education" className="text-sm font-bold text-[#31BD9C]">
          ← القائمة
        </Link>
      </div>
      <CeActivityForm mode="create" />
    </div>
  );
}
