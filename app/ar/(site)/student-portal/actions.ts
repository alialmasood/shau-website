"use server";

import { verifyStudentCredentials, updateStudentUserLastLogin } from "@/lib/studentUsersRepo";
import { setStudentSessionCookie } from "@/lib/studentSession";

export async function studentLogin(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }> {
  try {
    // Get user by username first
    const { getStudentUserByUsername } = await import("@/lib/studentUsersRepo");
    const user = await getStudentUserByUsername(username);
    
    if (!user || !user.isActive) {
      return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيح" };
    }

    // Verify password
    const isValid = await import("bcryptjs").then(bcrypt => 
      bcrypt.default.compare(password, user.passwordHash)
    );
    
    if (!isValid) {
      return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيح" };
    }

    // Update last login
    await updateStudentUserLastLogin(username);

    // Create session
    await setStudentSessionCookie(user.studentId);
    
    return { 
      success: true,
      mustChangePassword: user.mustChangePassword
    };
  } catch (error) {
    console.error("Student login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الدخول",
    };
  }
}
