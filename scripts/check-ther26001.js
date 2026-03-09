require("dotenv").config();
const { Client } = require("pg");
async function run() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("SELECT subjects_json, raw_row_json FROM results WHERE student_id = $1 LIMIT 1", ["ther26001"]);
  const row = r.rows[0];
  if (!row) return console.log("Not found");
  console.log("subjects_json:", JSON.stringify(row.subjects_json?.slice?.(0, 3), null, 2));
  console.log("subjects count:", row.subjects_json?.length);
  await c.end();
}
run();
