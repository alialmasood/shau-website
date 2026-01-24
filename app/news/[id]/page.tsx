import { redirect } from "next/navigation";

/**
 * هذا المسار /news/[id] يتم توجيهه عبر الـ middleware إلى /ar/[id].
 * هذا الصفحة احتياطية في حال لم يُطبّق الـ middleware.
 */
export default async function NewsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/ar/${id}`);
}
