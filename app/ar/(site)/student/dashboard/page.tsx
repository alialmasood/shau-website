import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentById } from "@/lib/studentsRepo";
import StudentDashboardContent from "./StudentDashboardContent";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACADEMIC_YEAR = "2025-2026";
const SEMESTER = "الفصل الأول";
const DEFAULT_ATTEMPT = "الدور الأول";

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const session = await getStudentSession();
  if (!session || !session.studentId) {
    redirect("/ar/student-portal/login");
  }

  const student = await getStudentById(session.studentId);
  if (!student) {
    redirect("/ar/student-portal/login");
  }

  // Get results securely - validates session and financial clearance
  const { getStudentResultsSecure } = await import("@/lib/resultsRepo");
  const resultsResponse = await getStudentResultsSecure(
    session.studentId, // Always from session, never from query params
    ACADEMIC_YEAR,
    SEMESTER
  );

  // Handle errors
  if (resultsResponse.error) {
    if (resultsResponse.error.code === 403 && resultsResponse.error.message === "الحساب المالي غير مسدد") {
      // Financial clearance error - will be handled in UI
    } else {
      // Other errors - redirect or show error
      console.error("Error fetching results:", resultsResponse.error);
    }
  }

  const results = resultsResponse.results || [];
  const params = await searchParams;
  const passwordChanged = params.changed === "1";

  return (
    <div className="max-w-3xl mx-auto px-3 py-4 md:px-8 md:py-8">
      <div className="mb-3 md:mb-6 flex flex-row items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-extrabold text-neutral-900">
            بوابة الطلبة
          </h1>
          <p className="mt-1 text-sm text-gray-500 truncate">
            مرحباً {student.fullName} - {student.studentId}
          </p>
        </div>
        <a
          href="/ar/student-portal/logout"
          className="flex-shrink-0 h-10 px-4 rounded-xl bg-red-600 text-white text-xs md:text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center shadow-sm"
        >
          تسجيل الخروج
        </a>
      </div>

      {passwordChanged && (
        <div className="mb-3 md:mb-6 p-3 md:p-4 rounded-xl bg-green-50 border-2 border-green-300 text-green-800">
          <p className="text-sm md:text-base font-medium">✓ تم تغيير كلمة المرور بنجاح</p>
        </div>
      )}

      <StudentDashboardContent student={student} results={results} />
    </div>
  );
}
