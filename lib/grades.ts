/**
 * Calculate grade based on score using official Excel formula
 * 
 * Grade ranges:
 * - 90-100: امتياز
 * - 80-89: جيد جداً
 * - 70-79: جيد
 * - 60-69: متوسط
 * - 50-59: مقبول
 * - 0-49: راسب
 */
export function calculateGrade(score: number | string | null | undefined): string {
  // Safety guard: convert to number, default to 0 if invalid
  const safeScore = Number(score) || 0;
  
  if (safeScore >= 90) return "امتياز";
  if (safeScore >= 80) return "جيد جداً";
  if (safeScore >= 70) return "جيد";
  if (safeScore >= 60) return "متوسط";
  if (safeScore >= 50) return "مقبول";
  return "راسب";
}
