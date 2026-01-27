import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAllRegistrationDocuments } from "@/lib/registrationDocumentsRepo";
import ExportDocumentsButton from "./ExportDocumentsButton";
import DownloadStudentButton from "./DownloadStudentButton";
import DeleteStudentButton from "./DeleteStudentButton";

export default async function AdminRequiredDocumentsPage() {
  // التحقق من تسجيل الدخول
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من أن المستخدم المحدود يمكنه الوصول إلى هذه الصفحة فقط إذا كانت ضمن custom_url
  const isLimitedUser = user.custom_url && user.custom_url !== "/admin" && user.role.toUpperCase() !== "ADMIN";
  if (isLimitedUser && user.custom_url) {
    // إذا كان custom_url مختلف عن هذه الصفحة، إعادة توجيه
    if (user.custom_url !== "/admin/registration-affairs/required-documents") {
      redirect(user.custom_url);
    }
  }

  // التحقق من الصلاحية على صفحة required-documents
  const hasAccess = await canAdmin("required-documents", "access");
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link href="/admin" prefetch={false} className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  // التحقق من صلاحية الحذف
  const canDelete = await canAdmin("required-documents", "delete");
  
  let documents: Awaited<ReturnType<typeof getAllRegistrationDocuments>> = [];
  try {
    documents = await getAllRegistrationDocuments();
  } catch (error) {
    console.error("Error fetching documents:", error);
    documents = [];
  }

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                المستمسكات المطلوبة
              </h1>
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#31BD9C] text-white text-sm font-bold">
                {documents.length}
              </div>
            </div>
            <p className="text-sm text-neutral-600">
              عرض جميع المستمسكات المرفوعة من الطلاب
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportDocumentsButton />
            <Link
              href="/admin/registration-affairs"
              className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              رجوع
            </Link>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-neutral-500">لا توجد مستمسكات مرفوعة بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-neutral-500 uppercase mb-1">الاسم</p>
                        <p className="text-base font-semibold text-neutral-900">{doc.fullName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DownloadStudentButton studentId={doc.id} studentName={doc.fullName} />
                        {canDelete && (
                          <DeleteStudentButton studentId={doc.id} studentName={doc.fullName} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">القسم</p>
                    <p className="text-base font-semibold text-neutral-900">{doc.department}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">المرحلة</p>
                    <p className="text-base font-semibold text-neutral-900">{doc.stage}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">نوع الدراسة</p>
                    <p className="text-base font-semibold text-neutral-900">
                      {doc.studyType === "morning" ? "صباحي" : doc.studyType === "evening" ? "مسائي" : doc.studyType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">رقم الهاتف</p>
                    <p className="text-base font-semibold text-neutral-900" dir="ltr">{doc.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">تاريخ الإرسال</p>
                    <p className="text-sm text-neutral-600">
                      {new Date(doc.createdAt).toLocaleDateString("ar-IQ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4 mt-4">
                  <p className="text-xs font-bold text-neutral-500 uppercase mb-3">المستمسكات المرفوعة</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {doc.personalPhotoId && (
                      <div>
                        <a
                          href={`/api/media/${doc.personalPhotoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          الصورة الشخصية
                        </a>
                      </div>
                    )}
                    {doc.studentIdFrontId && (
                      <div>
                        <a
                          href={`/api/media/${doc.studentIdFrontId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الطالب (أمامي)
                        </a>
                      </div>
                    )}
                    {doc.studentIdBackId && (
                      <div>
                        <a
                          href={`/api/media/${doc.studentIdBackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الطالب (خلفي)
                        </a>
                      </div>
                    )}
                    {doc.fatherIdFrontId && (
                      <div>
                        <a
                          href={`/api/media/${doc.fatherIdFrontId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الأب (أمامي)
                        </a>
                      </div>
                    )}
                    {doc.fatherIdBackId && (
                      <div>
                        <a
                          href={`/api/media/${doc.fatherIdBackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الأب (خلفي)
                        </a>
                      </div>
                    )}
                    {doc.motherIdFrontId && (
                      <div>
                        <a
                          href={`/api/media/${doc.motherIdFrontId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الأم (أمامي)
                        </a>
                      </div>
                    )}
                    {doc.motherIdBackId && (
                      <div>
                        <a
                          href={`/api/media/${doc.motherIdBackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة الأم (خلفي)
                        </a>
                      </div>
                    )}
                    {doc.residenceCardFrontId && (
                      <div>
                        <a
                          href={`/api/media/${doc.residenceCardFrontId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة السكن (أمامي)
                        </a>
                      </div>
                    )}
                    {doc.residenceCardBackId && (
                      <div>
                        <a
                          href={`/api/media/${doc.residenceCardBackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          بطاقة السكن (خلفي)
                        </a>
                      </div>
                    )}
                    {doc.highSchoolCertificateId && (
                      <div>
                        <a
                          href={`/api/media/${doc.highSchoolCertificateId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          وثيقة الدراسة الإعدادية
                        </a>
                      </div>
                    )}
                    {doc.barcodeDocumentId && (
                      <div>
                        <a
                          href={`/api/media/${doc.barcodeDocumentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#31BD9C] hover:underline"
                        >
                          ورقة الباركود
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
