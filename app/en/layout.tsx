import Header from "../components/Header";
import NewsTicker from "../components/NewsTicker";
import Footer from "../components/Footer";
import SocialMediaButtons from "../components/SocialMediaButtons";
import MobileCTABar from "../components/MobileCTABar";
import { getTranslations } from "@/lib/i18n";

export default async function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = getTranslations("en");
  const c = t.common as Record<string, string>;
  const s = t.start as Record<string, string>;
  const waNum = s.contactWhatsappNum?.trim() || "9647700000000";
  const whatsappHref = `https://wa.me/${waNum.replace(/\D/g, "") || "9647700000000"}`;

  return (
    <div
      dir="ltr"
      lang="en"
      className="min-h-screen w-full max-w-full flex flex-col"
    >
      <Header />
      <NewsTicker locale="en" />
      <main className="w-full flex-1">{children}</main>
      <Footer socialButtons={<SocialMediaButtons size="sm" />} />
      <MobileCTABar
        applyHref="/en/apply"
        whatsappHref={whatsappHref}
        applyLabel={c.mobileCtaApply}
        whatsappLabel={c.mobileCtaWhatsapp}
      />
    </div>
  );
}
