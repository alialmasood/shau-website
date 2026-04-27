import type { Metadata } from "next";
import EventsPageContent from "@/app/components/EventsPageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events | Alsharq College for Specialized Technical Sciences",
  description: "Follow events and activities at Alsharq College for Specialized Technical Sciences",
};

export default function EnEventsPage() {
  return <EventsPageContent locale="en" />;
}
