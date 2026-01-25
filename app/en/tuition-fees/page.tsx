import TuitionFeesPageClient from "@/app/components/TuitionFeesPageClient";
import { getDepartmentFeesForPage } from "@/lib/departmentFeeRepo";

export default async function EnTuitionFeesPage() {
  let departments: Awaited<ReturnType<typeof getDepartmentFeesForPage>> = [];
  try {
    departments = await getDepartmentFeesForPage();
  } catch {
    departments = [];
  }
  return <TuitionFeesPageClient locale="en" departments={departments} />;
}
