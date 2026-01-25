import ApplyForm from "@/app/components/ApplyForm";
import { getDepartmentFeesForPage } from "@/lib/departmentFeeRepo";

export default async function ArApplyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams ?? {};
  const dept = typeof sp.department === "string" ? sp.department : Array.isArray(sp.department) ? sp.department[0] : undefined;
  const study = typeof sp.studyType === "string" ? sp.studyType : Array.isArray(sp.studyType) ? sp.studyType[0] : undefined;
  const studyType = (study?.toLowerCase() === "evening" ? "evening" : study?.toLowerCase() === "morning" ? "morning" : null) as "morning" | "evening" | null;

  let departments: { id: string; displayName: string | null; displayNameEn: string | null }[] = [];
  try {
    const rows = await getDepartmentFeesForPage();
    departments = rows.map((d) => ({ id: d.id, displayName: d.displayName, displayNameEn: d.displayNameEn }));
  } catch {
    departments = [];
  }

  return (
    <ApplyForm
      locale="ar"
      departments={departments}
      initialDepartmentId={dept || null}
      initialStudyType={studyType}
    />
  );
}
