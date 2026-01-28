import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { getAllStudents } from "@/lib/studentsRepo";
import AccountsTable from "./AccountsTable";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEPARTMENTS = [
  { code: "DENTAL_TECH", name: "تقنيات صناعة الأسنان" },
  { code: "ANESTHESIA_TECH", name: "تقنيات التخدير" },
  { code: "RADIOLOGY_TECH", name: "تقنيات الأشعة" },
];

const STAGES = ["المرحلة الأولى", "المرحلة الثانية"];
const STUDY_TYPES = ["صباحي", "مسائي"];

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    department?: string; 
    stage?: string; 
    studyType?: string; 
    paid?: string; 
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية - فقط ACCOUNTS أو ADMIN
  if (user.role !== "ACCOUNTS" && user.role !== "ADMIN") {
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

  const params = await searchParams;
  
  // Pagination
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 25);
  
  const filters = {
    departmentCode: params.department || undefined,
    stage: params.stage || undefined,
    studyType: params.studyType || undefined,
    financialClearance: params.paid === "true" ? true : params.paid === "false" ? false : undefined,
    search: params.search || undefined,
    page,
    pageSize,
  };

  const { students, total } = await getAllStudents(filters);

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            الحسابات المالية
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            إدارة الحسابات المالية للطلاب
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <AccountsTable 
            students={students} 
            total={total}
            page={page}
            pageSize={pageSize}
            departments={DEPARTMENTS} 
            stages={STAGES}
            studyTypes={STUDY_TYPES}
            currentFilters={filters}
          />
        </div>
      </div>
    </div>
  );
}
