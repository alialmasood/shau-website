import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { listConferenceHallRequests } from "@/lib/conferenceHallRepo";
import ConferenceHallAdminClient from "./ConferenceHallAdminClient";

export const dynamic = "force-dynamic";

export default async function ConferenceHallAdminPage() {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("conference-hall", "access"));
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  let rows: Awaited<ReturnType<typeof listConferenceHallRequests>> = [];
  let loadError: string | null = null;
  try {
    rows = await listConferenceHallRequests(500);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    loadError = /does not exist|conference_hall_requests/i.test(msg)
      ? "جدول الطلبات غير موجود. شغّل: npm run db:migrate-conference-hall"
      : "تعذر تحميل الطلبات.";
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/admin" prefetch={false} className="text-sm text-[#31BD9C] hover:underline">
          ← العودة إلى لوحة التحكم
        </Link>
        <div className="mt-4">
          {loadError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              {loadError}
            </div>
          ) : (
            <ConferenceHallAdminClient initialRows={rows} />
          )}
        </div>
      </div>
    </div>
  );
}
