/**
 * بيانات الأقسام والرسوم الدراسية (مشتركة بين TuitionFeesSection وصفحة /tuition-fees)
 */

export type AdmissionKey = "biological" | "applied" | "scientific" | "industry";

export type TuitionDepartment = {
  id: number;
  slug: string;
  name: string;
  image: string;
  admissionKey: AdmissionKey;
  morningPrice: string;
  eveningPrice: string;
  morningMinGPA: string;
  eveningMinGPA: string;
  /** رسوم التسجيل إن وجدت */
  registrationFee: string | null;
  /** رسوم إضافية (مختبرات/تدريب…) */
  extraFees: string | null;
  /** الوثائق المطلوبة */
  requiredDocs: string[];
  /** بداية موعد التقديم */
  applicationFrom: string | null;
  /** نهاية موعد التقديم */
  applicationTo: string | null;
  /** نبذة قصيرة */
  brief: string | null;
  /** مدة الدراسة (سنوات) */
  studyDuration: string | null;
};

/** قائمة slugs الأقسام المعرّفة (للاختيار في أدمن الرسوم) */
export const DEPARTMENT_SLUGS = [
  "dental-technology", "anesthesia-technology", "radiology-technology", "optics-technology",
  "emergency-medicine", "physical-therapy", "medical-physics-radiotherapy", "oil-gas-engineering",
  "cybersecurity-cloud-computing", "construction-engineering",
] as const;

export const tuitionDepartments: TuitionDepartment[] = [
  { id: 1, slug: "dental-technology", name: "قسم تقنيات صناعة الاسنان", image: "/hero-image-1.jpg", admissionKey: "biological", morningPrice: "2,500,000", eveningPrice: "1,800,000", morningMinGPA: "75%", eveningMinGPA: "70%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 2, slug: "anesthesia-technology", name: "قسم تقنيات التخدير", image: "/hero-image-2.jpg", admissionKey: "biological", morningPrice: "2,400,000", eveningPrice: "1,750,000", morningMinGPA: "74%", eveningMinGPA: "69%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 3, slug: "radiology-technology", name: "قسم تقنيات الاشعة", image: "/hero-image-3.jpg", admissionKey: "biological", morningPrice: "2,600,000", eveningPrice: "1,900,000", morningMinGPA: "76%", eveningMinGPA: "71%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 4, slug: "optics-technology", name: "قسم تقنيات البصريات", image: "/hero-image-1.jpg", admissionKey: "biological", morningPrice: "2,300,000", eveningPrice: "1,700,000", morningMinGPA: "73%", eveningMinGPA: "68%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 5, slug: "emergency-medicine", name: "قسم تقنيات طب الطوارئ والاسعافات الاولية", image: "/hero-image-2.jpg", admissionKey: "biological", morningPrice: "2,550,000", eveningPrice: "1,850,000", morningMinGPA: "75%", eveningMinGPA: "70%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 6, slug: "physical-therapy", name: "قسم تقنيات العلاج الطبيعي", image: "/hero-image-3.jpg", admissionKey: "biological", morningPrice: "2,450,000", eveningPrice: "1,800,000", morningMinGPA: "74%", eveningMinGPA: "69%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 7, slug: "medical-physics-radiotherapy", name: "قسم هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي", image: "/hero-image-1.jpg", admissionKey: "applied", morningPrice: "2,700,000", eveningPrice: "1,950,000", morningMinGPA: "77%", eveningMinGPA: "72%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 8, slug: "oil-gas-engineering", name: "قسم هندسة تقنيات النفط والغاز", image: "/hero-image-2.jpg", admissionKey: "applied", morningPrice: "2,800,000", eveningPrice: "2,000,000", morningMinGPA: "78%", eveningMinGPA: "73%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 9, slug: "cybersecurity-cloud-computing", name: "قسم هندسة تقنيات الامن السيبراني والحوسبة السحابية", image: "/hero-image-3.jpg", admissionKey: "scientific", morningPrice: "2,900,000", eveningPrice: "2,100,000", morningMinGPA: "80%", eveningMinGPA: "75%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
  { id: 10, slug: "construction-engineering", name: "قسم هندسة تقنيات البناء والانشاءات", image: "/hero-image-1.jpg", admissionKey: "industry", morningPrice: "2,600,000", eveningPrice: "1,900,000", morningMinGPA: "76%", eveningMinGPA: "71%", registrationFee: null, extraFees: null, requiredDocs: [], applicationFrom: null, applicationTo: null, brief: null, studyDuration: "4" },
];
