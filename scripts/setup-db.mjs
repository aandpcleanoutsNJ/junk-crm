#!/usr/bin/env node
// Creates the `jobs` and `job_photos` tables in Neon. Safe to run more than
// once (uses IF NOT EXISTS everywhere).
//
// How to run it:
//   1. Connect Neon to this project in Vercel (Storage -> Marketplace ->
//      Neon), then pull the env vars it created down to your machine:
//        vercel env pull .env.local
//   2. Run:
//        node scripts/setup-db.mjs
//
// (If you don't have the Vercel CLI, you can instead copy DATABASE_URL from
// Vercel's Environment Variables page into a .env.local file yourself.)

import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Run `vercel env pull .env.local` first (after connecting Neon in Vercel),\n" +
      "or create a .env.local file here with DATABASE_URL=... in it."
  );
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Creating jobs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_street TEXT NOT NULL DEFAULT '',
      customer_city TEXT NOT NULL DEFAULT '',
      customer_state TEXT NOT NULL DEFAULT '',
      customer_zip TEXT NOT NULL DEFAULT '',
      job_different_address BOOLEAN NOT NULL DEFAULT FALSE,
      job_street TEXT NOT NULL DEFAULT '',
      job_city TEXT NOT NULL DEFAULT '',
      job_state TEXT NOT NULL DEFAULT '',
      job_zip TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      job_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
      paid BOOLEAN NOT NULL DEFAULT FALSE,
      paid_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'open',
      scheduled_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  // Upgrade path for databases created before scheduling existed.
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_date DATE;`;

  console.log("Creating job_photos table...");
  await sql`
    CREATE TABLE IF NOT EXISTS job_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  // Upgrade path for databases created before before/after photos existed.
  await sql`ALTER TABLE job_photos ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'general';`;

  console.log("Creating indexes...");
  await sql`CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS jobs_scheduled_date_idx ON jobs (scheduled_date);`;
  await sql`CREATE INDEX IF NOT EXISTS job_photos_job_id_idx ON job_photos (job_id);`;

  console.log("Done! Tables are ready.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
