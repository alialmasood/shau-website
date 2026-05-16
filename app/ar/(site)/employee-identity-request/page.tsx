import type { Metadata } from "next";
import EmployeeIdentityRequestForm from "@/app/components/EmployeeIdentityRequestForm";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "طلب هوية موظف | كلية الشرق",
  description: "نموذج طلب هوية للموظفين — شهادة بكالوريوس فما دون",
};

export default function EmployeeIdentityRequestPage() {
  const t = getTranslations("ar");
  const labels = (t.employeeIdentityRequest ?? {}) as Record<string, string>;
  return <EmployeeIdentityRequestForm locale="ar" labels={labels} />;
}
