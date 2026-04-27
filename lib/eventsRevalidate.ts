import { revalidatePath, revalidateTag } from "next/cache";

/**
 * بعد أي تعديل على الأحداث من API أو Server Action:
 * - إبطال unstable_cache الموسوم بـ "events"
 * - تحديث صفحات /ar/events و /en/events
 *
 * ملاحظة: في Next 16 لا يُسمح بـ updateTag() داخل Route Handlers؛ استخدم revalidateTag من هنا.
 */
export function revalidatePublicEvents(): void {
  revalidateTag("events", "max");
  revalidatePath("/ar/events");
  revalidatePath("/en/events");
}
