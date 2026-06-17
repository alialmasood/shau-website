import type { Metadata } from "next";
import StrategicPlanView from "@/app/components/StrategicPlanView";

export const metadata: Metadata = {
  title: "Strategic Plan | Alsharq College for Specialized Technical Sciences",
  description: "Strategic plan for scientific research at Alsharq College for Specialized Technical Sciences",
};

export default function EnStrategicPlanPage() {
  return <StrategicPlanView locale="en" />;
}
