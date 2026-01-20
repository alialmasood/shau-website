import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
};

export async function getAdminUserByEmail(email: string) {
  const res = await query(
    `SELECT id, email, password_hash, role
     FROM admin_users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  );
  return (res.rows?.[0] as AdminUserRow | undefined) ?? null;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await getAdminUserByEmail(email);
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { id: admin.id, email: admin.email, role: admin.role };
}

