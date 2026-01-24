import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shau.edu.iq";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "كلية الشرق للعلوم التقنية التخصصية",
  description: "الموقع الرسمي لكلية الشرق",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-white text-neutral-900 overflow-x-hidden`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
