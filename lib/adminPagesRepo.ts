import { query } from "./db";

export type AdminPageRow = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPagePermissionRow = {
  id: string;
  admin_user_id: string;
  page_id: string;
  can_access: boolean;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_upload: boolean;
  can_export: boolean;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAllAdminPages(): Promise<AdminPageRow[]> {
  const res = await query(
    `SELECT id, code, name_ar, name_en, created_at, updated_at
     FROM admin_pages
     ORDER BY code`
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
    nameEn: r.name_en ? String(r.name_en) : null,
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  }));
}

export async function getAdminPageByCode(code: string): Promise<AdminPageRow | null> {
  const res = await query(
    `SELECT id, code, name_ar, name_en, created_at, updated_at
     FROM admin_pages
     WHERE code = $1
     LIMIT 1`,
    [code]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: String(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
    nameEn: r.name_en ? String(r.name_en) : null,
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function getUserPagePermissions(userId: string): Promise<AdminPagePermissionRow[]> {
  const res = await query(
    `SELECT id, admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at
     FROM admin_page_permissions
     WHERE admin_user_id = $1
     ORDER BY page_id`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    admin_user_id: String(r.admin_user_id),
    page_id: String(r.page_id),
    can_access: Boolean(r.can_access),
    can_view: Boolean(r.can_view),
    can_create: Boolean(r.can_create),
    can_edit: Boolean(r.can_edit),
    can_delete: Boolean(r.can_delete),
    can_upload: Boolean(r.can_upload),
    can_export: Boolean(r.can_export),
    can_publish: Boolean(r.can_publish),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  }));
}

export async function getUserPagePermissionByCode(
  userId: string,
  pageCode: string
): Promise<AdminPagePermissionRow | null> {
  const res = await query(
    `SELECT app.id, app.admin_user_id, app.page_id, app.can_access, app.can_view, app.can_create, app.can_edit, app.can_delete, app.can_upload, app.can_export, app.can_publish, app.created_at, app.updated_at
     FROM admin_page_permissions app
     INNER JOIN admin_pages ap ON app.page_id = ap.id
     WHERE app.admin_user_id = $1 AND ap.code = $2
     LIMIT 1`,
    [userId, pageCode]
  );
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: String(r.id),
    admin_user_id: String(r.admin_user_id),
    page_id: String(r.page_id),
    can_access: Boolean(r.can_access),
    can_view: Boolean(r.can_view),
    can_create: Boolean(r.can_create),
    can_edit: Boolean(r.can_edit),
    can_delete: Boolean(r.can_delete),
    can_upload: Boolean(r.can_upload),
    can_export: Boolean(r.can_export),
    can_publish: Boolean(r.can_publish),
    created_at: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    updated_at: r.updated_at ? new Date(r.updated_at as string).toISOString() : "",
  };
}

export async function setUserPagePermissions(
  userId: string,
  pageId: string,
  permissions: {
    can_access: boolean;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_upload: boolean;
    can_export: boolean;
    can_publish: boolean;
  }
): Promise<void> {
  await query(
    `INSERT INTO admin_page_permissions (admin_user_id, page_id, can_access, can_view, can_create, can_edit, can_delete, can_upload, can_export, can_publish, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
     ON CONFLICT (admin_user_id, page_id)
     DO UPDATE SET
       can_access = EXCLUDED.can_access,
       can_view = EXCLUDED.can_view,
       can_create = EXCLUDED.can_create,
       can_edit = EXCLUDED.can_edit,
       can_delete = EXCLUDED.can_delete,
       can_upload = EXCLUDED.can_upload,
       can_export = EXCLUDED.can_export,
       can_publish = EXCLUDED.can_publish,
       updated_at = NOW()`,
    [
      userId,
      pageId,
      permissions.can_access,
      permissions.can_view,
      permissions.can_create,
      permissions.can_edit,
      permissions.can_delete,
      permissions.can_upload,
      permissions.can_export,
      permissions.can_publish,
    ]
  );
}

export async function deleteUserPagePermissions(userId: string): Promise<void> {
  await query(`DELETE FROM admin_page_permissions WHERE admin_user_id = $1`, [userId]);
}
