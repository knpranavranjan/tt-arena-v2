# Database (Neon now → AWS RDS/Aurora later)

The app started fully client-side (localStorage + in-memory mock data). This adds
a real Postgres database for the **user-generated** data. The seed catalogue
(`src/lib/mock-data.ts`) and the live match-console engine state stay as they were.

## Layout

```
src/lib/db/schema.ts        all tables (Drizzle)
src/lib/db/client.ts        getDb() — the ONE place the DB engine is chosen
src/lib/db/queries/*.ts     typed query helpers per domain
src/lib/db/seed.ts          seedDatabase(db, {reset})
src/lib/db/seed-data.ts     plain seed rows (accounts / plans / fees)
src/app/api/**/route.ts     Route Handlers the client stores call
drizzle.config.ts           drizzle-kit config (loads .env.local)
scripts/seed.ts             `npm run db:seed`
```

Data flow: **UI → context store (`src/lib/*.tsx`, unchanged public API) →
`fetch('/api/…')` → Route Handler → `src/lib/db/queries/*` → `getDb()`**.

## First-time setup

1. Create a Neon project. Copy the **Pooled connection** URI (host ends in
   `-pooler.…neon.tech`, and the string ends with `?sslmode=require`).
2. `cp .env.example .env.local` and set:
   - `DATABASE_URL=` the pooled URI
   - `DB_DRIVER=neon`
   - `NEXT_PUBLIC_DATA_BACKEND=db`
   - `DEV_SEED_TOKEN=` any random string
3. Create the tables: `npm run db:push`
4. Seed the built-in accounts / plans / fees: `npm run db:seed`
5. `npm run dev`, then check `curl http://localhost:3000/api/health` → `{"ok":true,"driver":"neon",...}`

`npm run db:seed` wipes every migrated table then re-seeds. `npm run db:seed -- --keep`
tops up the seed rows without wiping. `POST /api/dev/reset` (header
`x-seed-token: $DEV_SEED_TOKEN`) does the same wipe+seed while the server runs.

## Turning the database off

Unset `NEXT_PUBLIC_DATA_BACKEND` (or set it to anything other than `db`). Every
store reverts to its original localStorage behaviour and no database is needed.
Nothing else changes.

## Moving to AWS RDS / Aurora (later)

Both are Postgres, so there is no code change:

1. `DB_DRIVER=pg`
2. `DATABASE_URL=` the RDS/Aurora connection string (add `PGSSLMODE=require` env if the instance enforces TLS)
3. `npm run db:push` then `npm run db:seed` against the new instance

`src/lib/db/client.ts` is the only file that knows which driver is in use.

## Migrations

`db:push` diffs the schema straight onto the database — fine for testing. For
tracked migrations use `npm run db:generate` (writes SQL to `./drizzle`) then
`npm run db:migrate`.
