---
name: Mentra libSQL/Prisma build fixes
description: Root causes for Mentra's Vercel/Next.js build failures with @prisma/adapter-libsql on SQLite
---

Three independent issues caused the Next.js build to fail when using Prisma + libSQL/Turso with a `sqlite` datasource provider:

1. **Adapter/client major-version mismatch**: `@prisma/adapter-libsql` must match `@prisma/client`'s major version exactly (both on 6.x here). If adapter drifts ahead (e.g. package.json pins it to `^7.x` while client is `^6`), its API changes silently — `new PrismaLibSQL(client)` becomes `new PrismaLibSQL(config)` (takes a `{url, authToken}` config object directly, not a `@libsql/client` `Client` instance) and other exports can break.
   **Why:** semver ranges on adapter packages don't protect against this since they publish independently of the client.
   **How to apply:** pin `@prisma/adapter-libsql` to the exact same version as `@prisma/client`, and remove any manual `createClient()` call — pass the connection config straight into `PrismaLibSQL`.

2. **SQLite Prisma queries don't support `mode: "insensitive"`** — that filter option only exists for Postgres/MySQL string filters. Using it anywhere in `where` clauses is a TypeScript compile error against a `sqlite` datasource. SQLite's `contains`/`LIKE` is already case-insensitive for ASCII, so just drop the `mode` field.

3. **libSQL native client breaks webpack bundling** — `@libsql/client`'s dynamic `require` of its own directory pulls in non-JS files (README, LICENSE) that webpack tries to parse as modules. Fix by adding `@libsql/client`, `@prisma/adapter-libsql`, and `libsql` to both `experimental.serverComponentsExternalPackages` and the server `config.externals` in `next.config.mjs`.

Also: when a repo has both `package-lock.json` and `pnpm-lock.yaml` but deploys via pnpm (Vercel), any `package.json` dependency edit must be followed by regenerating `pnpm-lock.yaml` (`pnpm install --no-frozen-lockfile`) or the Vercel build fails immediately with `ERR_PNPM_OUTDATED_LOCKFILE`.
