import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // تعطيل prefetch للروابط في صفحات الإدارة لتجنب مشاكل localhost في الإنتاج
  // Note: prefetch={false} على Link components أفضل من تعطيله بشكل عام
  // Playwright يجب ألا يُجمَّع مع الحزمة — وإلا يفشل chromium.launch داخل Route Handlers
  serverExternalPackages: ["playwright", "playwright-core"],
};

export default nextConfig;
