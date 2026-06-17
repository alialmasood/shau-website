import type { Metadata } from "next";
import StrategicPlanView from "@/app/components/StrategicPlanView";

export const metadata: Metadata = {
  title: "الخطة الاستراتيجية | كلية الشرق للعلوم التقنية التخصصية",
  description: "الخطة الاستراتيجية للبحث العلمي في كلية الشرق للعلوم التقنية التخصصية",
};

export default function ArStrategicPlanPage() {
  return <StrategicPlanView locale="ar" />;
}
