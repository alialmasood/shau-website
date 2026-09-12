import type { Metadata } from "next";
import RegisterClosedPanel from "@/app/components/innovation-conference/RegisterClosedPanel";
import RegisterWizard from "@/app/components/innovation-conference/RegisterWizard";
import { getEdition2026, isRegistrationOpen } from "@/lib/innovationConferenceRepo";

export const metadata: Metadata = {
  title: "تسجيل المشاركة | مؤتمر الابتكار 2026",
  description:
    "سجّل مشروعك للمشاركة في مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026.",
  alternates: { canonical: "/ar/innovation-conference/register" },
};

export const dynamic = "force-dynamic";

export default async function InnovationConferenceRegisterPage() {
  const [open, edition] = await Promise.all([isRegistrationOpen(), getEdition2026()]);
  const eventDate = edition?.eventDate ?? "2026-10-25";
  const title = edition?.titleAr ?? "مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026";

  if (!open) {
    return <RegisterClosedPanel locale="ar" eventDate={eventDate} title={title} />;
  }

  return <RegisterWizard locale="ar" registrationOpen eventDate={eventDate} title={title} />;
}
