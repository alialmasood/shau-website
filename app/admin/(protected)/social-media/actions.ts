"use server";

import { revalidatePath } from "next/cache";
import { upsertSocialLinks, SOCIAL_PLATFORMS } from "@/lib/socialMediaRepo";

export async function saveSocialLinks(data: Record<string, string | null | undefined>) {
  const updates = SOCIAL_PLATFORMS.map((p) => ({
    platform: p.key,
    url: data[p.key] && String(data[p.key]).trim() ? String(data[p.key]).trim() : null,
  }));
  await upsertSocialLinks(updates);
  revalidatePath("/admin/social-media");
  revalidatePath("/ar");
  revalidatePath("/en");
}
