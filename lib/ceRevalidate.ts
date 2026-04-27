import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateContinuingEducation(): void {
  revalidateTag("continuing-education", "max");
  revalidatePath("/ar/continuing-education");
  revalidatePath("/en/continuing-education");
}
