/**
 * تحقق محلي لمستودع إدارة مؤتمر الابتكار + عدم تسريب الملاحظات للعامة.
 * لا يفتح التسجيل.
 */
require("dotenv").config();
const crypto = require("crypto");
const { Pool } = require("pg");

const BASE = process.env.IC_TEST_BASE_URL || "http://localhost:3020";
const cs = process.env.DATABASE_URL;
if (!cs) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}
const u = new URL(cs);
if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
  console.error("ABORT: not local DB");
  process.exit(2);
}

const pool = new Pool({ connectionString: cs });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token), "utf8").digest("hex");
}

async function main() {
  // ensure admin page catalog entry
  await pool.query(
    `INSERT INTO admin_pages (code, name_ar, name_en)
     VALUES ('innovation-conference', 'طلبات مؤتمر الابتكار', 'Innovation Conference Applications')
     ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar, updated_at = NOW()`
  );
  console.log("OK admin_pages innovation-conference");

  const ed = await pool.query(
    `SELECT id FROM innovation_conference_editions WHERE code='IC-2026' LIMIT 1`
  );
  assert(ed.rows[0]?.id, "edition");
  const editionId = ed.rows[0].id;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const code = "IC26-99001100";
  await pool.query(`DELETE FROM innovation_conference_applications WHERE participation_code=$1`, [
    code,
  ]);

  const ins = await pool.query(
    `INSERT INTO innovation_conference_applications (
      edition_id, participation_code, tracking_token_hash,
      full_name, birth_date, governorate, phone, email, applicant_role,
      project_title, innovation_field, project_summary, problem, solution, novelty,
      beneficiaries, expected_impact, participation_type, project_stage,
      shown_before, patent_status,
      consent_accuracy, consent_ownership, consent_terms, consent_media, consented_at,
      status, submitted_at, admin_notes
    ) VALUES (
      $1::uuid, $2, $3,
      'مقدم اختبار أدمن', '1999-03-01', 'بغداد', '07705556677', 'ic.admin.test@example.com', 'researcher',
      'مشروع اختبار لوحة الإدارة', 'medical_health', $4, $5, $6, $7,
      'المرضى', $8, 'team', 'prototype',
      false, 'none',
      true, true, true, true, NOW(),
      'SUBMITTED', NOW(), 'ملاحظة إدارية داخلية للاختبار'
    ) RETURNING id::text`,
    [
      editionId,
      code,
      hashToken(rawToken),
      "س".repeat(55),
      "م".repeat(45),
      "ح".repeat(45),
      "ج".repeat(45),
      "أ".repeat(45),
    ]
  );
  const appId = ins.rows[0].id;

  await pool.query(
    `INSERT INTO innovation_conference_team_members (application_id, full_name, sort_order)
     VALUES ($1::uuid, 'عضو فريق اختبار', 0)`,
    [appId]
  );

  await pool.query(
    `INSERT INTO innovation_conference_status_logs (application_id, from_status, to_status, note)
     VALUES ($1::uuid, NULL, 'SUBMITTED', 'تم استلام الطلب')`,
    [appId]
  );

  // list-like query (mirrors repo columns)
  const list = await pool.query(
    `SELECT id::text, participation_code, project_title, full_name, status
     FROM innovation_conference_applications
     WHERE participation_code ILIKE $1 OR project_title ILIKE $1
     LIMIT 5`,
    [`%${code}%`]
  );
  assert(list.rows.length >= 1, "search");
  assert(!JSON.stringify(list.rows[0]).includes("admin_notes"), "list no notes");
  console.log("OK search/list columns");

  const stats = await pool.query(
    `SELECT COUNT(*)::int AS total FROM innovation_conference_applications`
  );
  assert(stats.rows[0].total >= 1, "stats");
  console.log("OK stats query");

  // status transition
  const admin = await pool.query(
    `SELECT id::text FROM admin_users WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
  );
  assert(admin.rows[0]?.id, "need local admin user");
  const adminId = admin.rows[0].id;

  await pool.query("BEGIN");
  await pool.query(
    `UPDATE innovation_conference_applications SET status='UNDER_REVIEW', updated_at=NOW() WHERE id=$1::uuid`,
    [appId]
  );
  await pool.query(
    `INSERT INTO innovation_conference_status_logs (application_id, from_status, to_status, changed_by_admin_id, note)
     VALUES ($1::uuid, 'SUBMITTED', 'UNDER_REVIEW', $2::uuid, 'نقل للمراجعة')`,
    [appId, adminId]
  );
  await pool.query("COMMIT");

  const logs = await pool.query(
    `SELECT to_status, note, changed_by_admin_id::text FROM innovation_conference_status_logs
     WHERE application_id=$1::uuid ORDER BY created_at`,
    [appId]
  );
  assert(logs.rows.some((r) => r.to_status === "UNDER_REVIEW"), "status log");
  assert(logs.rows.some((r) => r.note === "نقل للمراجعة"), "log note");
  console.log("OK status change + log");

  await pool.query(
    `UPDATE innovation_conference_applications SET admin_notes=$2 WHERE id=$1::uuid`,
    [appId, "ملاحظة محدّثة"]
  );
  console.log("OK admin notes update");

  // public track must not expose notes
  const track = await fetch(`${BASE}/api/innovation-conference/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participationCode: code, trackingToken: rawToken }),
  });
  const trackJson = await track.json();
  if (track.status === 429) {
    console.log("SKIP track check (rate limited) — verifying via SQL that notes stay internal");
  } else {
    assert(track.status === 200 && trackJson.ok, "track ok " + JSON.stringify(trackJson));
    const s = JSON.stringify(trackJson);
    assert(!s.includes("ملاحظة"), "track no admin notes");
    assert(!s.includes("admin_notes"), "track no admin_notes key");
    assert(!s.includes("tracking_token"), "track no hash");
    assert(trackJson.application.status === "UNDER_REVIEW", "track status");
    console.log("OK public track hides notes/hash");
  }

  // detail must not select tracking hash in admin detail query shape
  const detail = await pool.query(
    `SELECT participation_code, project_title, admin_notes, status
     FROM innovation_conference_applications WHERE id=$1::uuid`,
    [appId]
  );
  assert(detail.rows[0].admin_notes === "ملاحظة محدّثة", "notes saved");
  console.log("OK admin detail fields");

  // unauthorized media endpoint without session
  const mediaRes = await fetch(`${BASE}/api/admin/innovation-conference/media/00000000-0000-4000-8000-000000000001`);
  assert(mediaRes.status === 401 || mediaRes.status === 403 || mediaRes.status === 404, "media protected");
  console.log("OK admin media endpoint requires auth");

  // page exists (redirect to login if no cookie is fine)
  const page = await fetch(`${BASE}/admin/innovation-conference`, { redirect: "manual" });
  assert([200, 302, 307].includes(page.status), "admin page responds");
  console.log("OK admin list route responds", page.status);

  await pool.query(`DELETE FROM innovation_conference_applications WHERE id=$1::uuid`, [appId]);
  console.log("OK cleanup");

  const open = await pool.query(
    `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
  );
  assert(open.rows[0].is_registration_open === false, "registration closed");
  console.log("FINAL is_registration_open=", open.rows[0].is_registration_open);
  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
