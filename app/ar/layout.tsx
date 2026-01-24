import Header from "../components/Header";
import NewsTicker from "../components/NewsTicker";
import Footer from "../components/Footer";

export default function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen w-full max-w-full flex flex-col"
    >
      <Header />
      <NewsTicker />
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
}
