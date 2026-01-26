import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUserById, getAllPermissions, getAdminUserWithPermissions } from "@/lib/adminUsersRepo";
import EditUserForm from "../EditUserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const user = await getAdminUserById(id);
  if (!user) {
    redirect("/admin/users");
  }

  const userWithPermissions = await getAdminUserWithPermissions(id);
  
  let permissions: Awaited<ReturnType<typeof getAllPermissions>> = [];
  try {
    permissions = await getAllPermissions();
  } catch (error) {
    console.error("Error fetching permissions:", error);
    permissions = [];
  }

  const resources = Array.from(new Set(permissions.map((p) => p.resource)));

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            تعديل المستخدم
          </h1>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-colors"
          >
            رجوع
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <EditUserForm
            user={user}
            userPermissions={userWithPermissions?.permissions || []}
            allPermissions={permissions}
            resources={resources}
          />
        </div>
      </div>
    </div>
  );
}
