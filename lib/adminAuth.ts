import bcrypt from "bcryptjs";
import { getAdminUserByEmail } from "@/lib/adminUsersRepo";

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await getAdminUserByEmail(email);
  if (!admin) return null;
  if (!admin.is_active) return null; // التحقق من أن المستخدم نشط
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { id: admin.id, email: admin.email, role: admin.role };
}

