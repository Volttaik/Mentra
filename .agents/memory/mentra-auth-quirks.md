---
name: Mentra auth quirks
description: NextAuth v5 setup gotchas and duplicate file pitfalls in this project
---

# NextAuth v5 Auth Quirks

## Duplicate auth.ts (now deleted)
There was a stale `mantra/auth.ts` at the project root AND the real one at `mantra/src/auth.ts`. TypeScript's `**/*.ts` glob picked up BOTH, causing persistent type errors that showed old code even after edits. The root file was deleted — only `src/auth.ts` should exist.

**Why:** Next.js/next-auth v5 supports auth.ts at root OR src/; having both causes shadowing and confusing TS errors.

**How to apply:** If TS errors in auth.ts show code that doesn't match the file content, check for a second auth.ts at `mantra/auth.ts`.

## Type augmentation location
NextAuth type extensions live at `mantra/src/types/next-auth.d.ts`. This extends:
- `Session.user` with `{ id, username, name, email, image? }`
- `User` with `{ username }`
- `JWT` with `{ id, username }`

## JWT stores id, username, role only
The session JWT does NOT persist name, image, or university updates. Stale sessions can show old profile data until the user re-logs in. This is a known limitation, not a bug to silently paper over.

## File uploads
Files land at `public/uploads/[stackId]/[filename]` — local disk only, no CDN. The upload API enforces a MIME type allowlist and blocks dangerous extensions (.html, .svg, .js, .exe, etc.) to prevent stored XSS.
