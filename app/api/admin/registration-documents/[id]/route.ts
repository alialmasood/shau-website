import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getAdminUserById, hasPermission } from "@/lib/adminUsersRepo";
import * as registrationRepo from "@/lib/registrationDocumentsRepo";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // التحقق من الصلاحيات
  const userData = await getAdminUserById(session.sub);
  if (!userData) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 401 });
  }

  // التحقق من أن المستخدم لديه صلاحية الحذف أو هو ADMIN
  const canDelete = userData.role === "ADMIN" || await hasPermission(session.sub, "registration", "delete");
  if (!canDelete) {
    return NextResponse.json({ error: "ليس لديك صلاحية لحذف البيانات" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
  }

  try {
    // التحقق من وجود السجل
    const document = await registrationRepo.getRegistrationDocumentById(id);
    if (!document) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    // حذف السجل
    const deleted = await registrationRepo.deleteRegistrationDocument(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "فشل حذف البيانات" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم حذف البيانات بنجاح" });
  } catch (error) {
    console.error("Error deleting registration document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف البيانات" },
      { status: 500 }
    );
  }
}
