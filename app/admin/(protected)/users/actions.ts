"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import { createAdminUser, updateAdminUser, getAdminUserByEmail } from "@/lib/adminUsersRepo";
import { getAllAdminPages, getAdminPageByCode, setUserPagePermissions, deleteUserPagePermissions } from "@/lib/adminPagesRepo";

type PagePermissions = {
  pageCode: string;
  can_access: boolean;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_upload: boolean;
  can_export: boolean;
  can_publish: boolean;
};

export async function createAdminUserAction(formData: FormData) {
  // التحقق من الصلاحية
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const hasPermission = await canAdmin("users", "create");
  if (!hasPermission) {
    throw new Error("ليس لديك صلاحية لإنشاء مستخدمين");
  }

  // قراءة البيانات من النموذج
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "VIEWER");
  const full_name = String(formData.get("full_name") ?? "").trim() || null;

  // التحقق من صحة البيانات
  if (!email || !password || !role) {
    throw new Error("البريد الإلكتروني وكلمة المرور والدور مطلوبة");
  }

  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("البريد الإلكتروني غير صحيح");
  }

  // التحقق من قوة كلمة المرور
  if (password.length < 8) {
    throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  // التحقق من عدم وجود مستخدم بنفس البريد
  const existing = await getAdminUserByEmail(email);
  if (existing) {
    throw new Error("البريد الإلكتروني مستخدم بالفعل");
  }

  // إنشاء المستخدم
  const userId = await createAdminUser({
    email,
    password,
    role,
    full_name,
    custom_url: null,
    permissions: [],
  });

  // معالجة صلاحيات الصفحات
  const allPages = await getAllAdminPages();
  const pagePermissions: PagePermissions[] = [];

  for (const page of allPages) {
    const can_access = formData.get(`page_${page.code}_access`) === "on";
    const can_view = formData.get(`page_${page.code}_view`) === "on";
    const can_create = formData.get(`page_${page.code}_create`) === "on";
    const can_edit = formData.get(`page_${page.code}_edit`) === "on";
    const can_delete = formData.get(`page_${page.code}_delete`) === "on";
    const can_upload = formData.get(`page_${page.code}_upload`) === "on";
    const can_export = formData.get(`page_${page.code}_export`) === "on";
    const can_publish = formData.get(`page_${page.code}_publish`) === "on";

    pagePermissions.push({
      pageCode: page.code,
      can_access,
      can_view: can_access ? can_view : false,
      can_create: can_access ? can_create : false,
      can_edit: can_access ? can_edit : false,
      can_delete: can_access ? can_delete : false,
      can_upload: can_access ? can_upload : false,
      can_export: can_access ? can_export : false,
      can_publish: can_access ? can_publish : false,
    });
  }

  // حفظ صلاحيات الصفحات
  for (const perm of pagePermissions) {
    const page = await getAdminPageByCode(perm.pageCode);
    if (page) {
      await setUserPagePermissions(userId, page.id, {
        can_access: perm.can_access,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_upload: perm.can_upload,
        can_export: perm.can_export,
        can_publish: perm.can_publish,
      });
    }
  }

  redirect("/admin/users");
}

export async function updateAdminUserAction(userId: string, formData: FormData) {
  // التحقق من الصلاحية
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  const hasPermission = await canAdmin("users", "edit");
  if (!hasPermission) {
    throw new Error("ليس لديك صلاحية لتعديل المستخدمين");
  }

  // قراءة البيانات من النموذج
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const role = String(formData.get("role") ?? "VIEWER");
  const full_name = String(formData.get("full_name") ?? "").trim() || null;
  const is_active = formData.get("is_active") === "on";

  // التحقق من صحة البيانات
  if (!email || !role) {
    throw new Error("البريد الإلكتروني والدور مطلوبان");
  }

  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("البريد الإلكتروني غير صحيح");
  }

  // التحقق من عدم وجود مستخدم آخر بنفس البريد
  const existing = await getAdminUserByEmail(email);
  if (existing && existing.id !== userId) {
    throw new Error("البريد الإلكتروني مستخدم بالفعل");
  }

  // تحديث المستخدم
  await updateAdminUser({
    id: userId,
    email,
    password: password ? password : undefined,
    role,
    full_name,
    is_active,
    permissions: [],
  });

  // حذف الصلاحيات القديمة وإضافة الجديدة
  await deleteUserPagePermissions(userId);

  // معالجة صلاحيات الصفحات
  const allPages = await getAllAdminPages();

  for (const page of allPages) {
    const can_access = formData.get(`page_${page.code}_access`) === "on";
    const can_view = formData.get(`page_${page.code}_view`) === "on";
    const can_create = formData.get(`page_${page.code}_create`) === "on";
    const can_edit = formData.get(`page_${page.code}_edit`) === "on";
    const can_delete = formData.get(`page_${page.code}_delete`) === "on";
    const can_upload = formData.get(`page_${page.code}_upload`) === "on";
    const can_export = formData.get(`page_${page.code}_export`) === "on";
    const can_publish = formData.get(`page_${page.code}_publish`) === "on";

      await setUserPagePermissions(userId, page.id, {
      can_access,
      can_view: can_access ? can_view : false,
      can_create: can_access ? can_create : false,
      can_edit: can_access ? can_edit : false,
      can_delete: can_access ? can_delete : false,
      can_upload: can_access ? can_upload : false,
      can_export: can_access ? can_export : false,
      can_publish: can_access ? can_publish : false,
    });
  }

  redirect("/admin/users");
}
