/**
 * اختبار محلي آمن لـ POST /api/innovation-conference/register
 * - يتأكد أن الهدف localhost
 * - يختبر التسجيل المغلق
 * - يفتح التسجيل مؤقتاً للاختبارات ثم يعيده false
 * - ينظف بيانات الاختبار
 */
require("dotenv").config();
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function post(body) {
  const res = await fetch(`${BASE}/api/innovation-conference/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function basePayload(overrides = {}) {
  const applicant = {
    fullName: "أحمد علي حسين",
    birthDate: "2000-05-15",
    gender: "male",
    governorate: "البصرة",
    phone: "07701234567",
    email: `ic.test.${Date.now()}@example.com`,
    applicantRole: "university_student",
    institutionName: "كلية الشرق",
    stageOrMajor: "تقنيات التخدير",
    ...(overrides.applicant || {}),
  };
  const project = {
    projectTitle: "مشروع اختبار الابتكار المحلي",
    innovationField: "ai_digital",
    projectSummary: "أ".repeat(55),
    problem: "ب".repeat(45),
    solution: "ج".repeat(45),
    novelty: "د".repeat(45),
    beneficiaries: "الطلبة والمجتمع المحلي",
    expectedImpact: "ه".repeat(45),
    projectStage: "prototype",
    ...(overrides.project || {}),
  };
  return {
    applicant,
    project,
    participation: {
      participationType: "individual",
      teamMembers: [],
      ...(overrides.participation || {}),
    },
    intellectualProperty: {
      shownBefore: false,
      patentStatus: "none",
      ...(overrides.intellectualProperty || {}),
    },
    attachments: overrides.attachments || [],
    consents: {
      accuracy: true,
      ownership: true,
      terms: true,
      media: true,
      ...(overrides.consents || {}),
    },
    website: overrides.website || "",
  };
}

async function insertTestMedia() {
  const img = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQDxAVFhUVFRUVFRUVFRUWFxUXFhUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAABwA//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAl//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AV//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AV//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8QX//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8QX//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QX//Z",
    "base64"
  );
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
  const imgRes = await pool.query(
    `INSERT INTO media (filename, mime_type, size, data) VALUES ($1,$2,$3,$4) RETURNING id::text`,
    ["test-ic.jpg", "image/jpeg", img.length, img]
  );
  const pdfRes = await pool.query(
    `INSERT INTO media (filename, mime_type, size, data) VALUES ($1,$2,$3,$4) RETURNING id::text`,
    ["test-ic.pdf", "application/pdf", pdf.length, pdf]
  );
  return { imageId: imgRes.rows[0].id, pdfId: pdfRes.rows[0].id };
}

async function setRegistrationOpen(open) {
  await pool.query(
    `UPDATE innovation_conference_editions SET is_registration_open=$1, updated_at=NOW() WHERE code='IC-2026'`,
    [open]
  );
}

async function cleanup(mediaIds, participationCode) {
  if (participationCode) {
    await pool.query(
      `DELETE FROM innovation_conference_applications WHERE participation_code=$1`,
      [participationCode]
    );
  }
  if (mediaIds?.length) {
    await pool.query(`DELETE FROM media WHERE id = ANY($1::uuid[])`, [mediaIds]);
  }
}

async function main() {
  console.log("BASE", BASE);

  // 1) closed
  await setRegistrationOpen(false);
  const closed = await post(basePayload());
  assert(closed.status === 403, "expected 403 when closed, got " + closed.status);
  assert(closed.json?.error?.code === "REGISTRATION_CLOSED", "expected REGISTRATION_CLOSED");
  console.log("OK closed registration");

  // open temporarily
  await setRegistrationOpen(true);
  const { imageId, pdfId } = await insertTestMedia();
  const mediaIds = [imageId, pdfId];
  let createdCode = null;

  try {
    // 2) validation phone
    const badPhone = await post(
      basePayload({
        applicant: { phone: "123" },
        attachments: [
          { mediaId: imageId, kind: "project_image" },
          { mediaId: pdfId, kind: "project_pdf" },
        ],
      })
    );
    assert(badPhone.status === 400, "bad phone status");
    assert(badPhone.json?.error?.code === "VALIDATION_ERROR", "bad phone code");
    console.log("OK validation phone");

    // 3) honeypot
    const hp = await post(
      basePayload({
        website: "http://spam.test",
        attachments: [
          { mediaId: imageId, kind: "project_image" },
          { mediaId: pdfId, kind: "project_pdf" },
        ],
      })
    );
    assert(hp.status === 400, "honeypot status");
    console.log("OK honeypot");

    // 4) invalid media id
    const badMedia = await post(
      basePayload({
        attachments: [
          { mediaId: "00000000-0000-4000-8000-000000000000", kind: "project_image" },
          { mediaId: pdfId, kind: "project_pdf" },
        ],
      })
    );
    assert(badMedia.status === 400, "bad media status");
    assert(badMedia.json?.error?.code === "INVALID_ATTACHMENTS", "bad media code");
    console.log("OK invalid attachments");

    // 5) patent conditional
    const patentMissing = await post(
      basePayload({
        intellectualProperty: { shownBefore: false, patentStatus: "registered" },
        attachments: [
          { mediaId: imageId, kind: "project_image" },
          { mediaId: pdfId, kind: "project_pdf" },
        ],
      })
    );
    assert(patentMissing.status === 400, "patent missing status");
    console.log("OK patent conditional");

    // 6) team duplicate phone
    const dupTeam = await post(
      basePayload({
        participation: {
          participationType: "team",
          teamMembers: [
            {
              fullName: "محمد جاسم علي",
              phone: "07701234567",
            },
          ],
        },
        attachments: [
          { mediaId: imageId, kind: "project_image" },
          { mediaId: pdfId, kind: "project_pdf" },
        ],
      })
    );
    assert(dupTeam.status === 400, "dup team status got " + dupTeam.status);
    assert(dupTeam.json?.error?.code === "VALIDATION_ERROR", "dup team code");
    console.log("OK duplicate team contact");

    // 7) success individual
    const okInd = await post(
      basePayload({
        attachments: [
          { mediaId: imageId, kind: "project_image", sortOrder: 0 },
          { mediaId: pdfId, kind: "project_pdf", sortOrder: 1 },
        ],
      })
    );
    assert(okInd.status === 201, "success status got " + okInd.status + " " + JSON.stringify(okInd.json));
    assert(okInd.json?.ok === true, "success ok");
    assert(okInd.json?.application?.participationCode?.startsWith("IC26-"), "code format");
    assert(typeof okInd.json?.application?.trackingToken === "string", "token present");
    assert(okInd.json?.application?.status === "SUBMITTED", "status");
    createdCode = okInd.json.application.participationCode;
    console.log("OK successful individual submit (token not logged)");

    await cleanup(null, createdCode);
    createdCode = null;

    // 8) success team (وسائط جديدة لأن السابقة قد تُحذف لاحقاً)
    const teamMedia = await insertTestMedia();
    mediaIds.push(teamMedia.imageId, teamMedia.pdfId);
    const okTeam = await post(
      basePayload({
        applicant: {
          phone: "07801234567",
          email: `ic.team.${Date.now()}@example.com`,
        },
        participation: {
          participationType: "team",
          teamMembers: [
            {
              fullName: "سارة محمود كريم",
              roleInTeam: "باحثة",
              phone: "07901234567",
              email: `ic.member.${Date.now()}@example.com`,
            },
          ],
        },
        attachments: [
          { mediaId: teamMedia.imageId, kind: "project_image", sortOrder: 0 },
          { mediaId: teamMedia.pdfId, kind: "project_pdf", sortOrder: 1 },
        ],
      })
    );
    assert(okTeam.status === 201, "team success status got " + okTeam.status + " " + JSON.stringify(okTeam.json));
    createdCode = okTeam.json.application.participationCode;
    console.log("OK successful team submit (token not logged)");

    await cleanup(null, createdCode);
    createdCode = null;
  } finally {
    await setRegistrationOpen(false);
    await cleanup(mediaIds, createdCode);
    const ed = await pool.query(
      `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
    );
    console.log("FINAL is_registration_open=", ed.rows[0]?.is_registration_open);
  }

  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
