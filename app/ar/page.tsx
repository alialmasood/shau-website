import HeroSlider from "../components/HeroSlider";
import SocialMediaButtons from "../components/SocialMediaButtons";
import GreenCard from "../components/GreenCard";
import NewsSection from "../components/NewsSection";
import ProgramsSection from "../components/ProgramsSection";
import InnovationSection from "../components/InnovationSection";
import TuitionFeesSection from "../components/TuitionFeesSection";
import ContactSection from "../components/ContactSection";
import { getDepartmentFeesForPage } from "@/lib/departmentFeeRepo";
import { getTuitionPdfMediaId } from "@/lib/tuitionPdfRepo";
import { getActivePrograms } from "@/lib/programsRepo";

function fmt(s: string) {
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("en-US") : String(s);
}
function gpa(s: string) {
  return String(s).includes("%") ? String(s) : String(s) + "%";
}

export default async function Home() {
  let tuitionItems: { id: string; slug: string; name: string; image: string; admissionKey: string; morningPrice: string; eveningPrice: string; morningMinGPA: string; eveningMinGPA: string }[] | undefined;
  let programItems: { id: string; slug: string; name: string; image: string }[] | undefined;
  let tuitionPdfMediaId: string | null = null;
  try {
    tuitionPdfMediaId = await getTuitionPdfMediaId();
  } catch {
    tuitionPdfMediaId = null;
  }
  try {
    const rows = await getDepartmentFeesForPage();
    tuitionItems = rows.map((r) => ({
      id: r.id,
      slug: r.departmentSlug,
      name: r.displayName || r.departmentSlug,
      image: r.cardImageId ? `/api/media/${r.cardImageId}` : "/hero-image-1.jpg",
      admissionKey: (r.categories || [])[0] ?? "",
      morningPrice: fmt(r.morningPrice),
      eveningPrice: fmt(r.eveningPrice),
      morningMinGPA: gpa(r.morningMinGpa),
      eveningMinGPA: gpa(r.eveningMinGpa),
    }));
    if (tuitionItems.length === 0) tuitionItems = undefined;
  } catch {
    tuitionItems = undefined;
  }
  try {
    const progs = await getActivePrograms();
    programItems = progs.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.nameAr || p.slug,
      image: p.image1Id ? `/api/media/${p.image1Id}` : "/hero-image-1.jpg",
    }));
    if (programItems.length === 0) programItems = undefined;
  } catch {
    programItems = undefined;
  }
  return (
    <div className="w-full">
      <HeroSlider socialButtons={<SocialMediaButtons direction="column" />} />
      <GreenCard />
      <NewsSection locale="ar" />
      <ProgramsSection items={programItems} base="/ar" />
      <InnovationSection />
      <TuitionFeesSection items={tuitionItems} tuitionPdfMediaId={tuitionPdfMediaId} />
      <ContactSection />
    </div>
  );
}
