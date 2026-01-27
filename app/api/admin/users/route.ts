import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { createAdminUser, getAdminUserByEmail } from "@/lib/adminUsersRepo";
import { cookies } from "next/headers";

// منع cache هذه الصفحة
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await getAdminSession();
    
    // تسجيل للتحقق من الجلسة (فقط في حالة الخطأ)
    if (!session) {
      const cookieStore = await cookies();
      const cookieValue = cookieStore.get("shau_admin_session");
      console.error("API /admin/users: No session found", {
        hasCookie: !!cookieValue,
        cookieLength: cookieValue?.value?.length || 0,
        userAgent: request.headers.get("user-agent"),
        origin: request.headers.get("origin"),
      });
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول مرة أخرى" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, role, full_name, custom_url, permissions } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور والدور مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    }

    // التحقق من قوة كلمة المرور
    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود مستخدم بنفس البريد
    const existing = await getAdminUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    // التحقق من صحة الدور
    const validRoles = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "دور غير صحيح" }, { status: 400 });
    }

    const userId = await createAdminUser({
      email: String(email),
      password: String(password),
      role: String(role),
      full_name: full_name || null,
      custom_url: custom_url || null,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    return NextResponse.json({ success: true, id: userId }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    if (error instanceof Error && error.message.includes("غير مصرح")) {
      return NextResponse.json({ error: "غير مصرح - يرجى تسجيل الدخول مرة أخرى" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء المستخدم" },
      { status: 500 }
    );
  }
}
