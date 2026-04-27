import type { Metadata } from "next";
import CeDepartmentContent from "@/app/components/CeDepartmentContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "شعبة التعليم المستمر | كلية الشرق للعلوم التقنية التخصصية",
  description: "الندوات والورش والدورات وشهادات المشاركة — كلية الشرق للعلوم التقنية التخصصية",
};

export default function ArContinuingEducationPage() {
  return <CeDepartmentContent locale="ar" />;
}
