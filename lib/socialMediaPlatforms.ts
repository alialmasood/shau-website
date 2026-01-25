/**
 * قائمة منصات السوشيال ميديا (بدون أي اعتماد على db/pg).
 * استخدم هذا الملف في المكوّنات العميلة (Client) مثل SocialMediaForm.
 * للدوال التي تتعامل مع قاعدة البيانات استخدم @/lib/socialMediaRepo.
 */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", labelAr: "إنستغرام", labelEn: "Instagram" },
  { key: "linkedin", labelAr: "لينكدإن", labelEn: "LinkedIn" },
  { key: "telegram", labelAr: "تيليجرام", labelEn: "Telegram" },
  { key: "tiktok", labelAr: "تيك توك", labelEn: "TikTok" },
  { key: "youtube", labelAr: "يوتيوب", labelEn: "YouTube" },
  { key: "whatsapp", labelAr: "واتساب", labelEn: "WhatsApp" },
  { key: "x", labelAr: "إكس (تويتر)", labelEn: "X (Twitter)" },
  { key: "facebook", labelAr: "فيسبوك", labelEn: "Facebook" },
] as const;
