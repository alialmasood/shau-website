"use server";

import { revalidatePath } from "next/cache";
import { setTuitionPdfMediaId } from "@/lib/tuitionPdfRepo";

export async function setTuitionPdf(mediaId: string) {
  await setTuitionPdfMediaId(mediaId);
  revalidatePath("/admin/tuition-pdf");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/tuition-fees");
  revalidatePath("/en/tuition-fees");
}
