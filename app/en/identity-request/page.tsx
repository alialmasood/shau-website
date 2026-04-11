import type { Metadata } from "next";
import StaffIdentityRequestForm from "@/app/components/StaffIdentityRequestForm";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Staff identity request | Alsharq College",
  description: "Apply for a staff identity card at Alsharq College for Specialized Technical Sciences",
};

export default function IdentityRequestPageEn() {
  const t = getTranslations("en");
  const labels = t.identityRequest as Record<string, string>;
  return <StaffIdentityRequestForm locale="en" labels={labels} />;
}
