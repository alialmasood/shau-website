/**
 * اختبار محلي لـ POST /api/innovation-conference/track
 * - لا يفتح التسجيل
 * - ينشئ application اختبار مباشرة ثم ينظفه
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
console.log(`DB host=${u.hostname} port=${u.port || "5432"} db=${u.pathname.replace(/^\//, "")}`);
if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
  console.error("ABORT: not local DB");
  process.exit(2);
}

const pool = new Pool({ connectionString: cs });
const GENERIC =
  "تعذر التحقق من بيانات المتابعة. تأكد من رقم المشاركة ورمز المتابعة.";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token), "utf8").digest("hex");
}

async function track(body) {
  const res = await fetch(`${BASE}/api/innovation-conference/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const STATUS_TITLES = {
  SUBMITTED: "تم استلام طلبك",
  UNDER_REVIEW: "الطلب قيد المراجعة الأولية",
  NEEDS_INFO: "مطلوب استكمال معلومات",
  SCIENTIFIC_REVIEW: "قيد التقييم العلمي",
  ACCEPTED: "مقبول للمشاركة",
  REJECTED: "اكتملت مراجعة الطلب",
  FINALIST: "متأهل للمرحلة النهائية",
  WINNER: "مشروع فائز",
  WITHDRAWN: "تم سحب الطلب",
};

async function main() {
  console.log("BASE", BASE);

  // helper mapping fixture (بدون استنزاف rate limit)
  for (const [status, title] of Object.entries(STATUS_TITLES)) {
    assert(typeof title === "string" && title.length > 3, `fixture ${status}`);
  }
  assert(Object.keys(STATUS_TITLES).length === 9, "9 statuses");
  console.log("OK status mapping fixture (9 statuses)");

  const ed = await pool.query(
    `SELECT id FROM innovation_conference_editions WHERE code='IC-2026' LIMIT 1`
  );
  assert(ed.rows[0]?.id, "edition exists");
  const editionId = ed.rows[0].id;

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const code = "IC26-88001122";

  await pool.query(`DELETE FROM innovation_conference_applications WHERE participation_code=$1`, [
    code,
  ]);

  await pool.query(
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
      'اختبار متابعة', '2000-01-01', 'البصرة', '07701112233', 'ic.track.test@example.com', 'graduate',
      'مشروع اختبار المتابعة', 'ai_digital', $4, $5, $6, $7,
      'فئة مستفيدة', $8, 'individual', 'prototype',
      false, 'none',
      true, true, true, true, NOW(),
      'SUBMITTED', NOW(), 'ملاحظة إدارية سرية يجب ألا تظهر'
    )`,
    [
      editionId,
      code,
      tokenHash,
      "س".repeat(55),
      "م".repeat(45),
      "ح".repeat(45),
      "ج".repeat(45),
      "أ".repeat(45),
    ]
  );
  console.log("OK inserted test application");

  // correct token first (before burning rate limit)
  const ok = await track({
    participationCode: `  ${code.toLowerCase()}  `,
    trackingToken: ` ${rawToken} `,
  });
  assert(ok.status === 200 && ok.json?.ok === true, "correct token " + JSON.stringify(ok.json));
  const app = ok.json.application;
  assert(app.participationCode === code, "code normalized");
  assert(app.projectTitle === "مشروع اختبار المتابعة", "title");
  assert(app.status === "SUBMITTED", "status");
  assert(app.statusTitle === STATUS_TITLES.SUBMITTED, "status title");
  assert(typeof app.statusMessage === "string" && app.statusMessage.length > 10, "message");
  assert(app.submittedAt && app.updatedAt, "dates");
  const payload = JSON.stringify(ok.json);
  assert(!payload.includes("admin_notes"), "no admin_notes");
  assert(!payload.includes("ملاحظة إدارية"), "no admin note text");
  assert(!payload.includes("trackingTokenHash") && !payload.includes("tracking_token"), "no hash");
  assert(!payload.includes("07701112233"), "no phone");
  assert(!payload.includes("ic.track.test@example.com"), "no email");
  assert(!payload.includes(rawToken), "raw token not in response");
  console.log("OK correct token + no sensitive leak");

  // sample status via API (REJECTED + WINNER)
  await pool.query(
    `UPDATE innovation_conference_applications SET status='REJECTED', updated_at=NOW() WHERE participation_code=$1`,
    [code]
  );
  const rejected = await track({ participationCode: code, trackingToken: rawToken });
  assert(rejected.status === 200, "rejected http");
  assert(rejected.json.application.statusTitle === STATUS_TITLES.REJECTED, "rejected title");
  assert(!JSON.stringify(rejected.json).includes("ملاحظة إدارية"), "no admin on rejected");

  await pool.query(
    `UPDATE innovation_conference_applications SET status='WINNER', updated_at=NOW() WHERE participation_code=$1`,
    [code]
  );
  const winner = await track({ participationCode: code, trackingToken: rawToken });
  assert(winner.status === 200, "winner http");
  assert(winner.json.application.statusTitle === STATUS_TITLES.WINNER, "winner title");
  console.log("OK API status samples (REJECTED, WINNER)");

  // invalid format / missing / wrong — same generic message
  const badFmt = await track({
    participationCode: "BAD-CODE",
    trackingToken: "a".repeat(32),
  });
  assert(badFmt.status === 401, "invalid format status");
  assert(badFmt.json?.error?.message === GENERIC, "invalid format message");
  console.log("OK invalid participation format");

  const missing = await track({
    participationCode: "IC26-00000999",
    trackingToken: "a".repeat(32),
  });
  assert(missing.status === 401, "missing status");
  assert(missing.json?.error?.message === GENERIC, "missing message");
  console.log("OK nonexistent participation code");

  const wrong = await track({
    participationCode: code,
    trackingToken: "b".repeat(40),
  });
  assert(wrong.status === 401, "wrong token status");
  assert(wrong.json?.error?.message === GENERIC, "wrong token message");
  assert(wrong.json?.error?.code === missing.json?.error?.code, "same error code");
  assert(wrong.json?.error?.message === missing.json?.error?.message, "same message");
  console.log("OK wrong token (same generic response as nonexistent)");

  // burn remaining track attempts for rate limit
  let limited = false;
  for (let i = 0; i < 20; i++) {
    const r = await track({
      participationCode: "IC26-00000111",
      trackingToken: `x${i}`.padEnd(32, "z"),
    });
    if (r.status === 429) {
      limited = true;
      assert(
        r.json?.error?.message ===
          "تم إجراء عدد كبير من محاولات التحقق. حاول مرة أخرى لاحقاً.",
        "rate limit message"
      );
      break;
    }
  }
  assert(limited, "expected rate limit on track");
  console.log("OK track rate limit");

  await pool.query(`DELETE FROM innovation_conference_applications WHERE participation_code=$1`, [
    code,
  ]);
  console.log("OK cleanup");

  const edOpen = await pool.query(
    `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
  );
  console.log("is_registration_open=", edOpen.rows[0]?.is_registration_open);
  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
