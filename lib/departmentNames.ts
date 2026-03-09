/**
 * مصدر موحد لأسماء الأقسام (كود -> اسم عربي).
 * يُستخدم في لوحة الإدارة وصفحة الطالب لضمان ظهور اسم القسم الصحيح.
 */
export const DEPARTMENT_CODE_TO_NAME: Record<string, string> = {
  DENTAL_TECH: "تقنيات صناعة الأسنان",
  ANESTHESIA_TECH: "تقنيات التخدير",
  RADIOLOGY_TECH: "تقنيات الأشعة",
  OPTICS_TECH: "تقنيات البصريات",
  EMERGENCY_MED_TECH: "تقنيات طب الطوارئ والاسعافات الاولية",
  COMMUNITY_HEALTH: "تقنيات صحة المجتمع",
  PHYSIOTHERAPY_TECH: "تقنيات العلاج الطبيعي",
  HEALTH_PHYSICS_ENG: "هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي",
  OIL_GAS_ENG: "هندسة تقنيات النفط والغاز",
  CYBERSEC_CLOUD_ENG: "هندسة تقنيات الامن السيبراني والحوسبة السحابية",
  CIVIL_CONSTRUCTION_ENG: "هندسة تقنيات البناء والانشاءات",
};

const NORMALIZE_SPACES = (s: string) => s.replace(/\s+/g, " ").trim();
const ARABIC_NAMES = new Set(Object.values(DEPARTMENT_CODE_TO_NAME).map(NORMALIZE_SPACES));

/**
 * إرجاع اسم القسم للعرض.
 * - إن كان القيمة كوداً معروفاً (مثل DENTAL_TECH) يُرجع الاسم العربي.
 * - إن كانت القيمة أصلاً اسماً عربياً معروفاً تُرجع كما هي.
 * - غير ذلك تُرجع القيمة كما وردت (لعدم إخفاء بيانات).
 */
export function getDepartmentDisplayName(value: string | null | undefined): string {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) return "—";

  const byCode = DEPARTMENT_CODE_TO_NAME[raw];
  if (byCode) return byCode;

  const normalized = NORMALIZE_SPACES(raw);
  if (ARABIC_NAMES.has(normalized)) return raw;

  for (const name of ARABIC_NAMES) {
    if (NORMALIZE_SPACES(name) === normalized) return name;
  }

  return raw;
}
