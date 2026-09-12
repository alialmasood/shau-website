/**
 * تحقق محلي آمن بعد هجرة مؤتمر الابتكار.
 * لا يطبع كلمات مرور.
 */
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const cs = process.env.DATABASE_URL;
if (!cs) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const u = new URL(cs);
console.log(`TARGET host=${u.hostname} port=${u.port || "5432"} db=${u.pathname.replace(/^\//, "")}`);
if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
  console.error("ABORT: not a local database host");
  process.exit(2);
}

const pool = new Pool({
  connectionString: cs,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  const seed = fs.readFileSync(
    path.join(__dirname, "seed-innovation-conference-edition.sql"),
    "utf8"
  );
  await pool.query(seed);
  console.log("SEED: OK");

  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'innovation_conference_%'
    ORDER BY table_name`);
  console.log("TABLES:");
  for (const r of tables.rows) console.log(" - " + r.table_name);

  const edition = await pool.query(`
    SELECT code, title_ar, title_en, event_date::text AS event_date,
           is_registration_open, registration_opens_at, registration_closes_at
    FROM innovation_conference_editions WHERE code='IC-2026'`);
  console.log("EDITION_ROWS=" + edition.rows.length);
  if (edition.rows[0]) console.log(JSON.stringify(edition.rows[0], null, 2));

  const fks = await pool.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name LIKE 'innovation_conference_%'
    ORDER BY tc.table_name, kcu.column_name`);
  console.log("FOREIGN_KEYS=" + fks.rows.length);
  for (const r of fks.rows) {
    console.log(` - ${r.table_name}.${r.column_name} -> ${r.foreign_table}.${r.foreign_column}`);
  }

  const checks = await pool.query(`
    SELECT conrelid::regclass::text AS table_name, conname
    FROM pg_constraint
    WHERE contype='c' AND conrelid::regclass::text LIKE 'innovation_conference_%'
    ORDER BY 1,2`);
  console.log("CHECK_CONSTRAINTS=" + checks.rows.length);
  for (const r of checks.rows) console.log(` - ${r.table_name}: ${r.conname}`);

  const indexes = await pool.query(`
    SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname='public' AND tablename LIKE 'innovation_conference_%'
    ORDER BY tablename, indexname`);
  console.log("INDEXES=" + indexes.rows.length);
  for (const r of indexes.rows) console.log(` - ${r.tablename}: ${r.indexname}`);

  const uniques = await pool.query(`
    SELECT conrelid::regclass::text AS table_name, conname
    FROM pg_constraint
    WHERE contype IN ('u','p') AND conrelid::regclass::text LIKE 'innovation_conference_%'
    ORDER BY 1,2`);
  console.log("PK_UNIQUE=" + uniques.rows.length);
  for (const r of uniques.rows) console.log(` - ${r.table_name}: ${r.conname}`);
}

main()
  .then(() => pool.end())
  .catch(async (e) => {
    console.error(e);
    await pool.end();
    process.exit(1);
  });
