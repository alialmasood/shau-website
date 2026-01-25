/**
 * قائمة تصنيفات رسوم الأقسام (يمكن اختيار أكثر من واحد لكل قسم).
 * value = المفتاح المخزّن في DB، labelAr/labelEn = العرض.
 */
export const DEPT_FEE_CATEGORY_OPTIONS: { value: string; labelAr: string; labelEn: string }[] = [
  { value: "scientific", labelAr: "العلمي", labelEn: "Scientific" },
  { value: "biological", labelAr: "الاحيائي", labelEn: "Biological" },
  { value: "applied", labelAr: "التطبيقي", labelEn: "Applied" },
  { value: "nursing_prep", labelAr: "اعدادية التمريض", labelEn: "Nursing Prep" },
  { value: "midwifery_prep", labelAr: "اعدادية القباله", labelEn: "Midwifery Prep" },
  { value: "industrial_medical_devices", labelAr: "صناعي اجهزة طبية", labelEn: "Industrial Medical Devices" },
  { value: "industrial_laser", labelAr: "صناعي صيانة منظومات الليزر", labelEn: "Industrial Laser Systems" },
  { value: "industrial_communications", labelAr: "صناعي الاتصالات والكهرباء واالكترونيك والسيطرة", labelEn: "Industrial Communications, Electrical, Electronics and Control" },
  { value: "industrial_oil_gas", labelAr: "صناعي تكرير النفط ومعالجة الغاز", labelEn: "Industrial Oil Refining and Gas Processing" },
  { value: "industrial_petrochemicals", labelAr: "صناعي صناعة البتروكيمياويات", labelEn: "Industrial Petrochemicals" },
  { value: "industrial_it_networks", labelAr: "صناعي حاسبات و شبكات و تكنولوجيا اعلام الحاسوب", labelEn: "Industrial IT, Networks and Computer Media Tech" },
  { value: "industrial_construction", labelAr: "صناعي البناء والرسم والهندسي والمساحة", labelEn: "Industrial Construction, Drawing, Engineering and Surveying" },
  { value: "vocational_railway", labelAr: "مركز التدريب المهني معهد السكك", labelEn: "Vocational Training Center - Railway Institute" },
  // للتوافق مع البيانات القديمة
  { value: "industry", labelAr: "إعدادية صناعة", labelEn: "Industrial Preparatory" },
  { value: "admin", labelAr: "إداري", labelEn: "Admin" },
];

export function getCategoryLabel(slug: string, locale: "ar" | "en"): string {
  const o = DEPT_FEE_CATEGORY_OPTIONS.find((c) => c.value === slug);
  return o ? (locale === "ar" ? o.labelAr : o.labelEn) : slug;
}
