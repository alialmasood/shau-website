"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateAdminUserAction } from "../../actions";
import type { AdminUserRow } from "@/lib/adminUsersRepo";
import type { AdminPageRow, AdminPagePermissionRow } from "@/lib/adminPagesRepo";

const ROLES = [
  { value: "ADMIN", label: "مدير" },
  { value: "MANAGER", label: "مدير فرعي" },
  { value: "EDITOR", label: "محرر" },
  { value: "VIEWER", label: "مشاهد" },
];

export default function EditUserForm({
  user,
  pages,
  userPermissions,
}: {
  user: AdminUserRow;
  pages: AdminPageRow[];
  userPermissions: AdminPagePermissionRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user.email,
    password: "",
    role: user.role,
    full_name: user.full_name || "",
    is_active: user.is_active,
  });

  // خريطة صلاحيات الصفحات: page_id => permissions
  const permissionsMap = new Map(
    userPermissions.map((p) => [p.page_id, p])
  );

  // حالة الصلاحيات لكل صفحة
  const [pagePermissions, setPagePermissions] = useState<Record<string, {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_upload: boolean;
    can_export: boolean;
    can_publish: boolean;
  }>>(() => {
    const initial: Record<string, any> = {};
    for (const page of pages) {
      const perm = permissionsMap.get(page.id);
      initial[page.code] = {
        can_access: perm?.can_access || false,
        can_view: perm?.can_view || false,
        can_create: perm?.can_create || false,
        can_edit: perm?.can_edit || false,
        can_delete: perm?.can_delete || false,
        can_upload: perm?.can_upload || false,
        can_export: perm?.can_export || false,
        can_publish: perm?.can_publish || false,
      };
    }
    return initial;
  });

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handlePagePermissionChange(
    pageCode: string,
    field: string,
    value: boolean
  ) {
    setPagePermissions((prev) => ({
      ...prev,
      [pageCode]: {
        ...prev[pageCode],
        [field]: value,
        ...(field === "can_access" && !value
          ? {
              can_view: false,
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_upload: false,
              can_export: false,
              can_publish: false,
            }
          : {}),
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }

    // التحقق من قوة كلمة المرور (إذا تم إدخالها)
    if (formData.password && formData.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("email", formData.email);
      if (formData.password) {
        submitFormData.append("password", formData.password);
      }
      submitFormData.append("role", formData.role);
      if (formData.full_name) {
        submitFormData.append("full_name", formData.full_name);
      }
      if (formData.is_active) {
        submitFormData.append("is_active", "on");
      }

      // إضافة صلاحيات الصفحات
      for (const page of pages) {
        const perm = pagePermissions[page.code] || {
          can_access: false,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_upload: false,
          can_export: false,
          can_publish: false,
        };

        if (perm.can_access) submitFormData.append(`page_${page.code}_access`, "on");
        if (perm.can_view) submitFormData.append(`page_${page.code}_view`, "on");
        if (perm.can_create) submitFormData.append(`page_${page.code}_create`, "on");
        if (perm.can_edit) submitFormData.append(`page_${page.code}_edit`, "on");
        if (perm.can_delete) submitFormData.append(`page_${page.code}_delete`, "on");
        if (perm.can_upload) submitFormData.append(`page_${page.code}_upload`, "on");
        if (perm.can_export) submitFormData.append(`page_${page.code}_export`, "on");
        if (perm.can_publish) submitFormData.append(`page_${page.code}_publish`, "on");
      }

      await updateAdminUserAction(user.id, submitFormData);
      // redirect سيتم في Server Action
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحديث المستخدم");
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

      {/* البيانات الأساسية */}
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
            كلمة المرور الجديدة (اتركها فارغة للاحتفاظ بالقديمة)
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            minLength={8}
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#31BD9C] border-neutral-300 rounded focus:ring-[#31BD9C]"
          />
          <label className="text-sm font-bold text-neutral-900">
            المستخدم نشط
          </label>
        </div>
      </div>

      {/* قسم الصلاحيات */}
      <div>
        <h3 className="text-lg font-bold text-neutral-900 mb-4">صلاحيات الصفحات</h3>
        <div className="space-y-4">
          {pages.map((page) => {
            const perm = pagePermissions[page.code] || {
              can_access: false,
              can_view: false,
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_upload: false,
              can_export: false,
              can_publish: false,
            };

            return (
              <div key={page.id} className="border border-neutral-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-neutral-900">{page.nameAr}</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perm.can_access}
                      onChange={(e) =>
                        handlePagePermissionChange(page.code, "can_access", e.target.checked)
                      }
                      className="w-4 h-4 text-[#31BD9C] border-neutral-300 rounded focus:ring-[#31BD9C]"
                    />
                    <span className="text-sm font-semibold text-neutral-700">الوصول</span>
                  </label>
                </div>

                {perm.can_access && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-neutral-200">
                    {[
                      { key: "can_view", label: "عرض" },
                      { key: "can_create", label: "إنشاء" },
                      { key: "can_edit", label: "تعديل" },
                      { key: "can_delete", label: "حذف" },
                      { key: "can_upload", label: "رفع" },
                      { key: "can_export", label: "تصدير" },
                      { key: "can_publish", label: "نشر" },
                    ].map((action) => (
                      <label key={action.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={perm[action.key as keyof typeof perm] as boolean}
                          onChange={(e) =>
                            handlePagePermissionChange(page.code, action.key, e.target.checked)
                          }
                          className="w-4 h-4 text-[#31BD9C] border-neutral-300 rounded focus:ring-[#31BD9C]"
                        />
                        <span className="text-sm text-neutral-700">{action.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "جاري التحديث..." : "تحديث المستخدم"}
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
