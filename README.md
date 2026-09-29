# junk-crm
Junk removaL JOB CONTROL

A simple, mobile-first job tracker for the field crew ("Junk Helpers"). Built
with Next.js (App Router), TypeScript, Tailwind, Neon Postgres, and Vercel Blob.

## First-time setup (after connecting Neon + Blob in Vercel)

1. **Create the database tables.**
   ```
   vercel env pull .env.local
   node scripts/setup-db.mjs
   ```
   This creates the `jobs` and `job_photos` tables. Safe to run again later —
   it won't touch existing data. **Run it again after pulling this update**
   too — it adds the `scheduled_date` and photo `kind` (before/after) columns
   used by the calendar and before/after photo features.

2. **Set the login PIN and session secret** in Vercel's Environment Variables
   (Project Settings -> Environment Variables): `APP_PIN` and `SESSION_SECRET`
   (32+ random characters — e.g. `openssl rand -base64 32`). See
   `.env.example` for the full list of variables the app needs.

## Local development

```
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in real values (or run
`vercel env pull .env.local` after linking the project) to develop against a
real database and photo storage. Without those env vars, the app still runs
and builds — it just shows a "Not connected yet" message instead of the
real data.

## Useful commands

- `npm run dev` — start the local dev server
- `npm run type-check` — TypeScript check
- `npm run lint` — ESLint
- `npm run build` — production build
