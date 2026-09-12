/**
 * انتقالات حالة طلبات مؤتمر الابتكار (لوحة الإدارة).
 */

import type { IcApplicationStatus } from "./innovationConferenceTypes";
import { IC_APPLICATION_STATUSES } from "./innovationConferenceTypes";

export const IC_STATUS_TRANSITIONS: Record<IcApplicationStatus, IcApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "NEEDS_INFO", "WITHDRAWN"],
  UNDER_REVIEW: ["NEEDS_INFO", "SCIENTIFIC_REVIEW", "REJECTED", "WITHDRAWN"],
  NEEDS_INFO: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  SCIENTIFIC_REVIEW: ["ACCEPTED", "REJECTED", "NEEDS_INFO"],
  ACCEPTED: ["FINALIST", "WITHDRAWN"],
  REJECTED: [],
  FINALIST: ["WINNER", "ACCEPTED"],
  WINNER: ["FINALIST"],
  WITHDRAWN: [],
};

export function getAllowedNextStatuses(
  current: IcApplicationStatus
): IcApplicationStatus[] {
  return IC_STATUS_TRANSITIONS[current] ?? [];
}

export function isAllowedStatusTransition(
  from: IcApplicationStatus,
  to: IcApplicationStatus
): boolean {
  if (from === to) return false;
  return getAllowedNextStatuses(from).includes(to);
}

export function isIcApplicationStatus(v: string): v is IcApplicationStatus {
  return (IC_APPLICATION_STATUSES as readonly string[]).includes(v);
}

/** ألوان شارات الأدمن */
export const IC_ADMIN_STATUS_BADGE: Record<IcApplicationStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-900",
  NEEDS_INFO: "bg-orange-100 text-orange-900",
  SCIENTIFIC_REVIEW: "bg-violet-100 text-violet-900",
  ACCEPTED: "bg-teal-100 text-teal-900",
  REJECTED: "bg-red-100 text-red-800",
  FINALIST: "bg-indigo-100 text-indigo-900",
  WINNER: "bg-emerald-100 text-emerald-900 ring-1 ring-amber-300/60",
  WITHDRAWN: "bg-neutral-200 text-neutral-700",
};
