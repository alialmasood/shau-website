import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentPortalPage() {
  const session = await getStudentSession();
  if (!session || !session.studentId) {
    redirect("/ar/student-portal/login");
  }

  // Always derive student_id from session (NOT from query params)
  const student = await getStudentById(session.studentId);
  if (!student) {
    redirect("/ar/student-portal/login");
  }

  // Check financial clearance - security check
  if (!student.financialClearance) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">الحساب المالي غير مسدد</h1>
          <p className="text-neutral-700 mb-6">
            عذراً، لا يمكنك عرض النتائج لأن الحساب المالي غير مسدد. يرجى زيارة قسم الحسابات لتسديد الرسوم.
          </p>
          <a
            href="/ar/student-portal/logout"
            className="inline-block px-6 py-3 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors"
          >
            تسجيل الخروج
          </a>
        </div>
      </div>
    );
  }

  // جلب النتائج (يجب أن يكون study_type موجوداً)
  if (!student.studyType) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">نوع الدراسة غير محدد</h1>
          <p className="text-neutral-700 mb-6">
            يرجى التواصل مع الإدارة لتحديد نوع الدراسة (صباحي/مسائي).
          </p>
        </div>
      </div>
    );
  }

  // Redirect to new dashboard
  redirect("/ar/student/dashboard");
}
