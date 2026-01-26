import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as registrationRepo from "@/lib/registrationDocumentsRepo";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
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
