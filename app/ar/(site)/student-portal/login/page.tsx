"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { studentLogin } from "../actions";

export default function StudentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await studentLogin(username, password);
      if (result.success) {
        // Always redirect to dashboard after successful login
        router.push("/ar/student/dashboard");
        router.refresh();
      } else {
        setError(result.error || "فشل تسجيل الدخول");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#31BD9C]/10 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-neutral-900 mb-2">بوابة الطلبة</h1>
            <p className="text-sm text-neutral-600">تسجيل الدخول لعرض النتائج</p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-800">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 outline-none"
              />
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2.5 rounded-xl bg-[#31BD9C] text-white font-bold hover:bg-[#2aa88a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
