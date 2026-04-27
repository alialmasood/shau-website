import type { Metadata } from "next";
import EventsPageContent from "@/app/components/EventsPageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الأحداث | كلية الشرق للعلوم التقنية التخصصية",
  description: "تابع الفعاليات والأنشطة في كلية الشرق للعلوم التقنية التخصصية",
};

export default function ArEventsPage() {
  return <EventsPageContent locale="ar" />;
}
