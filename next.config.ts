import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // تعطيل prefetch للروابط في صفحات الإدارة لتجنب مشاكل localhost في الإنتاج
  // Note: prefetch={false} على Link components أفضل من تعطيله بشكل عام
};

export default nextConfig;
