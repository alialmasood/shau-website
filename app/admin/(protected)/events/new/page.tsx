import { redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import Link from "next/link";
import EventAdminForm from "../EventAdminForm";

export default async function AdminNewEventPage() {
  const ok = await canAdmin("events", "create");
  if (!ok) redirect("/admin");

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-neutral-900">حدث جديد</h1>
        <Link href="/admin/events" prefetch={false} className="text-sm font-bold text-[#31BD9C] hover:underline">
          ← القائمة
        </Link>
      </div>
      <EventAdminForm mode="create" />
    </div>
  );
}
