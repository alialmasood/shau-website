import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SITE_AUTHOR, SITE_ORG, buildSiteAuthorJsonLd } from "@/lib/siteAuthor";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_ORG.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: SITE_ORG.nameAr,
  description: "الموقع الرسمي لكلية الشرق",
  authors: [
    { name: SITE_AUTHOR.nameAr, url: "/humans.txt" },
    { name: SITE_AUTHOR.nameEn, url: "/humans.txt" },
  ],
  creator: SITE_AUTHOR.nameEn,
  publisher: SITE_ORG.nameAr,
  other: {
    author: `${SITE_AUTHOR.nameAr} | ${SITE_AUTHOR.nameEn}`,
    designer: SITE_AUTHOR.nameEn,
    "designer:ar": SITE_AUTHOR.nameAr,
    copyright: `${SITE_AUTHOR.nameEn} — ${SITE_AUTHOR.roleEn}`,
    "DC.creator": SITE_AUTHOR.nameEn,
    "DC.creator.ar": SITE_AUTHOR.nameAr,
    "DC.publisher": SITE_ORG.nameEn,
    "DC.rightsHolder": SITE_AUTHOR.nameEn,
  },
};

const authorJsonLd = buildSiteAuthorJsonLd(siteUrl);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-white text-neutral-900 overflow-x-hidden w-full max-w-full`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
