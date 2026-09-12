import type { Metadata } from "next";
import InnovationConferenceLanding from "@/app/components/innovation-conference/InnovationConferenceLanding";

export const metadata: Metadata = {
  title: "First Al-Sharq International Conference on Innovation & Creativity 2026",
  description:
    "Innovate today... to build tomorrow's solutions. A conference, innovation exhibition and competition hosted by Al-Sharq Private Medical Technical College, Basra, on 25 October 2026.",
  alternates: { canonical: "/en/innovation-conference" },
};

export default function EnglishInnovationConferencePage() {
  return <InnovationConferenceLanding locale="en" />;
}
