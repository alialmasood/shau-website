import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyAdminCredentials } from "@/lib/adminAuth";
import { setAdminSessionCookie } from "@/lib/adminSession";

// منع cache هذه الصفحة
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=1");
  }

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    redirect("/admin/login?error=1");
  }

  // جلب بيانات المستخدم قبل تعيين الـ cookie للحصول على custom_url
  const { getAdminUserByEmail } = await import("@/lib/adminUsersRepo");
  const userData = await getAdminUserByEmail(email);
  
  // تحديد الرابط المخصص
  let redirectUrl = "/admin"; // القيمة الافتراضية
  
  // إذا كان المستخدم لديه custom_url، استخدمه (حتى لو لم يكن ADMIN)
  if (userData?.custom_url) {
    const customUrl = String(userData.custom_url).trim();
    
    // التأكد من أن الرابط يبدأ بـ /admin وليس فارغاً
    if (customUrl && customUrl.length > 0 && customUrl.startsWith("/admin")) {
      redirectUrl = customUrl;
      console.log(`[loginAction] Redirecting user ${email} to custom_url: ${redirectUrl}`);
    }
  }
  
  // تعيين الـ cookie
  await setAdminSessionCookie(admin.id);
  
  // إعادة التحقق من المسار قبل التوجيه
  revalidatePath(redirectUrl);
  
  // التوجيه إلى الرابط المحدد
  redirect(redirectUrl);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = Boolean(params?.error);

  return (
    <div className="w-full bg-gradient-to-b from-white to-neutral-50">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              تسجيل دخول الأدمن
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.
            </p>
          </div>

          {hasError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              البريد الإلكتروني أو كلمة المرور غير صحيحة.
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                name="email"
                type="email"
                placeholder="admin@shau.edu.iq"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                كلمة المرور
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-[#31BD9C] focus:ring-2 focus:ring-[#31BD9C]/20 transition-all text-sm sm:text-base"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[#31BD9C] hover:bg-[#2aa88a] text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              دخول
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-neutral-600 hover:text-[#31BD9C] transition-colors"
            >
              العودة إلى الموقع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

