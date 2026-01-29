import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAllStudents } from "@/lib/studentsRepo";
import { getAllBatches } from "@/lib/resultsRepo";
import AccountsTable from "./AccountsTable";
import BatchCard from "./BatchCard";
import RealtimeWrapper from "./RealtimeWrapper";

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
    batchId?: string; // Filter by batch ID
    page?: string;
    pageSize?: string;
  }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية - ACCOUNTS أو ADMIN أو صلاحية صفحة الحسابات
  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" ||
    roleUpper === "ACCOUNTS" ||
    (await canAdmin("accounts", "access"));

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
    batchId: params.batchId || undefined,
    page,
    pageSize,
  };

  // Get all batches for the import history section
  const batches = await getAllBatches();
  
  // Group batches by department
  const batchesByDepartment = batches.reduce((acc, batch) => {
    if (!acc[batch.departmentCode]) {
      acc[batch.departmentCode] = [];
    }
    acc[batch.departmentCode].push(batch);
    return acc;
  }, {} as Record<string, typeof batches>);

  const { students, total } = await getAllStudents(filters);
  
  // Debug logging
  console.log(`[AdminAccountsPage] 📊 Data loaded: students=${students.length}, total=${total}`);
  console.log(`[AdminAccountsPage] 🔍 Filters:`, filters);
  if (students.length > 0) {
    console.log(`[AdminAccountsPage] 📋 Sample student:`, {
      studentId: students[0].studentId,
      fullName: students[0].fullName,
      departmentCode: students[0].departmentCode,
    });
  }

  return (
    <>
      <RealtimeWrapper />
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

        {/* Import History Section */}
        {batches.length > 0 && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">سجل الاستيرادات</h2>
            <div className="space-y-4">
              {Object.entries(batchesByDepartment).map(([deptCode, deptBatches]) => {
                const deptName = DEPARTMENTS.find(d => d.code === deptCode)?.name || deptCode;
                return (
                  <div key={deptCode} className="border border-neutral-200 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-neutral-700 mb-3">{deptName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {deptBatches.map((batch) => (
                        <BatchCard
                          key={batch.id}
                          batch={batch}
                          isSelected={params.batchId === batch.id}
                          userRole={user.role}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {params.batchId && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <Link
                  href="/admin/accounts?page=1"
                  prefetch={false}
                  className="text-sm text-[#31BD9C] hover:underline"
                >
                  ← عرض جميع الطلاب (إلغاء الفلتر)
                </Link>
              </div>
            )}
          </div>
        )}

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
            selectedBatchId={params.batchId}
          />
        </div>
      </div>
    </div>
    </>
  );
}
