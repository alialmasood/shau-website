import TuitionFeesPageClient from "@/app/components/TuitionFeesPageClient";
import { getDepartmentFeesForPage } from "@/lib/departmentFeeRepo";
import { getTuitionPdfMediaId } from "@/lib/tuitionPdfRepo";

export default async function EnTuitionFeesPage() {
  let departments: Awaited<ReturnType<typeof getDepartmentFeesForPage>> = [];
  let tuitionPdfMediaId: string | null = null;
  try {
    departments = await getDepartmentFeesForPage();
  } catch {
    departments = [];
  }
  try {
    tuitionPdfMediaId = await getTuitionPdfMediaId();
  } catch {
    tuitionPdfMediaId = null;
  }
  return <TuitionFeesPageClient locale="en" departments={departments} tuitionPdfMediaId={tuitionPdfMediaId} />;
}
