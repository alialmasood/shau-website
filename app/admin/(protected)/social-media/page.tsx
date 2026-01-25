import Link from "next/link";
import { getAllSocialLinks, SOCIAL_PLATFORMS } from "@/lib/socialMediaRepo";
import SocialMediaForm from "./SocialMediaForm";

export default async function AdminSocialMediaPage() {
  let rows: Awaited<ReturnType<typeof getAllSocialLinks>> = [];
  try {
    rows = await getAllSocialLinks();
  } catch {
    rows = [];
  }
  const initial: Record<string, string> = {};
  SOCIAL_PLATFORMS.forEach((p) => {
    initial[p.key] = rows.find((r) => r.platform === p.key)?.url ?? "";
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          إدارة السوشيال ميديا
        </h1>
        <Link
          href="/admin"
          className="inline-flex px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
        >
          رجوع
        </Link>
      </div>
      <p className="text-neutral-600 text-sm mb-6">
        أضف روابط أو أرقام واتساب/تيليجرام لحسابات إنستغرام، فيسبوك، تويتر (إكس)، يوتيوب، تيك توك، لينكدإن وغيرها. الأزرار تظهر في أي قسم تضعه فيه مكوّن <code className="bg-neutral-100 px-1 rounded">SocialMediaButtons</code>.
      </p>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <SocialMediaForm initial={initial} />
      </div>
    </div>
  );
}
