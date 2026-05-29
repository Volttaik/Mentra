# Mentra Platform Improvements

**Generated:** 2025-05-29  
**Scope:** Recommended improvements beyond the current QA fixes — prioritised by impact and effort.

---

## Priority 1 — High Impact, Low Effort

### 1.1 Add `prisma generate` to the startup workflow
**Why:** The Prisma client must be regenerated whenever the schema changes, or after a fresh install. Without it, the middleware fails to compile and the entire app breaks.  
**How:** Update `.replit` or the workflow command to run `npx prisma generate && next dev --port 5000`.

### 1.2 Add `prisma migrate deploy` to CI / deployment
**Why:** Schema changes in `prisma/migrations/` need to be applied to the production database on each deploy.  
**How:** Add `npx prisma migrate deploy` as a pre-start step in the deployment configuration.

### 1.3 Password reset flow
**Why:** The "Forgot password" link in the login page currently points to `#` and does nothing. Users who lose their password have no recovery path.  
**How:** Implement a `/forgot-password` page that emails a reset token, and a `/reset-password/[token]` page to set a new password. Use `nodemailer` or a transactional email service (Resend, SendGrid).

### 1.4 Rate limit API routes
**Why:** Key endpoints (`/api/stacks`, `/api/search`, `/api/keys`) currently have no rate limiting, leaving them open to abuse.  
**How:** Add a lightweight in-memory rate limiter (e.g. `@upstash/ratelimit` with Upstash Redis, or a simple sliding-window map for smaller deployments).

---

## Priority 2 — High Impact, Medium Effort

### 2.1 Move file uploads to object storage
**Why:** Files are currently written to `public/uploads/` on the local filesystem. This means:
- Files are lost on server restart / redeploy.
- Large uploads can fill the container's disk.
- Files are not CDN-served.  
**How:** Integrate Cloudflare R2 or AWS S3. The upload API route (`/api/stacks/[slug]/files/route.ts`) is already well-isolated — replace `writeFile` with an S3 `PutObjectCommand`.

### 2.2 Email notification delivery
**Why:** Notifications are stored in the database but never emailed to users. Notification preferences in settings have no downstream effect.  
**How:** Add a background job (or edge function) that sends email summaries via a transactional provider when notifications are created.

### 2.3 Global error boundary
**Why:** Unhandled client-side exceptions currently show a blank screen. A top-level `error.tsx` boundary would display a friendly fallback and log the error.  
**How:** Add `mantra/src/app/error.tsx` using Next.js App Router's `error.tsx` convention.

### 2.4 Search indexing
**Why:** The current `/api/search` route uses raw `ILIKE` queries across multiple tables. At scale (thousands of stacks), this will become slow and miss fuzzy matches.  
**How:** Integrate PostgreSQL full-text search (`tsvector`/`tsquery`) or a dedicated search service (Typesense, Algolia, Meilisearch).

---

## Priority 3 — Medium Impact

### 3.1 Optimistic UI for star / bookmark actions
**Why:** Star and bookmark toggles currently wait for the API round-trip before updating the UI, making them feel slow.  
**How:** Apply the optimistic update immediately on click, then reconcile with the server response.

### 3.2 Stack editor autosave
**Why:** If a user closes the edit modal mid-edit without saving, all changes are lost.  
**How:** Debounce edits and persist a draft to `localStorage`, then offer a "restore draft" option on next open.

### 3.3 Infinite scroll intersection observer
**Why:** The "Load more" button on the Explore page requires a click. A properly configured `IntersectionObserver` would trigger pagination automatically as the user scrolls near the bottom.  
**How:** Replace the "Load more" button with a sentinel `div` monitored by `IntersectionObserver`.

### 3.4 Image optimisation for uploaded files
**Why:** User-uploaded images in stacks are served as raw files without resizing or compression, which can slow down stack pages.  
**How:** Run uploads through a sharp transform before storage (resize to max 2000px, convert to WebP).

### 3.5 Admin route authentication guard
**Why:** The admin page calls `/api/admin/*` routes that return 401/403 correctly, but the frontend admin page itself has no client-side role check — a non-admin who knows the URL can see the (empty) UI.  
**How:** Add a session check at the top of `admin/page.tsx` that redirects to `/dashboard` if the user's role is not `ADMIN`.

---

## Priority 4 — Future / Architectural

### 4.1 WebSocket / SSE for live discussions
**Why:** Discussions on stack pages currently require a manual refresh to see new comments.  
**How:** Implement Server-Sent Events (SSE) via a `/api/stacks/[slug]/events` route, or use a managed service like Ably or Pusher.

### 4.2 AI-powered stack features
**Why:** The platform description mentions "auto-generated flashcards, summaries, and concept maps." These are not yet implemented.  
**How:** On file upload, trigger a background job that calls an LLM API (OpenAI, Anthropic) to extract key concepts and create `LearningProgress` records.

### 4.3 Analytics dashboard
**Why:** Stack owners currently cannot see view trends over time — only a lifetime view count.  
**How:** Record view events in a `StackView` table with a timestamp, and surface a simple sparkline chart on the stack detail page.

### 4.4 End-to-end test coverage
**Why:** There are no automated tests. Critical paths (auth, stack creation, fork, file upload) are completely untested.  
**How:** Add Playwright e2e tests for the most important user journeys. Start with registration, login, stack creation, and search.
