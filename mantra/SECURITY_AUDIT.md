# MENTRA — SECURITY AUDIT REPORT

**Date:** May 29, 2026  
**Severity Scale:** CRITICAL > HIGH > MEDIUM > LOW > INFO

---

## EXECUTIVE SUMMARY

The Mentra platform has several security vulnerabilities that must be addressed before any public launch. The most critical issues are: admin panel accessible to any authenticated user, API keys stored in plaintext, no input validation library, and no CSRF/rate limiting protections. The authentication foundation (bcrypt hashing, JWT sessions) is solid, but the authorization layer is largely missing.

**Overall Security Posture:** POOR — Not safe for public launch

---

## FINDING #001 — Admin Panel Accessible to Any User
**Severity: CRITICAL**  
**Location:** `src/middleware.ts`, `src/app/admin/page.tsx`

**Description:**  
The `/admin` route is listed in the `PROTECTED` array, which only checks that a user is authenticated. There is zero role check. Any registered user who navigates to `/admin` has full access to the admin interface.

**Evidence:**
```typescript
// middleware.ts
const PROTECTED = ["/dashboard", "/upload", "/settings", "/admin", "/profile/edit"];

export default auth((req) => {
  if (isProtected && !req.auth) {
    // Only checks: is user logged in?
    // Does NOT check: is user an ADMIN?
  }
```

**Impact:** Any user can view the admin panel, see (mocked) sensitive platform data, and attempt admin actions. When admin APIs are wired to the DB, this becomes a complete privilege escalation attack.

**Remediation:**
```typescript
// middleware.ts
if (pathname.startsWith("/admin")) {
  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  if (req.auth.user.role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
}
```
Also enforce `role === "ADMIN"` in every `/api/admin/*` route handler.

---

## FINDING #002 — API Keys Stored in Plaintext
**Severity: CRITICAL**  
**Location:** `src/app/api/keys/route.ts`, `prisma/schema.prisma`

**Description:**  
API keys are generated and stored verbatim in the `api_keys.key` column. If the database is compromised, all API keys are immediately usable by the attacker.

**Evidence:**
```typescript
// keys/route.ts
const rawKey = `mnt_${crypto.randomBytes(32).toString("hex")}`;
const key = await prisma.apiKey.create({
  data: { userId: session.user.id, name: name.trim(), key: rawKey }
  //                                                   ^^^ stored as-is
});
```

**Impact:** Database breach → all API keys stolen → full API access for all users.

**Remediation:**  
Store only a SHA-256 hash of the key and a display prefix:
```typescript
import crypto from "crypto";

const rawKey = `mnt_${crypto.randomBytes(32).toString("hex")}`;
const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
const keyPrefix = rawKey.slice(0, 12); // "mnt_xxxxxxxx"

await prisma.apiKey.create({
  data: { userId, name, keyHash, keyPrefix }
});
// Return rawKey to user ONCE, never store it.

// To authenticate incoming requests:
const incomingHash = crypto.createHash("sha256").update(bearerToken).digest("hex");
const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: incomingHash } });
```

---

## FINDING #003 — No API Key Authentication on v1 Endpoints
**Severity: HIGH**  
**Location:** `src/app/api/v1/stacks/route.ts`, `src/app/api/v1/profile/route.ts`

**Description:**  
The public API endpoints under `/api/v1/` are documented in the Settings page as requiring `Authorization: Bearer YOUR_KEY`, but there is no middleware or per-route logic to validate Bearer tokens.

**Impact:** The "public API" either rejects all requests (if it checks for session) or accepts all unauthenticated requests. Either way, API keys serve no purpose.

**Remediation:**  
Create a reusable `validateApiKey` helper:
```typescript
async function validateApiKey(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const keyHash = crypto.createHash("sha256").update(token).digest("hex");
  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
    include: { user: true }
  });
  if (apiKey) {
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date(), requests: { increment: 1 } }
    });
  }
  return apiKey?.user ?? null;
}
```

---

## FINDING #004 — No Input Validation Library
**Severity: HIGH**  
**Location:** All API routes

**Description:**  
Input validation is done via manual checks (`if (!title?.trim())`). There is no schema validation library (Zod, Yup, etc.). This creates risk of:
- Type coercion attacks
- Oversized payloads
- Unexpected field injection
- Missing validation on nested objects

**Evidence:**
```typescript
// POST /api/stacks — no validation on `modules` array structure
const { title, description, department, courseCode, university, semester, language, tags, modules, isPublic } = body;
// modules is cast directly without validation:
modules as { title: string; type: string }[]
```

**Remediation:**  
Install Zod and validate all API inputs:
```typescript
import { z } from "zod";

const CreateStackSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  department: z.string().max(100).optional(),
  courseCode: z.string().max(20).optional(),
  university: z.string().max(200).optional(),
  semester: z.string().max(50).optional(),
  language: z.enum(["PDF", "Video", "Live", "Markdown"]).default("PDF"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  modules: z.array(z.object({
    title: z.string().min(1).max(200),
    type: z.enum(["lecture", "assignment", "quiz", "video", "flashcard"])
  })).max(50).default([]),
  isPublic: z.boolean().default(true)
});
```

---

## FINDING #005 — No Rate Limiting
**Severity: HIGH**  
**Location:** All API routes

**Description:**  
No rate limiting is applied to any endpoint. This enables:
- Brute force attacks on `/api/auth/register` and login
- Denial of service via expensive DB queries
- API key generation spam
- Notification flooding

**Remediation:**  
Use `@upstash/ratelimit` with Redis, or implement simple in-memory rate limiting:
```typescript
// middleware.ts — add rate limiting for auth routes
import { Ratelimit } from "@upstash/ratelimit";
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

For simpler setups, use the `next-rate-limit` package or implement IP-based counting.

---

## FINDING #006 — Private Stack Access Not Enforced
**Severity: HIGH**  
**Location:** `src/app/api/stacks/route.ts`, `src/app/api/stacks/[slug]/route.ts`

**Description:**  
The `GET /api/stacks` route correctly filters `isPublic: true`. However, `GET /api/stacks/[slug]` does NOT check `isPublic`. A user who knows the slug of a private stack can view all its content.

**Evidence:**
```typescript
// stacks/[slug]/route.ts — no isPublic check
const stack = await prisma.stack.findUnique({
  where: { slug },  // ← fetches regardless of isPublic
  ...
});
```

**Remediation:**
```typescript
const stack = await prisma.stack.findUnique({ where: { slug } });
if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

if (!stack.isPublic) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== stack.ownerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
```

---

## FINDING #007 — No CSRF Protection Analysis
**Severity: MEDIUM**  
**Location:** All POST/PATCH/DELETE routes

**Description:**  
NextAuth.js v5 with JWT strategy mitigates most CSRF risks for session-based auth since the JWT is in an HttpOnly cookie and same-origin policy applies. However, custom API endpoints should verify the `Origin` header for state-changing requests, especially as the API grows.

**Remediation:**  
For API endpoints that accept Bearer tokens (v1 API), CSRF is not applicable. For session-based endpoints, ensure `SameSite=Strict` is set on session cookies (verify NextAuth default).

---

## FINDING #008 — No File Upload Security
**Severity: HIGH** (Pre-emptive — before file upload is implemented)  
**Location:** File upload system (to be built)

**Description:**  
When file upload is implemented, the following must be enforced:

**Required Controls:**
1. **File type validation** — Check MIME type server-side (not just extension)
2. **File size limits** — Enforce per-file and per-stack limits
3. **Malware scanning** — Integrate ClamAV or a cloud scanning service
4. **Storage isolation** — Files stored in cloud storage (S3/R2), never on app server
5. **Signed URLs** — Files should be served via time-limited signed URLs, not publicly accessible by default for private stacks
6. **Content-Disposition** — Force `attachment` header to prevent browser execution of uploaded HTML/JS

```typescript
// File upload validation
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm",
  "text/plain", "text/markdown",
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

---

## FINDING #009 — Username Generation Race Condition
**Severity: LOW**  
**Location:** `src/app/api/auth/register/route.ts`

**Description:**  
Username uniqueness is checked with a `while` loop of sequential DB reads, without a transaction. Under concurrent registrations with the same base name, two users could receive the same username before either is committed.

**Remediation:**  
Use a database-level unique constraint (already exists) and catch the Prisma unique violation error (`P2002`) instead of looping:
```typescript
try {
  const user = await prisma.user.create({ data: { ..., username } });
} catch (e: any) {
  if (e.code === "P2002" && e.meta?.target?.includes("username")) {
    // Retry with a random suffix
    username = `${base}_${Math.floor(Math.random() * 9999)}`;
  }
}
```

---

## FINDING #010 — Information Disclosure in Error Messages
**Severity: LOW**  
**Location:** Multiple API routes

**Description:**  
Several routes log internal errors and some may leak stack traces in development. In production, ensure all errors return generic messages:

```typescript
// BAD
return NextResponse.json({ error: err.message }, { status: 500 });

// GOOD
console.error("[POST /api/stacks]", err);
return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
```

Most routes already do this correctly. Audit to ensure consistency.

---

## FINDING #011 — NextAuth.js v5 Beta Dependency
**Severity: MEDIUM**  
**Location:** `package.json`

**Description:**  
The app uses `next-auth@5.0.0-beta.28`. The v5 beta API has had breaking changes across versions and may have unpatched vulnerabilities. 

**Remediation:**  
Either pin to the exact beta version and monitor for security advisories, or evaluate migrating to v5 stable once released. Do not auto-upgrade with `^5.0.0-beta.28` without reviewing changelogs.

---

## FINDING #012 — No Content Security Policy
**Severity: MEDIUM**  
**Location:** `next.config.mjs`

**Description:**  
No CSP headers are configured. This leaves the application vulnerable to XSS attacks if any user-generated content is rendered as HTML (currently not the case, but risky as features are added).

**Remediation:**
```javascript
// next.config.mjs
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten over time
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
    ].join("; ")
  }
];
```

---

## REMEDIATION PRIORITY ORDER

| # | Finding | Priority | Effort |
|---|---|---|---|
| 001 | Admin panel open to all users | 🔴 Fix immediately | 30 min |
| 002 | API keys stored in plaintext | 🔴 Fix immediately | 2 hours |
| 006 | Private stacks accessible by slug | 🔴 Fix immediately | 30 min |
| 004 | No input validation (Zod) | 🟠 Before launch | 1 week |
| 005 | No rate limiting | 🟠 Before launch | 1 day |
| 003 | No API key auth on v1 | 🟠 Before v1 launch | 4 hours |
| 008 | File upload security | 🟠 Before file upload ships | 1 week |
| 012 | No CSP headers | 🟡 Soon | 2 hours |
| 011 | Beta NextAuth | 🟡 Monitor | Ongoing |
| 007 | CSRF review | 🟡 Review | 1 hour |
| 009 | Username race condition | 🟢 Low risk | 1 hour |
| 010 | Error message leakage | 🟢 Audit | 2 hours |
