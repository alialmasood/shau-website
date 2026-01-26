import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAdminUserById, updateAdminUser, getAdminUserByEmail } from "@/lib/adminUsersRepo";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { email, password, role, full_name, custom_url, is_active, permissions } = body;

    const user = await getAdminUserById(id);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // التحقق من صحة البريد الإلكتروني
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(email))) {
        return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
      }
    }

    // التحقق من عدم وجود مستخدم آخر بنفس البريد
    if (email && email !== user.email) {
      const existing = await getAdminUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
      }
    }

    // التحقق من قوة كلمة المرور
    if (password && String(password).length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    // التحقق من صحة الدور
    if (role) {
      const validRoles = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "دور غير صحيح" }, { status: 400 });
      }
    }

    await updateAdminUser({
      id,
      email: email || undefined,
      password: password || undefined,
      role: role || undefined,
      full_name: full_name !== undefined ? full_name : undefined,
      custom_url: custom_url !== undefined ? custom_url : undefined,
      is_active: is_active !== undefined ? is_active : undefined,
      permissions: Array.isArray(permissions) ? permissions : undefined,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث المستخدم" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;

  // منع حذف المستخدم الحالي
  if (session.sub === id) {
    return NextResponse.json({ error: "لا يمكنك حذف حسابك الخاص" }, { status: 400 });
  }

  try {
    const { deleteAdminUser } = await import("@/lib/adminUsersRepo");
    const deleted = await deleteAdminUser(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف المستخدم" },
      { status: 500 }
    );
  }
}
