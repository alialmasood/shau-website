/**
 * تحويل عناصر lectures_tables و exams_tables من الشكل القديم (image_id) إلى الجديد (pdf_id, image_ids).
 * يُشغّل مرة واحدة بعد تطبيق دعم PDF والصور المتعددة.
 * الاستخدام: node scripts/backfill-programs-tables-json.js
 */
require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5442"),
      database: process.env.DB_NAME || "shau_website_db",
      user: process.env.DB_USER || "shau_admin",
      password: process.env.DB_PASSWORD || "SHsh321321",
    });

function normalize(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => {
    if (!x || typeof x !== "object") return null;
    const imageIds = Array.isArray(x.image_ids)
      ? x.image_ids.filter((id) => typeof id === "string")
      : typeof x.image_id === "string"
        ? [x.image_id]
        : [];
    return {
      stage: [1, 2, 3, 4].includes(Number(x.stage)) ? Number(x.stage) : 1,
      shift: x.shift === "evening" ? "evening" : "morning",
      pdf_id: typeof x.pdf_id === "string" ? x.pdf_id : null,
      image_ids: imageIds,
      html_ar: typeof x.html_ar === "string" ? x.html_ar : null,
      html_en: typeof x.html_en === "string" ? x.html_en : null,
    };
  }).filter(Boolean);
}

async function run() {
  const { rows } = await pool.query(`SELECT id, lectures_tables, exams_tables FROM programs`);
  let n = 0;
  for (const r of rows) {
    const lt = normalize(r.lectures_tables || []);
    const et = normalize(r.exams_tables || []);
    await pool.query(
      `UPDATE programs SET lectures_tables = $1::jsonb, exams_tables = $2::jsonb WHERE id = $3`,
      [JSON.stringify(lt), JSON.stringify(et), r.id]
    );
    n++;
  }
  console.log("تم تحديث " + n + " برنامج.");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
