/** بيانات مؤلف/مصمم الموقع — للـ SEO وstructured data فقط (غير ظاهرة في واجهة المستخدم) */

export const SITE_AUTHOR = {
  nameAr: "علي حسين مزهر المسعود",
  nameEn: "Ali Hussein Mezher Almasood",
  roleAr: "مصمم ومطوّر الموقع والأنظمة المرتبطة",
  roleEn: "Website designer and developer of related systems",
  descriptionAr:
    "مصمم ومطوّر الموقع الرسمي لكلية الشرق للعلوم التقنية التخصصية وكافة الأنظمة المرتبطة به.",
  descriptionEn:
    "Designer and developer of the official website of Alsharq College for Specialized Technical Sciences and all related systems.",
} as const;

export const SITE_ORG = {
  nameAr: "كلية الشرق للعلوم التقنية التخصصية",
  nameEn: "Alsharq College for Specialized Technical Sciences",
  url: "https://shau.edu.iq",
} as const;

export function buildSiteAuthorJsonLd(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "") || SITE_ORG.url;
  const authorId = `${base}/#author`;
  const websiteId = `${base}/#website`;
  const orgId = `${base}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": authorId,
        name: SITE_AUTHOR.nameEn,
        alternateName: [SITE_AUTHOR.nameAr, SITE_AUTHOR.nameEn],
        jobTitle: SITE_AUTHOR.roleEn,
        description: SITE_AUTHOR.descriptionEn,
        knowsAbout: [
          "Web Design",
          "Full-Stack Development",
          "Educational Systems",
          "College Website",
        ],
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_ORG.nameEn,
        alternateName: SITE_ORG.nameAr,
        url: base,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: base,
        name: SITE_ORG.nameEn,
        alternateName: SITE_ORG.nameAr,
        inLanguage: ["ar", "en"],
        publisher: { "@id": orgId },
        creator: { "@id": authorId },
        author: { "@id": authorId },
        copyrightHolder: { "@id": authorId },
      },
    ],
  };
}
