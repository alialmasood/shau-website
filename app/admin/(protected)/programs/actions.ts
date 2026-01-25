"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProgram as createRepo,
  updateProgram as updateRepo,
  deleteProgram as deleteRepo,
  type CreateProgramInput,
  type UpdateProgramInput,
} from "@/lib/programsRepo";

export async function createProgram(data: CreateProgramInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const id = await createRepo(data);
    revalidatePath("/admin/programs");
    revalidatePath("/ar/programs");
    revalidatePath("/en/programs");
    revalidatePath("/ar");
    revalidatePath("/en");
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}

export async function updateProgram(id: string, data: UpdateProgramInput): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateRepo(id, data);
    revalidatePath("/admin/programs");
    revalidatePath("/ar/programs");
    revalidatePath("/en/programs");
    revalidatePath("/ar");
    revalidatePath("/en");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}

export async function deleteProgram(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteRepo(id);
    revalidatePath("/admin/programs");
    revalidatePath("/ar/programs");
    revalidatePath("/en/programs");
    revalidatePath("/ar");
    revalidatePath("/en");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدث خطأ";
    return { ok: false, error: msg };
  }
}

/** للاستخدام من form action (FormData with "id") */
export async function deleteProgramAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "معرف البرنامج مطلوب" };
  const res = await deleteProgram(id);
  if (res.ok) redirect("/admin/programs");
  return res;
}
