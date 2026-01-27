"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEPARTMENTS = [
  "تقنيات صناعة الاسنان",
  "تقنيات التخدير",
  "تقنيات الاشعة",
  "تقنيات البصريات",
  "تقنيات طب الطوارئ والاسعافات الاولية",
  "تقنيات العلاج الطبيعي",
  "هندسة تقنيات الفيزياء الصحية والعلاج الاشعاعي",
  "هندسة تقنيات النفط والغاز",
  "هندسة تقنيات الامن السيبراني والحوسبة السحابية",
  "هندسة تقنيات البناء والانشاءات",
];

const STAGES = ["المرحلة الاولى", "المرحلة الثانية", "المرحلة الثالثة", "المرحلة الرابعة"];

const STUDY_TYPES = [
  { value: "morning", label: "صباحي" },
  { value: "evening", label: "مسائي" },
];

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    stage: "",
    studyType: "", // نوع الدراسة (صباحي/مسائي)
    phone: "",
    phoneNumber: "", // رقم الهاتف بدون المفتاح
  });

  const [files, setFiles] = useState({
    personalPhoto: null as File | null,
    studentIdFront: null as File | null,
    studentIdBack: null as File | null,
    fatherIdFront: null as File | null,
    fatherIdBack: null as File | null,
    motherIdFront: null as File | null,
    motherIdBack: null as File | null,
    residenceCardFront: null as File | null,
    residenceCardBack: null as File | null,
    highSchoolCertificate: null as File | null,
    barcodeDocument: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // تنسيق رقم الهاتف: إزالة أي أحرف غير رقمية
    if (name === "phoneNumber") {
      const numbersOnly = value.replace(/\D/g, "");
      // الحد الأقصى 10 أرقام
      const limited = numbersOnly.slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: limited }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const validatePhone = (phoneNumber: string): boolean => {
    // رقم هاتف عراقي: يجب أن يكون 10 أرقام ويبدأ بـ 7
    const cleaned = phoneNumber.replace(/\D/g, "");
    return /^7\d{9}$/.test(cleaned);
  };

  const getFullPhone = (): string => {
    const cleaned = formData.phoneNumber.replace(/\s|-/g, "");
    // إزالة الصفر الأول إذا كان موجوداً
    const withoutZero = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
    return `+964${withoutZero}`;
  };

  async function uploadFile(file: File | null): Promise<string | null> {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/media/public", { method: "POST", body: formData });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error || "فشل رفع الملف");
    return String(json.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // التحقق من الحقول المطلوبة
    if (!formData.fullName.trim()) {
      setError("الرجاء إدخال الاسم الرباعي واللقب");
      return;
    }
    if (!formData.department) {
      setError("الرجاء اختيار القسم");
      return;
    }
    if (!formData.stage) {
      setError("الرجاء اختيار المرحلة");
      return;
    }
    if (!formData.studyType) {
      setError("الرجاء اختيار نوع الدراسة");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError("الرجاء إدخال رقم الهاتف");
      return;
    }
    if (!validatePhone(formData.phoneNumber)) {
      setError("رقم الهاتف غير صحيح. يجب أن يكون 10 أرقام ويبدأ بـ 7 (مثال: 7901234567)");
      return;
    }

    // التحقق من الملفات المطلوبة
    if (!files.personalPhoto) {
      setError("الرجاء رفع الصورة الشخصية");
      return;
    }
    if (!files.studentIdFront || !files.studentIdBack) {
      setError("الرجاء رفع البطاقة الوطنية للطالب (الوجه الأمامي والخلفي)");
      return;
    }
    if (!files.fatherIdFront || !files.fatherIdBack) {
      setError("الرجاء رفع البطاقة الوطنية للأب (الوجه الأمامي والخلفي)");
      return;
    }
    if (!files.motherIdFront || !files.motherIdBack) {
      setError("الرجاء رفع البطاقة الوطنية للأم (الوجه الأمامي والخلفي)");
      return;
    }
    if (!files.residenceCardFront || !files.residenceCardBack) {
      setError("الرجاء رفع بطاقة السكن (الوجه الأمامي والخلفي)");
      return;
    }
    if (!files.highSchoolCertificate) {
      setError("الرجاء رفع وثيقة الدراسة الإعدادية الأصلية");
      return;
    }
    if (!files.barcodeDocument) {
      setError("الرجاء رفع ورقة الباركود الخاصة بوثيقة الدراسة الإعدادية");
      return;
    }

    setIsSubmitting(true);

    try {
      // رفع جميع الملفات
      const [
        personalPhotoId,
        studentIdFrontId,
        studentIdBackId,
        fatherIdFrontId,
        fatherIdBackId,
        motherIdFrontId,
        motherIdBackId,
        residenceCardFrontId,
        residenceCardBackId,
        highSchoolCertificateId,
        barcodeDocumentId,
      ] = await Promise.all([
        uploadFile(files.personalPhoto),
        uploadFile(files.studentIdFront),
        uploadFile(files.studentIdBack),
        uploadFile(files.fatherIdFront),
        uploadFile(files.fatherIdBack),
        uploadFile(files.motherIdFront),
        uploadFile(files.motherIdBack),
        uploadFile(files.residenceCardFront),
        uploadFile(files.residenceCardBack),
        uploadFile(files.highSchoolCertificate),
        uploadFile(files.barcodeDocument),
      ]);

      // إرسال البيانات
      const response = await fetch("/api/registration-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          department: formData.department,
          stage: formData.stage,
          studyType: formData.studyType,
          phone: getFullPhone(),
          personalPhotoId,
          studentIdFrontId,
          studentIdBackId,
          fatherIdFrontId,
          fatherIdBackId,
          motherIdFrontId,
          motherIdBackId,
          residenceCardFrontId,
          residenceCardBackId,
          highSchoolCertificateId,
          barcodeDocumentId,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "فشل حفظ البيانات");
      }

      setSuccess("تم إرسال المستمسكات بنجاح! شكراً لك.");
      setTimeout(() => {
        router.push("/ar/required-documents");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الإرسال");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10" dir="rtl">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">
          تحميل المستمسكات
        </h1>

        {error && (
          <div className="mb-6 p-5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-base mb-1">فشل الإرسال</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 rounded-xl bg-green-50 border-2 border-green-300 text-green-800 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-base mb-1">تم الإرسال بنجاح!</p>
                <p className="text-sm">{success}</p>
                <p className="text-xs mt-2 text-green-700">سيتم توجيهك إلى الصفحة الرئيسية خلال ثوانٍ...</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-6 ${success ? "opacity-50 pointer-events-none" : ""}`}>
          {/* الاسم الرباعي واللقب */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              الاسم الرباعي واللقب <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            />
          </div>

          {/* القسم */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              القسم <span className="text-red-500">*</span>
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            >
              <option value="">اختر القسم</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* المرحلة */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              المرحلة <span className="text-red-500">*</span>
            </label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            >
              <option value="">اختر المرحلة</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {/* نوع الدراسة */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              نوع الدراسة <span className="text-red-500">*</span>
            </label>
            <select
              name="studyType"
              value={formData.studyType}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            >
              <option value="">اختر نوع الدراسة</option>
              {STUDY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center px-4 py-2.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-700 font-semibold whitespace-nowrap">
                +964
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="7901234567"
                required
                maxLength={10}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                dir="ltr"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">أدخل رقم الهاتف العراقي (10 أرقام، يبدأ بـ 7، مثال: 7901234567)</p>
          </div>

          {/* الصورة الشخصية */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              الصورة الشخصية (خلفية بيضاء) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "personalPhoto")}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            />
          </div>

          {/* البطاقة الوطنية للطالب */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              البطاقة الوطنية للطالب <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الأمامي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "studentIdFront")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الخلفي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "studentIdBack")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* البطاقة الوطنية للأب */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              البطاقة الوطنية للأب <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الأمامي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "fatherIdFront")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الخلفي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "fatherIdBack")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* البطاقة الوطنية للأم */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              البطاقة الوطنية للأم <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الأمامي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "motherIdFront")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الخلفي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "motherIdBack")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* بطاقة السكن */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              بطاقة السكن <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الأمامي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "residenceCardFront")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">الوجه الخلفي</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "residenceCardBack")}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* وثيقة الدراسة الإعدادية */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              وثيقة الدراسة الإعدادية الأصلية <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, "highSchoolCertificate")}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            />
          </div>

          {/* ورقة الباركود */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              ورقة الباركود الخاصة بوثيقة الدراسة الإعدادية <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, "barcodeDocument")}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
            />
          </div>

          {/* زر الإرسال */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال المستمسكات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
