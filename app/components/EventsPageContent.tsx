import { getPublishedEvents } from "@/lib/eventsRepo";
import type { Locale } from "@/lib/i18n";
import EventsPublicExperience from "./EventsPublicExperience";

export default async function EventsPageContent({ locale }: { locale: Locale }) {
  const events = await getPublishedEvents(locale);
  /** وقت واحد لكل طلب — يُمرَّر للعميل ليتطابق العد التنازلي مع الخادم عند الترطيب */
  const renderedAt = Date.now();
  return <EventsPublicExperience locale={locale} events={events} renderedAt={renderedAt} />;
}
