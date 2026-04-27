import { getPublishedCeActivities } from "@/lib/ceRepo";
import type { Locale } from "@/lib/i18n";
import CeDepartmentView from "./CeDepartmentView";

export default async function CeDepartmentContent({ locale }: { locale: Locale }) {
  const activities = await getPublishedCeActivities(locale);
  const renderedAt = Date.now();
  return <CeDepartmentView locale={locale} activities={activities} renderedAt={renderedAt} />;
}
