/**
 * نصوص حالات طلب مؤتمر الابتكار — آمن للعميل والخادم.
 */

import type { IcApplicationStatus } from "./innovationConferenceTypes";
import { IC_APPLICATION_STATUSES } from "./innovationConferenceTypes";

export type IcStatusPublicCopy = {
  status: IcApplicationStatus;
  title: string;
  message: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

const COPY: Record<IcApplicationStatus, Omit<IcStatusPublicCopy, "status">> = {
  SUBMITTED: {
    title: "تم استلام طلبك",
    message: "تم استلام طلب المشاركة بنجاح وهو بانتظار بدء المراجعة.",
    tone: "info",
  },
  UNDER_REVIEW: {
    title: "الطلب قيد المراجعة الأولية",
    message: "تقوم اللجنة حالياً بمراجعة البيانات والمرفقات.",
    tone: "info",
  },
  NEEDS_INFO: {
    title: "مطلوب استكمال معلومات",
    message:
      "يحتاج الطلب إلى معلومات أو مرفقات إضافية. سيتم التواصل معك عبر بيانات الاتصال المسجلة.",
    tone: "warning",
  },
  SCIENTIFIC_REVIEW: {
    title: "قيد التقييم العلمي",
    message: "انتقل مشروعك إلى مرحلة التقييم العلمي.",
    tone: "info",
  },
  ACCEPTED: {
    title: "مقبول للمشاركة",
    message:
      "تهانينا، تم قبول المشروع للمشاركة في المؤتمر. سيتم تزويدك بالتفاصيل التنظيمية لاحقاً.",
    tone: "success",
  },
  REJECTED: {
    title: "اكتملت مراجعة الطلب",
    message:
      "بعد استكمال عملية التقييم، لم يتم اختيار المشروع للمشاركة في هذه النسخة من المؤتمر.",
    tone: "danger",
  },
  FINALIST: {
    title: "متأهل للمرحلة النهائية",
    message: "تم اختيار المشروع ضمن المشاريع المتأهلة للمرحلة النهائية.",
    tone: "success",
  },
  WINNER: {
    title: "مشروع فائز",
    message: "تهانينا، تم اختيار مشروعك ضمن المشاريع الفائزة في المؤتمر.",
    tone: "success",
  },
  WITHDRAWN: {
    title: "تم سحب الطلب",
    message: "تم تسجيل انسحاب المشروع من المشاركة في المؤتمر.",
    tone: "neutral",
  },
};

export function getStatusPublicCopy(status: string): IcStatusPublicCopy {
  const s = (IC_APPLICATION_STATUSES as readonly string[]).includes(status)
    ? (status as IcApplicationStatus)
    : "SUBMITTED";
  return { status: s, ...COPY[s] };
}

/** مراحل بصرية مساعدة (ليست timeline حرفي لكل حالة) */
export const IC_TRACK_PROGRESS_STEPS = [
  { id: "received", label: "تم الاستلام" },
  { id: "initial", label: "المراجعة الأولية" },
  { id: "scientific", label: "التقييم العلمي" },
  { id: "decision", label: "القرار" },
  { id: "finals", label: "النهائيات" },
] as const;

export type IcProgressVisual = {
  /** فهرس المرحلة الحالية 0–4، أو -1 إن لم تُعرض كمسار نجاح */
  activeIndex: number;
  /** true إذا اكتملت المرحلة i */
  completed: boolean[];
  /** مسار سلبي (رفض / سحب) */
  terminalNegative: boolean;
};

export function getTrackProgressVisual(status: IcApplicationStatus): IcProgressVisual {
  const completed = [false, false, false, false, false];
  let activeIndex = 0;
  let terminalNegative = false;

  switch (status) {
    case "SUBMITTED":
      activeIndex = 0;
      break;
    case "UNDER_REVIEW":
    case "NEEDS_INFO":
      completed[0] = true;
      activeIndex = 1;
      break;
    case "SCIENTIFIC_REVIEW":
      completed[0] = completed[1] = true;
      activeIndex = 2;
      break;
    case "ACCEPTED":
      completed[0] = completed[1] = completed[2] = true;
      activeIndex = 3;
      completed[3] = true;
      break;
    case "REJECTED":
      completed[0] = completed[1] = completed[2] = true;
      activeIndex = 3;
      terminalNegative = true;
      break;
    case "FINALIST":
      completed[0] = completed[1] = completed[2] = completed[3] = true;
      activeIndex = 4;
      break;
    case "WINNER":
      completed[0] = completed[1] = completed[2] = completed[3] = completed[4] = true;
      activeIndex = 4;
      break;
    case "WITHDRAWN":
      activeIndex = -1;
      terminalNegative = true;
      break;
    default:
      activeIndex = 0;
  }

  return { activeIndex, completed, terminalNegative };
}

export function listAllStatusPublicCopy(): IcStatusPublicCopy[] {
  return IC_APPLICATION_STATUSES.map((s) => getStatusPublicCopy(s));
}
