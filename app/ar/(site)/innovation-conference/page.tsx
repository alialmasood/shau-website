import type { Metadata } from "next";
import InnovationConferenceLanding from "@/app/components/innovation-conference/InnovationConferenceLanding";

export const metadata: Metadata = {
  title: "مؤتمر الشرق الدولي الأول للابتكار والإبداع 2026",
  description:
    "نبتكر اليوم... لنصنع حلول الغد. مؤتمر ومعرض ابتكارات ومسابقة في رحاب كلية الشرق التقنية الطبية الأهلية، البصرة، يوم 25 تشرين الأول 2026.",
  alternates: { canonical: "/ar/innovation-conference" },
};

export default function InnovationConferencePage() {
  return <InnovationConferenceLanding locale="ar" />;
}
