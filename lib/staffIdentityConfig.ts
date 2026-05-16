/** اسم الجهة المصدرة للهوية */
export const STAFF_IDENTITY_COLLEGE_AR = "كلية الشرق التقنية التخصصية";

/** عنوان الموقع في روابط QR */
export function getStaffSiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "";
  if (fromEnv) return fromEnv;
  return "https://shau.edu.iq";
}

export function staffMediaUrl(photoMediaId: string): string {
  return `${getStaffSiteBaseUrl()}/api/media/${photoMediaId}`;
}
