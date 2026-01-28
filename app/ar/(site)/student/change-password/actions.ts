"use server";

import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/studentSession";
import { updateStudentPassword } from "@/lib/studentUsersRepo";

export async function changeStudentPasswordAction(formData: FormData) {
  // Get student session (security: always use session, never from client)
  const session = await getStudentSession();
  if (!session || !session.studentId) {
    redirect("/ar/student-portal/login");
  }

  // Read form fields
  const currentPassword = String(formData.get("current_password") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "").trim();
  const confirmPassword = String(formData.get("confirm_password") ?? "").trim();

  // Validate fields
  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      success: false,
      error: "جميع الحقول مطلوبة",
    };
  }

  // Validate new password length
  if (newPassword.length < 8) {
    return {
      success: false,
      error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
    };
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين",
    };
  }

  // Validate new password is different from current
  if (currentPassword === newPassword) {
    return {
      success: false,
      error: "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية",
    };
  }

  // Update password using session student_id (secure)
  const result = await updateStudentPassword(
    session.studentId, // Always from session, never from client
    currentPassword,
    newPassword
  );

  if (!result.success) {
    return result;
  }

  // Redirect to dashboard with success query param
  redirect("/ar/student/dashboard?changed=1");
}
