import Link from "next/link";
import { getAllDepartmentFees } from "@/lib/departmentFeeRepo";
import DeptFeeForm from "../DeptFeeForm";

export default async function AdminTuitionFeesNewPage() {
  const existing = await getAllDepartmentFees();
  const existingSlugs = existing.map((d) => d.departmentSlug);

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">إضافة سجل رسوم قسم</h1>
          <Link href="/admin/tuition-fees" className="px-4 py-2 rounded-full border border-neutral-200 font-semibold text-sm">إلغاء</Link>
        </div>
        <DeptFeeForm existingSlugs={existingSlugs} />
      </div>
    </div>
  );
}
