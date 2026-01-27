import bcrypt from "bcryptjs";
import { query } from "./db";

export type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  full_name: string | null;
  custom_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminPermissionRow = {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  created_at: string;
};

export type AdminUserWithPermissions = AdminUserRow & {
  permissions: AdminPermissionRow[];
};

function mapRow(r: { [k: string]: unknown }): AdminUserRow {
  // التحقق من custom_url بشكل صريح
  let customUrl: string | null = null;
  if (r.custom_url !== null && r.custom_url !== undefined && String(r.custom_url).trim() !== "") {
    customUrl = String(r.custom_url).trim();
  }
  
  return {
    id: String(r.id),
    email: String(r.email),
    password_hash: String(r.password_hash),
    role: String(r.role),
    full_name: r.full_name ? String(r.full_name) : null,
    custom_url: customUrl,
    is_active: Boolean(r.is_active),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function getAllAdminUsers(): Promise<AdminUserRow[]> {
  try {
    const res = await query(
      `SELECT id, email, password_hash, role, full_name, custom_url, is_active, created_at, updated_at
       FROM admin_users
       ORDER BY created_at DESC`
    );
    console.log(`[getAllAdminUsers] Query returned ${res.rows.length} rows`);
    const mapped = res.rows.map(mapRow);
    console.log(`[getAllAdminUsers] Mapped ${mapped.length} users`);
    return mapped;
  } catch (error) {
    console.error("[getAllAdminUsers] Database error:", error);
    throw error;
  }
}

export async function getAdminUserById(id: string): Promise<AdminUserRow | null> {
  const s = String(id || "").trim();
  if (!s) return null;
  const res = await query(
    `SELECT id, email, password_hash, role, full_name, custom_url, is_active, created_at, updated_at
     FROM admin_users
     WHERE id = $1
     LIMIT 1`,
    [s]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRow | null> {
  const res = await query(
    `SELECT id, email, password_hash, role, full_name, custom_url, is_active, created_at, updated_at
     FROM admin_users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

export async function getAdminUserWithPermissions(id: string): Promise<AdminUserWithPermissions | null> {
  try {
    const user = await getAdminUserById(id);
    if (!user) return null;

    const permissionsRes = await query(
      `SELECT p.id, p.name, p.description, p.resource, p.action, p.created_at
       FROM admin_permissions p
       INNER JOIN admin_user_permissions up ON p.id = up.permission_id
       WHERE up.admin_user_id = $1
       ORDER BY p.resource, p.action`,
      [id]
    );

    const permissions: AdminPermissionRow[] = (permissionsRes.rows || []).map((r) => ({
      id: String(r.id || ""),
      name: String(r.name || ""),
      description: r.description ? String(r.description) : null,
      resource: String(r.resource || ""),
      action: String(r.action || ""),
      created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    }));

    return {
      ...user,
      permissions: permissions || [],
    };
  } catch (error) {
    console.error("Error in getAdminUserWithPermissions:", error);
    // في حالة الخطأ، إرجاع بيانات المستخدم فقط بدون صلاحيات
    const user = await getAdminUserById(id);
    if (!user) return null;
    return {
      ...user,
      permissions: [],
    };
  }
}

export type CreateAdminUserInput = {
  email: string;
  password: string;
  role: string;
  full_name?: string | null;
  custom_url?: string | null;
  permissions?: string[]; // permission IDs
};

export async function createAdminUser(input: CreateAdminUserInput): Promise<string> {
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // إنشاء المستخدم مع جميع الحقول بشكل صريح
  const res = await query(
    `INSERT INTO admin_users (email, password_hash, role, full_name, custom_url, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id`,
    [
      input.email, 
      hashedPassword, 
      input.role, 
      input.full_name || null, 
      input.custom_url || null,
      true // is_active - المستخدم الجديد يكون نشطاً افتراضياً
    ]
  );

  const userId = String(res.rows[0].id);

  // إضافة الصلاحيات إذا كانت موجودة
  if (input.permissions && input.permissions.length > 0) {
    for (const permissionId of input.permissions) {
      try {
        await query(
          `INSERT INTO admin_user_permissions (admin_user_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (admin_user_id, permission_id) DO NOTHING`,
          [userId, permissionId]
        );
      } catch (error) {
        console.error(`Error adding permission ${permissionId} to user ${userId}:`, error);
      }
    }
  }

  return userId;
}

export type UpdateAdminUserInput = {
  id: string;
  email?: string;
  password?: string;
  role?: string;
  full_name?: string | null;
  custom_url?: string | null;
  is_active?: boolean;
  permissions?: string[];
};

export async function updateAdminUser(input: UpdateAdminUserInput): Promise<boolean> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(input.email);
  }

  if (input.password !== undefined) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    updates.push(`password_hash = $${paramIndex++}`);
    values.push(hashedPassword);
  }

  if (input.role !== undefined) {
    updates.push(`role = $${paramIndex++}`);
    values.push(input.role);
  }

  if (input.full_name !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    values.push(input.full_name);
  }

  if (input.custom_url !== undefined) {
    updates.push(`custom_url = $${paramIndex++}`);
    values.push(input.custom_url);
  }

  if (input.is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(input.is_active);
  }

  if (updates.length === 0) {
    // لا توجد تحديثات للبيانات الأساسية
  } else {
    updates.push(`updated_at = NOW()`);
    values.push(input.id);

    await query(
      `UPDATE admin_users
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}`,
      values
    );
  }

  // تحديث الصلاحيات إذا كانت موجودة
  if (input.permissions !== undefined) {
    // حذف جميع الصلاحيات الحالية
    await query(`DELETE FROM admin_user_permissions WHERE admin_user_id = $1`, [input.id]);

    // إضافة الصلاحيات الجديدة
    if (input.permissions.length > 0) {
      for (const permissionId of input.permissions) {
        try {
          await query(
            `INSERT INTO admin_user_permissions (admin_user_id, permission_id)
             VALUES ($1, $2)`,
            [input.id, permissionId]
          );
        } catch (error) {
          console.error(`Error adding permission ${permissionId} to user ${input.id}:`, error);
        }
      }
    }
  }

  return true;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  const s = String(id || "").trim();
  if (!s) return false;

  const res = await query(`DELETE FROM admin_users WHERE id = $1 RETURNING id`, [s]);
  return res.rows.length > 0;
}

// إدارة الصلاحيات
export async function getAllPermissions(): Promise<AdminPermissionRow[]> {
  const res = await query(
    `SELECT id, name, description, resource, action, created_at
     FROM admin_permissions
     ORDER BY resource, action`
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    resource: String(r.resource),
    action: String(r.action),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
  }));
}

export async function createPermission(
  name: string,
  description: string | null,
  resource: string,
  action: string
): Promise<string> {
  const res = await query(
    `INSERT INTO admin_permissions (name, description, resource, action)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [name, description, resource, action]
  );
  return String(res.rows[0].id);
}

// التحقق من الصلاحيات
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const res = await query(
    `SELECT 1
     FROM admin_user_permissions up
     INNER JOIN admin_permissions p ON up.permission_id = p.id
     WHERE up.admin_user_id = $1 AND p.resource = $2 AND p.action = $3
     LIMIT 1`,
    [userId, resource, action]
  );
  return res.rows.length > 0;
}

export async function getUserPermissions(userId: string): Promise<AdminPermissionRow[]> {
  const res = await query(
    `SELECT p.id, p.name, p.description, p.resource, p.action, p.created_at
     FROM admin_permissions p
     INNER JOIN admin_user_permissions up ON p.id = up.permission_id
     WHERE up.admin_user_id = $1
     ORDER BY p.resource, p.action`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    resource: String(r.resource),
    action: String(r.action),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
  }));
}
