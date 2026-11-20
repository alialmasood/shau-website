import type { Metadata } from "next";
import ConferenceHallRequestForm from "@/app/components/ConferenceHallRequestForm";
import { getTranslations } from "@/lib/i18n";
import { getConferenceHallDepartments } from "@/lib/conferenceHallRepo";

export const metadata: Metadata = {
  title: "Host an Activity | Alsharq College",
  description: "Conference hall booking and activity registration for scientific affairs approval",
};

export const dynamic = "force-dynamic";

export default async function EnConferenceHallPage() {
  const t = getTranslations("en");
  const labels = (t.conferenceHallRequest ?? {}) as Record<string, string>;
  const departments = await getConferenceHallDepartments().catch(() => []);
  return (
    <div className="w-full bg-white min-h-[70vh] py-10 px-4 sm:px-6 lg:px-8">
      <ConferenceHallRequestForm locale="en" labels={labels} departments={departments} />
    </div>
  );
}
