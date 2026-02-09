export const DEPARTMENT_CODE_MAP: Record<string, string> = {
  "تقنيات صـــناعـــــــة الاســــنان": "DN",
  "تقنــــــــــــــــــــيات التـخـــديــــــــر": "AN",
  "تقنيـــــــــــــات الاشـــــــــــــــــعــة": "XR",
  "تقـــــــــــــــنيات البصـــــــــــريات": "OP",
  "تقنـــــــــيات طــب الطــــــوارئ": "ER",
  "تقنيات صحــــــة المجتمـــــــــع": "CH",
  "تقنـــيات العــلاج الطبيعــــــــي": "PT",
  "هندسة تقنيات الفيزياء الصحية": "HP",
  "هندسـة تقنيات النفط والغـاز": "OG",
  "هندسة تقنيات الامن السيبراني": "CS",
  "هندسة تقنيات البناء والانشاءات": "CE",
};

export const SERIAL_PREFIX = "SH";
export const SERIAL_START = 20;

function normalizeDepartmentLabel(label: string): string {
  return String(label || "")
    .trim()
    .replace(/[\sـ]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, "")
    .toLowerCase();
}

const NORMALIZED_DEPARTMENT_CODE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DEPARTMENT_CODE_MAP).map(([key, value]) => [normalizeDepartmentLabel(key), value])
);

export function getDepartmentCode(label: string): string | null {
  const direct = DEPARTMENT_CODE_MAP[label];
  if (direct) return direct;
  const normalized = normalizeDepartmentLabel(label);
  return NORMALIZED_DEPARTMENT_CODE_MAP[normalized] ?? null;
}

export function buildSerial(deptCode: string, date: Date, seq: number) {
  const year = String(date.getFullYear() % 100).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const serial = String(seq).padStart(5, "0");
  return `${SERIAL_PREFIX}-${deptCode}${year}${month}-${serial}`;
}

export function getNextSequence(lastSerial: string | null): number {
  if (!lastSerial) return SERIAL_START;
  const part = lastSerial.split("-").pop() || "";
  const num = Number.parseInt(part, 10);
  if (!Number.isFinite(num)) return SERIAL_START;
  return Math.max(SERIAL_START, num + 1);
}
