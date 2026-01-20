import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import NewsTicker from "./components/NewsTicker";
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
          overflow-x-hidden
        `}
      >
        <div className="min-h-screen w-full max-w-full flex flex-col">
          <Header />
          <NewsTicker />
          <main className="w-full flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
