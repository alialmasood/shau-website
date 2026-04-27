import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAdmin } from "@/lib/adminAuthz";
import { getAdminEventById } from "@/lib/eventsAdminRepo";
import EventAdminForm from "../../EventAdminForm";

export default async function AdminEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const ok = await canAdmin("events", "edit");
  if (!ok) redirect("/admin");

  const { id } = await params;
  const row = await getAdminEventById(id);
  if (!row) notFound();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-neutral-900">تعديل الحدث</h1>
        <Link href="/admin/events" prefetch={false} className="text-sm font-bold text-[#31BD9C] hover:underline">
          ← القائمة
        </Link>
      </div>
      <EventAdminForm mode="edit" eventId={row.id} initial={row} />
    </div>
  );
}
