/** اسم الجهة المصدرة للهوية */
export const STAFF_IDENTITY_COLLEGE_AR = "كلية الشرق التقنية التخصصية";

/** عنوان الموقع في روابط QR (يفضّل الإنتاج حتى في التطوير عند المسح من الهاتف) */
export function getStaffSiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "";
  if (fromEnv && !fromEnv.includes("localhost") && !fromEnv.includes("127.0.0.1")) {
    return fromEnv;
  }
  return "https://shau.edu.iq";
}

export function staffMediaUrl(photoMediaId: string): string {
  return `${getStaffSiteBaseUrl()}/api/media/${photoMediaId}`;
}
