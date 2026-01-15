import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import NewsTicker from "./components/NewsTicker";
import HeroSlider from "./components/HeroSlider";

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

        {/* Main Content */}
        <main className="min-h-[calc(100vh-120px)] w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-neutral-200">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-neutral-600">
            © {new Date().getFullYear()} كلية الشرق للعلوم التقنية التخصصية – جميع الحقوق محفوظة
          </div>
        </footer>
      </body>
    </html>
  );
}
