/**
 * استعادة المواد الدراسية للنتائج القديمة من payload_json أو raw_row_json
 * للنتائج التي لها subjects_json فارغ أو فارغة
 *
 * تشغيل: npm run db:backfill-results-subjects
 */
require("dotenv").config();
const { Client } = require("pg");

const FIXED = new Set([
  "student_id", "full_name", "study_type", "stage",
  "المجموع", "المعدل", "التقييم", "النتيجة النهائية", "التقدير", "وحدات", "units",
]);
const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w\u0600-\u06FF_]/g, "");

function isUnitsColumn(name) {
  const s = String(name || "").trim().toLowerCase();
  return s.includes("وحدات") || s.includes("units");
}

function extractSubjects(raw) {
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  for (const [key, value] of Object.entries(raw)) {
    const k = String(key).trim();
    if (!k || /^\d+$/.test(k)) continue;
    if (FIXED.has(k) || FIXED.has(norm(k))) continue;
    if (isUnitsColumn(k)) continue;
    const trimmed = value === null || value === undefined ? "" : String(value).trim();
    const num = Number(trimmed);
    const score = !trimmed || isNaN(num) || num < 0 ? 0 : num;
    out.push({ name: k, score });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // نتائج تحتاج إصلاح: إما subjects فارغة، أو كل المواد غير صالحة (مثل عدد الوحدات فقط)
    const res = await client.query(`
      SELECT id, student_id, subjects_json, raw_row_json, payload_json
      FROM results
      WHERE (payload_json IS NOT NULL AND payload_json != '{}'::jsonb)
        AND (
          subjects_json IS NULL
          OR subjects_json = '[]'::jsonb
          OR jsonb_array_length(COALESCE(subjects_json,'[]'::jsonb)) = 0
          OR (
            SELECT bool_and(elem->>'name' IS NOT NULL AND (elem->>'name' LIKE '%وحدات%' OR elem->>'name' LIKE '%units%'))
            FROM jsonb_array_elements(COALESCE(subjects_json,'[]'::jsonb)) elem
          )
        )
    `);
    console.log(`📋 Found ${res.rows.length} results with empty subjects`);
    let updated = 0;
    for (const row of res.rows) {
      const raw = row.raw_row_json || row.payload_json;
      const subjects = extractSubjects(raw);
      if (subjects.length === 0) {
        const subjKeys = raw ? Object.keys(raw).filter((k) => !FIXED.has(k) && !norm(k).includes("وحدات")) : [];
        const sample = subjKeys[0];
        const sampleVal = sample ? raw[sample] : null;
        console.log(`  ⚠️ ${row.student_id}: 0 subjects, sample "${sample}" = ${JSON.stringify(sampleVal)}`);
        continue;
      }
      await client.query(
        `UPDATE results SET subjects_json = $1::jsonb WHERE id = $2`,
        [JSON.stringify(subjects.map((s) => ({ name: s.name, score: s.score, grade: "" }))), row.id]
      );
      updated++;
      console.log(`  ✅ ${row.student_id}: ${subjects.length} subjects`);
    }
    console.log(`\n✅ Updated ${updated} results`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
