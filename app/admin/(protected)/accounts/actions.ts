"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { deleteBatch } from "@/lib/resultsRepo";
import { updateStudentFinancialClearance } from "@/lib/studentsRepo";
import { revalidatePath } from "next/cache";

export async function toggleFinancialClearance(
  studentId: string,
  financialClearance: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // Only ACCOUNTS or ADMIN can toggle financial clearance
  if (user.role !== "ACCOUNTS" && user.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لتعديل الحالة المالية" };
  }

  try {
    const success = await updateStudentFinancialClearance(
      studentId,
      financialClearance,
      user.id
    );

    if (success) {
      revalidatePath("/admin/accounts");
      return { success: true };
    } else {
      return { success: false, error: "الطالب غير موجود" };
    }
  } catch (error) {
    console.error("Error toggling financial clearance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء التحديث",
    };
  }
}

export async function deleteBatchAction(batchId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // Only ADMIN can delete batches
  if (user.role !== "ADMIN") {
    return { success: false, error: "ليس لديك صلاحية لحذف الاستيرادات" };
  }

  const result = await deleteBatch(batchId);
  
  if (result.success) {
    // Revalidate the accounts page to refresh the batch list
    revalidatePath("/admin/accounts");
  }

  return result;
}
