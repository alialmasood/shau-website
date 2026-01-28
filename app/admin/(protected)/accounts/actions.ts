"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { updateStudentFinancialClearance } from "@/lib/studentsRepo";

export async function toggleFinancialClearance(
  studentId: string,
  financialClearance: boolean
): Promise<void> {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية - فقط ACCOUNTS أو ADMIN
  if (currentUser.role !== "ACCOUNTS" && currentUser.role !== "ADMIN") {
    throw new Error("ليس لديك صلاحية لتعديل الحسابات المالية");
  }

  await updateStudentFinancialClearance(studentId, financialClearance, currentUser.id);
}
