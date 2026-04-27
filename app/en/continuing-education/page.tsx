import type { Metadata } from "next";
import CeDepartmentContent from "@/app/components/CeDepartmentContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Continuing Education | Alsharq College for Specialized Technical Sciences",
  description: "Seminars, workshops, courses, and participation certificates",
};

export default function EnContinuingEducationPage() {
  return <CeDepartmentContent locale="en" />;
}
