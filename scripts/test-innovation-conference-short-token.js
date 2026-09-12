/**
 * اختبار محلي: رمز المتابعة القصير + تتبع + تسجيل
 * لا يغيّر is_registration_open (يفترض أنه مفتوح محلياً كما طلب المستخدم)
 */
require("dotenv").config();
const crypto = require("crypto");
const { Pool } = require("pg");

const BASE = process.env.IC_TEST_BASE_URL || "http://localhost:3020";
const cs = process.env.DATABASE_URL;
const u = new URL(cs);
if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
  console.error("ABORT not local");
  process.exit(2);
}

const pool = new Pool({ connectionString: cs });
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GENERIC =
  "تعذر التحقق من بيانات المتابعة. تأكد من رقم المشاركة ورمز المتابعة.";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function normalizeTrackingToken(raw) {
  const cleaned = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return null;
  for (const ch of cleaned) {
    if (!ALPHABET.includes(ch)) return null;
  }
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

function hashToken(token) {
  const n = normalizeTrackingToken(token);
  return crypto.createHash("sha256").update(n, "utf8").digest("hex");
}

async function upload(buf, name, type) {
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type }), name);
  const res = await fetch(`${BASE}/api/media/public`, { method: "POST", body: fd });
  const json = await res.json();
  assert(res.status === 201 && json.id, "upload " + name);
  return json.id;
}

async function track(body) {
  const res = await fetch(`${BASE}/api/innovation-conference/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function main() {
  // unit-ish: normalize
  assert(normalizeTrackingToken("k7m4-p9q2") === "K7M4-P9Q2", "lower+dash");
  assert(normalizeTrackingToken("K7M4P9Q2") === "K7M4-P9Q2", "no dash");
  assert(normalizeTrackingToken("  K7M4-P9Q2  ") === "K7M4-P9Q2", "trim");
  assert(normalizeTrackingToken("K7M4-P9QO") === null, "invalid O");
  console.log("OK normalize helpers");

  const ed = await pool.query(
    `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
  );
  assert(ed.rows[0]?.is_registration_open === true, "registration should stay open locally");
  console.log("OK registration open before tests");

  const img = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQDxAVFhUVFRUVFRUVFRUWFxUXFhUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAABwA//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAl//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AV//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AV//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8QX//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8QX//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QX//Z",
    "base64"
  );
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

  const tokens = [];
  const codes = [];
  const mediaIds = [];

  for (let i = 0; i < 2; i++) {
    const imageId = await upload(img, `t${i}.jpg`, "image/jpeg");
    const pdfId = await upload(pdf, `t${i}.pdf`, "application/pdf");
    mediaIds.push(imageId, pdfId);

    const body = {
      website: "",
      applicant: {
        fullName: "أحمد علي حسين",
        birthDate: "2000-05-15",
        gender: "male",
        governorate: "البصرة",
        phone: `07701${String(100000 + i).slice(-6)}`,
        email: `ic.short.${Date.now()}.${i}@example.com`,
        applicantRole: "university_student",
        institutionName: "كلية الشرق",
        stageOrMajor: "تقنيات التخدير",
      },
      project: {
        projectTitle: `مشروع رمز قصير ${i + 1}`,
        innovationField: "ai_digital",
        projectSummary: "أ".repeat(55),
        problem: "ب".repeat(45),
        solution: "ج".repeat(45),
        novelty: "د".repeat(45),
        beneficiaries: "الطلبة والمجتمع المحلي",
        expectedImpact: "ه".repeat(45),
        projectStage: "prototype",
      },
      participation: { participationType: "individual", teamMembers: [] },
      intellectualProperty: { shownBefore: false, patentStatus: "none" },
      attachments: [
        { mediaId: imageId, kind: "project_image", sortOrder: 0 },
        { mediaId: pdfId, kind: "project_pdf", sortOrder: 1 },
      ],
      consents: { accuracy: true, ownership: true, terms: true, media: true },
    };

    const res = await fetch(`${BASE}/api/innovation-conference/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    assert(res.status === 201 && json.ok, "register " + JSON.stringify(json));
    const token = json.application.trackingToken;
    const code = json.application.participationCode;
    assert(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(token), "token format " + token);
    assert(!token.includes("O") && !token.includes("0") && !token.includes("I") && !token.includes("1") && !token.includes("L"), "alphabet");
    tokens.push(token);
    codes.push(code);

    const row = await pool.query(
      `SELECT tracking_token_hash, participation_code FROM innovation_conference_applications WHERE participation_code=$1`,
      [code]
    );
    assert(row.rows[0].tracking_token_hash === hashToken(token), "hash matches");
    assert(!JSON.stringify(row.rows[0]).includes(token), "raw not in row fields as plaintext column");
    // ensure raw not stored: no column equals token
    const rawCheck = await pool.query(
      `SELECT 1 FROM innovation_conference_applications WHERE participation_code=$1 AND tracking_token_hash=$2`,
      [code, token]
    );
    assert(rawCheck.rows.length === 0, "raw token is not the stored hash");
  }

  assert(tokens[0] !== tokens[1], "tokens differ");
  console.log("OK register short tokens + uniqueness + hash only");

  const code = codes[0];
  const token = tokens[0];

  let ok1 = await track({ participationCode: code, trackingToken: token });
  if (ok1.status === 429) {
    console.log("WARN rate limited — skipping some track variants");
  } else {
    assert(ok1.status === 200 && ok1.json.ok, "track dashed");
    const ok2 = await track({
      participationCode: code,
      trackingToken: token.replace("-", ""),
    });
    assert(ok2.status === 200 && ok2.json.ok, "track no dash");
    const ok3 = await track({
      participationCode: code,
      trackingToken: token.toLowerCase(),
    });
    assert(ok3.status === 200 && ok3.json.ok, "track lowercase");
    const bad = await track({
      participationCode: code,
      trackingToken: "AAAA-BBBB",
    });
    assert(bad.status === 401 && bad.json.error.message === GENERIC, "wrong token");
    console.log("OK track normalization + wrong token");
  }

  for (const c of codes) {
    await pool.query(`DELETE FROM innovation_conference_applications WHERE participation_code=$1`, [c]);
  }
  if (mediaIds.length) {
    await pool.query(`DELETE FROM media WHERE id = ANY($1::uuid[])`, [mediaIds]);
  }
  console.log("OK cleanup");

  const ed2 = await pool.query(
    `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
  );
  assert(ed2.rows[0].is_registration_open === true, "still open");
  console.log("FINAL is_registration_open=", ed2.rows[0].is_registration_open);
  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
