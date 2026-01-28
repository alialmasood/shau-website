import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { getStudentAccountsStats } from "./actions";
import StudentAccountsTable from "./StudentAccountsTable";
import StudentAccountsImport from "./StudentAccountsImport";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAccountsPage() {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <a href="/admin" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  const stats = await getStudentAccountsStats();

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            إدارة حسابات الطلاب
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            استيراد وإدارة حسابات تسجيل دخول الطلاب
          </p>
        </div>

        {/* Debug Stats */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">إجمالي حسابات الطلاب في DB:</span>
              <span className="mr-2 font-bold text-blue-700">{stats.studentUsersCount}</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">إجمالي الطلاب في جدول students:</span>
              <span className="mr-2 font-bold text-blue-700">{stats.studentsCount}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <StudentAccountsImport />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <StudentAccountsTable />
        </div>
      </div>
    </div>
  );
}
