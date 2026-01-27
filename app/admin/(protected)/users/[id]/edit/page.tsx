import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { getAdminUserById } from "@/lib/adminUsersRepo";
import { getAllAdminPages, getUserPagePermissions } from "@/lib/adminPagesRepo";
import EditUserForm from "./EditUserForm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // التحقق من تسجيل الدخول
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  // التحقق من الصلاحية
  const hasPermission = await canAdmin("users", "edit");
  if (!hasPermission) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية لتعديل المستخدمين</p>
          <a href="/admin/users" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى قائمة المستخدمين
          </a>
        </div>
      </div>
    );
  }

  // جلب بيانات المستخدم المراد تعديله
  const targetUser = await getAdminUserById(id);
  if (!targetUser) {
    redirect("/admin/users");
  }

  let pages: Awaited<ReturnType<typeof getAllAdminPages>> = [];
  let userPermissions: Awaited<ReturnType<typeof getUserPagePermissions>> = [];
  try {
    pages = await getAllAdminPages();
    userPermissions = await getUserPagePermissions(id);
  } catch (error) {
    console.error("Error fetching data:", error);
    pages = [];
    userPermissions = [];
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            تعديل المستخدم
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            تعديل بيانات المستخدم والصلاحيات
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <EditUserForm
            user={targetUser}
            pages={pages}
            userPermissions={userPermissions}
          />
        </div>
      </div>
    </div>
  );
}
