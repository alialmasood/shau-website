"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/adminCurrent";
import { canAdmin } from "@/lib/adminAuthz";
import {
  updateInnovationConferenceAdminNotes,
  updateInnovationConferenceApplicationStatus,
} from "@/lib/innovationConferenceAdminRepo";

export type IcAdminActionState = {
  ok: boolean;
  message: string;
};

export async function updateIcApplicationStatusAction(
  _prev: IcAdminActionState,
  formData: FormData
): Promise<IcAdminActionState> {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const canEdit = await canAdmin("innovation-conference", "edit");
  if (!canEdit) {
    return { ok: false, message: "ليس لديك صلاحية لتحديث حالة الطلب." };
  }

  const applicationId = String(formData.get("applicationId") || "");
  const toStatus = String(formData.get("toStatus") || "");
  const note = String(formData.get("note") || "");

  const result = await updateInnovationConferenceApplicationStatus({
    applicationId,
    toStatus,
    note,
    adminUserId: user.id,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath("/admin/innovation-conference");
  revalidatePath(`/admin/innovation-conference/${applicationId}`);
  return { ok: true, message: "تم تحديث حالة الطلب." };
}

export async function updateIcAdminNotesAction(
  _prev: IcAdminActionState,
  formData: FormData
): Promise<IcAdminActionState> {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/login");

  const canEdit = await canAdmin("innovation-conference", "edit");
  if (!canEdit) {
    return { ok: false, message: "ليس لديك صلاحية لحفظ الملاحظات." };
  }

  const applicationId = String(formData.get("applicationId") || "");
  const adminNotes = String(formData.get("adminNotes") || "");

  const result = await updateInnovationConferenceAdminNotes({
    applicationId,
    adminNotes,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath(`/admin/innovation-conference/${applicationId}`);
  return { ok: true, message: "تم حفظ الملاحظات." };
}
