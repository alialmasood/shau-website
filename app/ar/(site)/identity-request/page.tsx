import type { Metadata } from "next";
import StaffIdentityRequestForm from "@/app/components/StaffIdentityRequestForm";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "طلب هوية الكادر | كلية الشرق",
  description: "نموذج التقديم للحصول على هوية للكادر في كلية الشرق للعلوم التقنية التخصصية",
};

export default function IdentityRequestPage() {
  const t = getTranslations("ar");
  const labels = t.identityRequest as Record<string, string>;
  return <StaffIdentityRequestForm locale="ar" labels={labels} />;
}
