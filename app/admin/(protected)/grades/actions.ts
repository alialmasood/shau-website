"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getResultById, updateResultSubjectsAndSummary } from "@/lib/resultsRepo";
import { calculateFinalEvaluation, calculateFinalResult, calculateFinalNumeric } from "@/lib/grades";
import { revalidatePath } from "next/cache";

type SubjectRow = {
  name?: string;
  score?: number | string | null;
  units?: number | string | null;
  [key: string]: unknown;
};

async function ensureGradesAccess(action: "access" | "create" | "edit" | "delete") {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  if (roleUpper === "ADMIN" || roleUpper === "EXAM_COMMITTEE") {
    return user;
  }

  const allowed = await canAdmin("grades", action);
  if (!allowed) {
    throw new Error("ليس لديك صلاحية لإدارة الدرجات");
  }

  return user;
}

function normalizeSubjectName(name: string): string {
  return name.trim();
}

function isUnitsSubject(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.includes("وحدات") || n.includes("units") || n === "عدد الوحدات";
}

function recalcSummary(subjects: SubjectRow[], existingSummary: Record<string, unknown>) {
  const actualSubjects = subjects.filter((s) => !isUnitsSubject(String(s.name || "")));

  const scores: number[] = [];
  let totalUnits = 0;
  let sumScoreTimesUnits = 0;
  let sumScores = 0;

  for (const subject of actualSubjects) {
    const scoreNum =
      typeof subject.score === "number" ? subject.score : Number(subject.score) || 0;
    const unitsNum =
      typeof subject.units === "number" ? subject.units : Number(subject.units) || 0;

    scores.push(scoreNum);
    sumScores += scoreNum;
    totalUnits += unitsNum;
    sumScoreTimesUnits += scoreNum * unitsNum;
  }

  const hasUnits = totalUnits > 0;
  const total = hasUnits ? sumScoreTimesUnits : sumScores;
  const avg =
    actualSubjects.length > 0
      ? Math.round(((hasUnits ? sumScoreTimesUnits / totalUnits : sumScores / actualSubjects.length) || 0) * 100) / 100
      : null;

  const finalNumeric = scores.length > 0 ? calculateFinalNumeric(scores) : null;
  const finalStatus = finalNumeric !== null ? calculateFinalResult(finalNumeric) : null;
  const evaluation =
    avg !== null && avg !== undefined
      ? calculateFinalEvaluation(avg)
      : null;

  return {
    ...existingSummary,
    total,
    avg,
    evaluation,
    finalNumeric,
    finalStatus,
  };
}

export async function updateSubjectScoreAction(input: {
  resultId: string;
  subjectName: string;
  score: number;
  units?: number | null;
}) {
  const user = await ensureGradesAccess("edit");

  const result = await getResultById(input.resultId);
  if (!result) {
    throw new Error("النتيجة غير موجودة");
  }

  const subjectName = normalizeSubjectName(input.subjectName);
  if (!subjectName || isUnitsSubject(subjectName)) {
    throw new Error("اسم المادة غير صالح");
  }

  const subjects = (result.subjectsJson || []) as SubjectRow[];
  const idx = subjects.findIndex(
    (s) => normalizeSubjectName(String(s.name || "")) === subjectName
  );
  if (idx === -1) {
    throw new Error("المادة غير موجودة ضمن هذه النتيجة");
  }

  subjects[idx] = {
    ...subjects[idx],
    name: subjects[idx].name ?? subjectName,
    score: input.score,
    units: input.units ?? subjects[idx].units ?? null,
  };

  const summary = recalcSummary(subjects, result.summaryJson || {});
  await updateResultSubjectsAndSummary({
    resultId: result.id,
    subjectsJson: subjects,
    summaryJson: summary,
    updatedBy: user.id,
  });

  revalidatePath(`/admin/grades/${result.id}`);
  revalidatePath("/admin/grades");
  revalidatePath("/admin/results");
  revalidatePath("/admin/accounts");
  return { success: true };
}

export async function addSubjectAction(input: {
  resultId: string;
  subjectName: string;
  score: number;
  units?: number | null;
}) {
  const user = await ensureGradesAccess("create");

  const result = await getResultById(input.resultId);
  if (!result) {
    throw new Error("النتيجة غير موجودة");
  }

  const subjectName = normalizeSubjectName(input.subjectName);
  if (!subjectName || isUnitsSubject(subjectName)) {
    throw new Error("اسم المادة غير صالح");
  }

  const subjects = (result.subjectsJson || []) as SubjectRow[];
  const exists = subjects.some(
    (s) => normalizeSubjectName(String(s.name || "")) === subjectName
  );
  if (exists) {
    throw new Error("المادة موجودة مسبقاً");
  }

  subjects.push({
    name: subjectName,
    score: input.score,
    units: input.units ?? null,
  });

  const summary = recalcSummary(subjects, result.summaryJson || {});
  await updateResultSubjectsAndSummary({
    resultId: result.id,
    subjectsJson: subjects,
    summaryJson: summary,
    updatedBy: user.id,
  });

  revalidatePath(`/admin/grades/${result.id}`);
  revalidatePath("/admin/grades");
  revalidatePath("/admin/results");
  revalidatePath("/admin/accounts");
  return { success: true };
}

export async function deleteSubjectAction(input: { resultId: string; subjectName: string }) {
  const user = await ensureGradesAccess("delete");

  const result = await getResultById(input.resultId);
  if (!result) {
    throw new Error("النتيجة غير موجودة");
  }

  const subjectName = normalizeSubjectName(input.subjectName);
  if (!subjectName || isUnitsSubject(subjectName)) {
    throw new Error("اسم المادة غير صالح");
  }

  const subjects = (result.subjectsJson || []) as SubjectRow[];
  const nextSubjects = subjects.filter(
    (s) => normalizeSubjectName(String(s.name || "")) !== subjectName
  );

  if (nextSubjects.length === subjects.length) {
    throw new Error("المادة غير موجودة ضمن هذه النتيجة");
  }

  const summary = recalcSummary(nextSubjects, result.summaryJson || {});
  await updateResultSubjectsAndSummary({
    resultId: result.id,
    subjectsJson: nextSubjects,
    summaryJson: summary,
    updatedBy: user.id,
  });

  revalidatePath(`/admin/grades/${result.id}`);
  revalidatePath("/admin/grades");
  revalidatePath("/admin/results");
  revalidatePath("/admin/accounts");
  return { success: true };
}
