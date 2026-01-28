import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/studentSession";
import { getStudentUserByStudentId } from "@/lib/studentUsersRepo";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ChangePasswordPage() {
  // Always redirect to dashboard - change password flow is disabled for now
  redirect("/ar/student/dashboard");
}
