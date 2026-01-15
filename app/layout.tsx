import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import NewsTicker from "./components/NewsTicker";
import HeroSlider from "./components/HeroSlider";
import GreenCard from "./components/GreenCard";
import NewsSection from "./components/NewsSection";
import ProgramsSection from "./components/ProgramsSection";
import InnovationSection from "./components/InnovationSection";
import TuitionFeesSection from "./components/TuitionFeesSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "كلية الشرق للعلوم التقنية التخصصية",
  description: "الموقع الرسمي لكلية الشرق",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`
          ${cairo.variable}
          font-sans
          antialiased
          bg-white
          text-neutral-900
        `}
      >
        <Header />
        <NewsTicker />
        <HeroSlider />
        <GreenCard />
        <NewsSection />
        <ProgramsSection />
        <InnovationSection />
        <TuitionFeesSection />
        <ContactSection />

        {/* Footer */}
        <Footer />

        {/* Main Content */}
        {children && (
          <main className="w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
