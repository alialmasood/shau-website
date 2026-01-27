import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // تعطيل prefetch للروابط في صفحات الإدارة لتجنب مشاكل localhost في الإنتاج
  experimental: {
    // يمكن إضافة إعدادات تجريبية هنا إذا لزم الأمر
  },
};

export default nextConfig;
