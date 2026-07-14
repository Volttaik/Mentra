---
name: Mentra Turso/libSQL Prisma setup
description: How Prisma is wired to Turso (libSQL) in this project — schema, runtime adapter, secret names, and schema push process.
---

# Mentra → Turso (libSQL) Prisma Setup

## Schema config
- `provider = "sqlite"` with `url = "file:./prisma/dev.db"` (placeholder for Prisma CLI)
- Do NOT use `libsql://` as the schema URL — Prisma CLI rejects it; only the runtime adapter uses it
- No `previewFeatures = ["driverAdapters"]` needed in Prisma 6 (it's GA)

## Runtime client (src/lib/prisma.ts)
- Uses `@prisma/adapter-libsql` + `@libsql/client`
- Reads `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` secrets (strip quotes: `.replace(/['"]/g, "").trim()`)
- Env vars were saved by user with surrounding quotes — always strip them

## Secret names
- `TURSO_DATABASE_URL` — format: `libsql://...turso.io`
- `TURSO_AUTH_TOKEN` — JWT token
- `DATABASE_URL` is Replit-managed and must NOT be set manually

## Pushing schema to Turso
- Generate SQL: `cd mantra && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/schema.sql`
- Push via script: `node scripts/push-to-turso.mjs`
- Script is at `mantra/scripts/push-to-turso.mjs` — handles wiping old tables and pushing new schema
- Turso may have pre-existing tables from other projects; the script does a multi-pass drop with FK OFF

**Why:** Prisma's sqlite provider requires a `file:` URL for CLI operations; actual Turso connection happens only at runtime via the adapter.

## Article tags workaround
- `Article.tags` was `String[]` (unsupported in SQLite) → changed to `String @default("[]")`
- Serialize: `JSON.stringify(tags)` before writing; parse: `JSON.parse(tags || "[]")` before returning in API routes
- Affected files: `mantra/src/app/api/articles/route.ts`, `mantra/src/app/api/articles/[slug]/route.ts`

## pnpm lockfile
- Project uses both npm (local) and pnpm (Vercel CI)
- After `npm install` of new packages, must also run `cd mantra && pnpm install` to update `pnpm-lock.yaml`
- Vercel uses frozen-lockfile in CI — mismatch = build failure
