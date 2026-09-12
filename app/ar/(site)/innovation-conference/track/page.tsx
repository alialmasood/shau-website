import type { Metadata } from "next";
import TrackApplicationForm from "@/app/components/innovation-conference/TrackApplicationForm";

export const metadata: Metadata = {
  title: "متابعة الطلب | مؤتمر الابتكار 2026",
  description:
    "تابع حالة طلب مشاركتك في مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026 باستخدام رقم المشاركة ورمز المتابعة.",
  alternates: { canonical: "/ar/innovation-conference/track" },
};

export default function InnovationConferenceTrackPage() {
  return <TrackApplicationForm />;
}
