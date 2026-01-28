"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeStudentPasswordAction } from "./actions";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Client-side validation
    const currentPassword = String(formData.get("current_password") ?? "").trim();
    const newPassword = String(formData.get("new_password") ?? "").trim();
    const confirmPassword = String(formData.get("confirm_password") ?? "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين");
      return;
    }

    if (currentPassword === newPassword) {
      setError("كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية");
      return;
    }

    startTransition(async () => {
      try {
        const result = await changeStudentPasswordAction(formData);
        if (!result.success && result.error) {
          setError(result.error);
        }
        // If successful, redirect happens in server action
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء تغيير كلمة المرور");
      }
    });
  }

  return (
    <div className="rounded-2xl shadow-sm border border-neutral-200 bg-white p-4 md:p-6">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
            <p className="text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-sm md:text-base font-bold text-neutral-900 mb-2">
            كلمة المرور الحالية
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              name="current_password"
              required
              className="w-full px-4 py-2.5 md:py-3 h-11 md:h-auto rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none text-sm md:text-base"
              placeholder="أدخل كلمة المرور الحالية"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
            >
              {showPasswords.current ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm md:text-base font-bold text-neutral-900 mb-2">
            كلمة المرور الجديدة
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              name="new_password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 md:py-3 h-11 md:h-auto rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none text-sm md:text-base"
              placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
            >
              {showPasswords.new ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">يجب أن تكون 8 أحرف على الأقل</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm md:text-base font-bold text-neutral-900 mb-2">
            تأكيد كلمة المرور الجديدة
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              name="confirm_password"
              required
              minLength={8}
              className="w-full px-4 py-2.5 md:py-3 h-11 md:h-auto rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none text-sm md:text-base"
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
            >
              {showPasswords.confirm ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-6 py-2.5 md:py-3 h-11 md:h-auto rounded-xl bg-[#31BD9C] text-white text-sm md:text-base font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "جاري تغيير كلمة المرور..." : "تغيير كلمة المرور"}
          </button>
        </div>
      </form>
    </div>
  );
}
