"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminPermissionRow } from "@/lib/adminUsersRepo";

const ROLES = [
  { value: "ADMIN", label: "مدير" },
  { value: "MANAGER", label: "مدير فرعي" },
  { value: "EDITOR", label: "محرر" },
  { value: "VIEWER", label: "مشاهد" },
];

export default function CreateUserForm({
  permissions,
  resources,
}: {
  permissions: AdminPermissionRow[];
  resources: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "EDITOR",
    full_name: "",
    custom_url: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handlePermissionToggle(permissionId: string) {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  }

  function handleResourceToggle(resource: string) {
    const resourcePermissions = permissions.filter((p) => p.resource === resource);
    const allSelected = resourcePermissions.every((p) => selectedPermissions.includes(p.id));
    
    if (allSelected) {
      // إلغاء تحديد جميع صلاحيات هذا المورد
      setSelectedPermissions((prev) =>
        prev.filter((id) => !resourcePermissions.some((p) => p.id === id))
      );
    } else {
      // تحديد جميع صلاحيات هذا المورد
      const newIds = resourcePermissions.map((p) => p.id).filter((id) => !selectedPermissions.includes(id));
      setSelectedPermissions((prev) => [...prev, ...newIds]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }

    // تحسين قوة كلمة المرور
    if (formData.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          full_name: formData.full_name || null,
          custom_url: formData.custom_url || null,
          permissions: selectedPermissions,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // إذا كان الخطأ 401، توجيه المستخدم إلى صفحة تسجيل الدخول
        if (res.status === 401) {
          setError(json.error || "انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى.");
          setTimeout(() => {
            window.location.href = "/admin/login";
          }, 2000);
          return;
        }
        setError(json.error || "فشل إنشاء المستخدم");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Error creating user:", error);
      setError("حدث خطأ أثناء إنشاء المستخدم. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            الاسم الكامل
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            تأكيد كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            الدور <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-900 mb-2">
            الرابط المخصص
          </label>
          <input
            type="text"
            name="custom_url"
            value={formData.custom_url}
            onChange={handleInputChange}
            placeholder="/admin/registration-affairs/required-documents"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
          />
          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-900 mb-2">📌 كيف يعمل الرابط المخصص:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>بعد تسجيل الدخول، سيتم توجيه المستخدم تلقائياً إلى هذا الرابط</li>
              <li>يجب أن يبدأ الرابط بـ <code className="bg-blue-100 px-1 rounded">/admin</code></li>
              <li>مثال: <code className="bg-blue-100 px-1 rounded">/admin/registration-affairs</code></li>
              <li>مثال: <code className="bg-blue-100 px-1 rounded">/admin/news</code></li>
              <li>اتركه فارغاً للتوجيه إلى لوحة التحكم الرئيسية</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-900 mb-4">
          الصلاحيات
        </label>
        <div className="space-y-4">
          {resources.map((resource) => {
            const resourcePermissions = permissions.filter((p) => p.resource === resource);
            const allSelected = resourcePermissions.every((p) => selectedPermissions.includes(p.id));
            const someSelected = resourcePermissions.some((p) => selectedPermissions.includes(p.id));

            return (
              <div key={resource} className="border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-neutral-900 capitalize">{resource}</h3>
                  <button
                    type="button"
                    onClick={() => handleResourceToggle(resource)}
                    className="text-xs text-[#31BD9C] hover:text-[#2aa88a] font-bold"
                  >
                    {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {resourcePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="w-4 h-4 text-[#31BD9C] border-neutral-300 rounded focus:ring-[#31BD9C]"
                      />
                      <span className="text-sm text-neutral-700 capitalize">
                        {permission.action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء مستخدم"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
