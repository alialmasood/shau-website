import HeroSlider from "../components/HeroSlider";
import GreenCard from "../components/GreenCard";
import NewsSection from "../components/NewsSection";
import ProgramsSection from "../components/ProgramsSection";
import InnovationSection from "../components/InnovationSection";
import TuitionFeesSection from "../components/TuitionFeesSection";
import ContactSection from "../components/ContactSection";

export default function Home() {
  return (
    <div className="w-full">
      <HeroSlider />
      <GreenCard />
      <NewsSection locale="ar" />
      <ProgramsSection />
      <InnovationSection />
      <TuitionFeesSection />
      <ContactSection />
    </div>
  );
}
