import type { Metadata } from "next";
import RegisterClosedPanel from "@/app/components/innovation-conference/RegisterClosedPanel";
import RegisterWizard from "@/app/components/innovation-conference/RegisterWizard";
import { getEdition2026, isRegistrationOpen } from "@/lib/innovationConferenceRepo";

export const metadata: Metadata = {
  title: "Registration | Innovation Conference 2026",
  description:
    "Register your project for the First Al-Sharq International Conference on Innovation & Creativity 2026.",
  alternates: { canonical: "/en/innovation-conference/register" },
};

export const dynamic = "force-dynamic";

export default async function EnglishInnovationConferenceRegisterPage() {
  const [open, edition] = await Promise.all([isRegistrationOpen(), getEdition2026()]);
  const eventDate = edition?.eventDate ?? "2026-10-25";
  const title =
    edition?.titleEn ??
    "the First Al-Sharq International Conference on Innovation & Creativity 2026";

  if (!open) {
    return <RegisterClosedPanel locale="en" eventDate={eventDate} title={title} />;
  }

  return <RegisterWizard locale="en" registrationOpen eventDate={eventDate} title={title} />;
}
