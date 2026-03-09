import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getStudentAccountsStats } from "./actions";
import { getAllStudentAccountsBatches } from "@/lib/studentAccountsBatchesRepo";
import StudentAccountsTable from "./StudentAccountsTable";
import StudentAccountsImport from "./StudentAccountsImport";
import StudentAccountsBatchCard from "./StudentAccountsBatchCard";
import RealtimeWrapper from "./RealtimeWrapper";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEPARTMENTS = [
  { code: "DENTAL_TECH", name: "تقنيات صناعة الأسنان" },
  { code: "ANESTHESIA_TECH", name: "تقنيات التخدير" },
  { code: "RADIOLOGY_TECH", name: "تقنيات الأشعة" },
  { code: "OPTICS_TECH", name: "تقنيات البصريات" },
  { code: "EMERGENCY_MED_TECH", name: "تقنيات طب الطوارئ والاسعافات الاولية" },
  { code: "COMMUNITY_HEALTH", name: "تقنيات صحة المجتمع" },
  { code: "PHYSIOTHERAPY_TECH", name: "تقنيات العلاج الطبيعي" },
  { code: "HEALTH_PHYSICS_ENG", name: "هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي" },
  { code: "OIL_GAS_ENG", name: "هندسة تقنيات النفط والغاز" },
  { code: "CYBERSEC_CLOUD_ENG", name: "هندسة تقنيات الامن السيبراني والحوسبة السحابية" },
  { code: "CIVIL_CONSTRUCTION_ENG", name: "هندسة تقنيات البناء والانشاءات" },
];

export default async function StudentAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    batchId?: string;
  }>;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess = roleUpper === "ADMIN" || (await canAdmin("student-accounts", "access"));
  if (!hasAccess) {
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

  const params = await searchParams;
  const stats = await getStudentAccountsStats();
  
  // Get all batches for the import history section
  const batches = await getAllStudentAccountsBatches();
  
  // Group batches by department
  const batchesByDepartment = batches.reduce((acc, batch) => {
    if (!acc[batch.departmentCode]) {
      acc[batch.departmentCode] = [];
    }
    acc[batch.departmentCode].push(batch);
    return acc;
  }, {} as Record<string, typeof batches>);

  return (
    <>
      <RealtimeWrapper />
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
                        <StudentAccountsBatchCard
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
                  href="/admin/student-accounts"
                  prefetch={false}
                  className="text-sm text-[#31BD9C] hover:underline"
                >
                  ← عرض جميع الحسابات (إلغاء الفلتر)
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <StudentAccountsImport />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <StudentAccountsTable selectedBatchId={params.batchId} />
        </div>
      </div>
    </div>
    </>
  );
}
