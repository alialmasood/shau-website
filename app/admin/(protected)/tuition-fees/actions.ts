"use server";

import { revalidatePath } from "next/cache";
import {
  createDepartmentFee as createRepo,
  updateDepartmentFee as updateRepo,
  deleteDepartmentFee as deleteRepo,
  type CreateDeptFeeInput,
  type UpdateDeptFeeInput,
} from "@/lib/departmentFeeRepo";

export async function createDepartmentFee(data: CreateDeptFeeInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const id = await createRepo(data);
    revalidatePath("/admin/tuition-fees");
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/ar/tuition-fees");
    revalidatePath("/en/tuition-fees");
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}

export async function updateDepartmentFee(id: string, data: UpdateDeptFeeInput): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateRepo(id, data);
    revalidatePath("/admin/tuition-fees");
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/ar/tuition-fees");
    revalidatePath("/en/tuition-fees");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}

export async function deleteDepartmentFee(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "معرف السجل مطلوب" };
  try {
    await deleteRepo(id);
    revalidatePath("/admin/tuition-fees");
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/ar/tuition-fees");
    revalidatePath("/en/tuition-fees");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}
