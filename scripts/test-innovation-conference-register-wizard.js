/**
 * تحقق محلي لصفحة/API تسجيل المؤتمر + فتح مؤقت للتسجيل ثم إغلاقه.
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
if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
  console.error("ABORT: not local DB");
  process.exit(2);
}

const pool = new Pool({ connectionString: cs });

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function setOpen(open) {
  await pool.query(
    `UPDATE innovation_conference_editions SET is_registration_open=$1, updated_at=NOW() WHERE code='IC-2026'`,
    [open]
  );
}

async function main() {
  console.log("BASE", BASE);

  await setOpen(false);
  const statusClosed = await fetch(`${BASE}/api/innovation-conference/registration-status`);
  const statusClosedJson = await statusClosed.json();
  assert(statusClosed.ok, "status endpoint");
  assert(statusClosedJson.open === false, "expected closed");
  console.log("OK status closed");

  const pageClosed = await fetch(`${BASE}/ar/innovation-conference/register`);
  const htmlClosed = await pageClosed.text();
  assert(pageClosed.ok, "register page loads");
  assert(htmlClosed.includes("التسجيل لم يُفتح بعد") || htmlClosed.includes("RegisterWizard"), "closed UI or wizard shell");
  console.log("OK register page (closed mode markup present or hydrates)");

  // client validation smoke via dynamic import of compiled paths won't work easily;
  // instead exercise API open path for wizard payload shape.

  await setOpen(true);
  const statusOpen = await fetch(`${BASE}/api/innovation-conference/registration-status`);
  const statusOpenJson = await statusOpen.json();
  assert(statusOpenJson.open === true, "expected open after toggle");
  console.log("OK status open (temp)");

  const img = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQDxAVFhUVFRUVFRUVFRUWFxUXFhUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLSUtLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAABwA//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAl//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AV//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AV//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8QX//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8QX//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8QX//Z",
    "base64"
  );
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

  async function upload(buf, name, type) {
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type }), name);
    const res = await fetch(`${BASE}/api/media/public`, { method: "POST", body: fd });
    const json = await res.json();
    assert(res.status === 201 && json.id, "upload " + name);
    return json.id;
  }

  const imageId = await upload(img, "wizard-test.jpg", "image/jpeg");
  const pdfId = await upload(pdf, "wizard-test.pdf", "application/pdf");
  console.log("OK media upload (image + pdf)");

  const body = {
    website: "",
    applicant: {
      fullName: "أحمد علي حسين",
      birthDate: "2000-05-15",
      gender: "male",
      governorate: "البصرة",
      phone: "07709998877",
      email: `ic.wizard.${Date.now()}@example.com`,
      applicantRole: "university_student",
      institutionName: "كلية الشرق",
      stageOrMajor: "تقنيات التخدير",
    },
    project: {
      projectTitle: "مشروع اختبار واجهة التسجيل",
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

  const bad = await fetch(`${BASE}/api/innovation-conference/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, applicant: { ...body.applicant, phone: "12" } }),
  });
  const badJson = await bad.json();
  assert(bad.status === 400, "validation still works");
  assert(badJson.error?.code === "VALIDATION_ERROR", "validation code");
  console.log("OK wizard-shaped validation error");

  const ok = await fetch(`${BASE}/api/innovation-conference/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const okJson = await ok.json();
  assert(ok.status === 201 && okJson.ok, "submit success " + JSON.stringify(okJson));
  const code = okJson.application.participationCode;
  assert(code?.startsWith("IC26-"), "participation code");
  assert(typeof okJson.application.trackingToken === "string", "token once");
  console.log("OK wizard-shaped submit success (token not logged)");

  await pool.query(`DELETE FROM innovation_conference_applications WHERE participation_code=$1`, [
    code,
  ]);
  await pool.query(`DELETE FROM media WHERE id = ANY($1::uuid[])`, [[imageId, pdfId]]);
  console.log("OK cleanup");

  await setOpen(false);
  const final = await pool.query(
    `SELECT is_registration_open FROM innovation_conference_editions WHERE code='IC-2026'`
  );
  assert(final.rows[0].is_registration_open === false, "must close again");
  console.log("FINAL is_registration_open=", final.rows[0].is_registration_open);
  console.log("ALL CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
