import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import StudentCodeClient from "./StudentCodeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentCodePage() {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/admin/login");
  }

  const roleUpper = String(user.role || "").toUpperCase();
  const hasAccess =
    roleUpper === "ADMIN" || (await canAdmin("student-accounts", "access"));
  if (!hasAccess) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">❌ غير مصرح - ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link href="/admin" className="mt-4 inline-block text-[#31BD9C] hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            كودات الطلبة للتجريبي
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            توليد وإدارة كودات الطلبة الامتحانية (5 أرقام فريدة) — استيراد من Excel وتصدير ومشاركة
          </p>
        </div>
        <StudentCodeClient />
      </div>
    </div>
  );
}
