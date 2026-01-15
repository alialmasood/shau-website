"use client";

import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // هنا يمكنك إضافة منطق إرسال النموذج
    setTimeout(() => {
      setIsSubmitting(false);
      alert("شكراً لك! سنتواصل معك قريباً.");
      setFormData({ firstName: "", lastName: "", phone: "", email: "" });
    }, 1000);
  };

  return (
    <section className="relative w-full h-[600px] sm:h-[700px] md:h-[800px] lg:h-[900px] overflow-hidden" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, display: 'block' }}>
      {/* الخريطة كخلفية كاملة */}
      <div className="absolute inset-0 w-full h-full z-0">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.518648884789!2d44.3661!3d33.3152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDE4JzU0LjciTiA0NMKwMjEnNTguMCJF!5e0!3m2!1sar!2siq!4v1234567890123!5m2!1sar!2siq"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="عنوان كلية الشرق للعلوم التقنية التخصصية"
          className="w-full h-full"
        ></iframe>
        {/* Overlay شفاف لتغميق الخريطة قليلاً - pointer-events-none للسماح بالتفاعل مع الخريطة */}
        <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none"></div>
      </div>

      {/* المحتوى فوق الخريطة - pointer-events-auto للسماح بالتفاعل مع النموذج */}
      <div className="relative z-20 w-full h-full flex items-center justify-start px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 pointer-events-none" style={{ paddingBottom: 0 }}>
        <div className="w-full">
          <div className="max-w-xs mr-auto ml-0">
            {/* خانة الفورم */}
            <div className="w-full pointer-events-auto">
              <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-4 sm:p-5 md:p-6 h-full w-full flex flex-col">
                {/* العنوان */}
                <div className="mb-4 sm:mb-5">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg">
                    هل من أسئلة؟
                  </h3>
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold text-[#31BD9C] drop-shadow-lg">
                    تحدث مع خبير
                  </h4>
                </div>

                {/* نموذج الاتصال */}
                <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">
                  {/* الاسم */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-semibold text-white mb-1.5 drop-shadow-lg"
                    >
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/90 border-2 border-white/50 rounded-lg focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20 transition-all duration-300 text-sm"
                      placeholder="أدخل اسمك"
                    />
                  </div>

                  {/* اللقب */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-semibold text-white mb-1.5 drop-shadow-lg"
                    >
                      اللقب <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/90 border-2 border-white/50 rounded-lg focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20 transition-all duration-300 text-sm"
                      placeholder="أدخل لقبك"
                    />
                  </div>

                  {/* رقم الهاتف */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold text-white mb-1.5 drop-shadow-lg"
                    >
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/90 border-2 border-white/50 rounded-lg focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20 transition-all duration-300 text-sm"
                      placeholder="07XX XXX XXXX"
                    />
                  </div>

                  {/* البريد الإلكتروني */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-white mb-1.5 drop-shadow-lg"
                    >
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/90 border-2 border-white/50 rounded-lg focus:border-[#31BD9C] focus:outline-none focus:ring-2 focus:ring-[#31BD9C]/20 transition-all duration-300 text-sm"
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* زر الإرسال */}
                  <div className="pt-2 mt-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-semibold text-xs sm:text-sm rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          جاري الإرسال...
                        </span>
                      ) : (
                        "إرسال الطلب"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
