"use server";

import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { deleteBatch, deleteOrphanedResults, getOrphanedResultsCount } from "@/lib/resultsRepo";
import { canAdmin } from "@/lib/adminAuthz";
import { updateStudentFinancialClearance } from "@/lib/studentsRepo";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/sseHub";

export async function toggleFinancialClearance(
  studentId: string,
  financialClearance: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // ACCOUNTS أو ADMIN أو صلاحية تعديل صفحة الحسابات
  const roleUpper = String(user.role || "").toUpperCase();
  if (
    roleUpper !== "ACCOUNTS" &&
    roleUpper !== "ADMIN" &&
    !(await canAdmin("accounts", "edit"))
  ) {
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
      revalidatePath("/admin/student-accounts");
      revalidatePath("/ar/student/dashboard");
      
      // Broadcast real-time update
      console.log(`[toggleFinancialClearance] 📡 About to broadcast ACCOUNTS_UPDATED for studentId: ${studentId}, financialClearance: ${financialClearance}`);
      
      try {
        broadcast({
          type: "ACCOUNTS_UPDATED",
          payload: { studentId, financialClearance },
        });
        console.log(`[toggleFinancialClearance] ✅ Broadcast function called successfully`);
      } catch (error) {
        console.error(`[toggleFinancialClearance] ❌ Error calling broadcast:`, error);
      }
      
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

  // ADMIN أو صلاحية حذف على صفحة الحسابات
  const roleUpper = String(user.role || "").toUpperCase();
  if (roleUpper !== "ADMIN" && !(await canAdmin("accounts", "delete"))) {
    return { success: false, error: "ليس لديك صلاحية لحذف الاستيرادات" };
  }

  const result = await deleteBatch(batchId);
  
  if (result.success) {
    // Revalidate the accounts page to refresh the batch list
    revalidatePath("/admin/accounts");
    
    // Broadcast real-time update
    broadcast({
      type: "RESULTS_IMPORTED",
      payload: { batchId },
    });
  }

  return result;
}

export async function deleteOrphanedResultsAction(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  if (roleUpper !== "ADMIN" && !(await canAdmin("accounts", "delete"))) {
    return { success: false, deletedCount: 0, error: "ليس لديك صلاحية حذف السجلات" };
  }

  const result = await deleteOrphanedResults();
  if (result.success) {
    revalidatePath("/admin/accounts");
    revalidatePath("/admin/results");
    broadcast({ type: "RESULTS_IMPORTED", payload: {} });
  }
  return result;
}

export async function getOrphanedResultsCountAction(): Promise<number> {
  const user = await getCurrentAdminUser();
  if (!user) return 0;

  const roleUpper = String(user.role || "").toUpperCase();
  if (roleUpper !== "ADMIN" && !(await canAdmin("accounts", "access"))) {
    return 0;
  }
  return getOrphanedResultsCount();
}
