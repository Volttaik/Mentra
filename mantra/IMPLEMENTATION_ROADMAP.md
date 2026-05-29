# MENTRA — IMPLEMENTATION ROADMAP

**Date:** May 29, 2026  
**Purpose:** Prioritized, sequenced plan to transform Mentra from prototype to production

---

## OVERVIEW

The roadmap is organized into 5 phases:

| Phase | Name | Duration | Goal |
|---|---|---|---|
| P0 | Security & Foundation | 1 week | Fix critical bugs and security holes |
| P1 | Core Product MVP | 4–6 weeks | Make the core loop work end-to-end |
| P2 | Social & Discovery | 3–4 weeks | Engagement and growth features |
| P3 | Monetization | 3–4 weeks | Revenue generation |
| P4 | Education Platform | 6–8 weeks | Full educational ecosystem |
| P5 | Scale & Polish | Ongoing | Performance, mobile, AI |

---

## PHASE 0 — SECURITY & FOUNDATION
**Timeline: Week 1**  
**Goal: Ensure the platform is safe to open to any users**

### P0.1 — Fix Admin Role Guard (Day 1)
**Priority: CRITICAL**
- Update `middleware.ts` to check `role === "ADMIN"` for `/admin` routes
- Update `auth.ts` to include `role` in JWT token and session
- Test: non-admin users get 403 redirect

### P0.2 — Hash API Keys (Day 1–2)
**Priority: CRITICAL**
- Add `keyHash` + `keyPrefix` columns to `ApiKey` table
- Remove `key` plaintext column
- Update `POST /api/keys` to hash before storing
- Update `GET /api/keys` to return prefix only
- Write migration script

### P0.3 — Private Stack Access Control (Day 2)
**Priority: CRITICAL**
- Add ownership check to `GET /api/stacks/[slug]`
- Add ownership check to `GET /api/content`
- Add ownership check to `GET /api/editions`
- Test: private stack is 404 for non-owner

### P0.4 — Input Validation with Zod (Day 2–4)
**Priority: HIGH**
- Install `zod`
- Create validation schemas for all existing API routes:
  - `register`, `stacks POST`, `stacks GET`, `content POST`, `editions POST`, `profile PATCH`, `keys POST`
- Return structured 400 errors

### P0.5 — Wire Critical Dead Features (Day 3–5)
**Priority: HIGH**
- Implement `PATCH /api/stacks/[slug]` (edit metadata)
- Implement `DELETE /api/stacks/[slug]` (delete stack)
- Implement password change: `POST /api/auth/password`
- Implement account deletion: `DELETE /api/user`
- Wire up Change Password form in settings
- Wire up Delete Account button in settings

### P0.6 — Email Provider Setup (Day 4–5)
**Priority: HIGH**
- Integrate Resend or SendGrid
- Implement: welcome email on registration
- Implement: password reset flow (generate token, send link, consume token)
- Implement: email verification on registration

### Deliverables — End of Phase 0
- ✅ No authenticated user can access admin features
- ✅ API keys are securely stored
- ✅ Private stacks are private
- ✅ All API inputs are validated
- ✅ Password reset works
- ✅ Email verification works

---

## PHASE 1 — CORE PRODUCT MVP
**Timeline: Weeks 2–7**  
**Goal: File uploads work, forking works, discussions work**

### P1.1 — File Storage Integration (Week 2)
**Priority: CRITICAL — the core value proposition**

**Decision:** Use Cloudflare R2 (S3-compatible, free egress) or Supabase Storage

**Tasks:**
1. Set up storage bucket with CORS for browser uploads
2. Create `File` model in Prisma schema
3. Create `POST /api/stacks/[slug]/files` — generate presigned upload URL
4. Create `GET /api/stacks/[slug]/files` — list files in stack/module
5. Create `DELETE /api/stacks/[slug]/files/[fileId]` — delete file
6. Frontend: add file upload step to stack creation wizard
7. Frontend: add file management tab to stack detail page (owner view)
8. Implement file size limit enforcement (100MB per file, 500MB per stack)
9. Implement allowed MIME type validation

**File types to support initially:**
- PDF (`application/pdf`)
- DOCX (`application/vnd.openxmlformats-...`)
- PPTX (`application/vnd.openxmlformats-...`)
- Images (JPEG, PNG, WebP, GIF)
- Plain text / Markdown

### P1.2 — PDF Viewer (Week 3)
**Priority: CRITICAL**

- Install `react-pdf` or use iframe-based viewer
- Create `/stacks/[slug]/files/[fileId]` view route
- Implement: load PDF, page navigation, zoom
- Implement: download button with signed URL

### P1.3 — Fork Creates Content Copy (Week 3)
**Priority: HIGH**

Current behavior: fork records a relationship only.  
Required behavior: forking creates a new Stack owned by the forking user, containing:
- Copies of metadata (title: "Fork of X", description, tags, modules)
- References to source files (shared, not copied, until modified)
- `forkedFromId` linking back to source

**Tasks:**
1. Update `POST /api/stacks/[slug]/fork` to create a new Stack
2. Update `StackFork` to store `forkedStackId`
3. Frontend: after fork, redirect to the new forked stack

### P1.4 — Discussions System (Week 3–4)
**Priority: HIGH**

**Tasks:**
1. `POST /api/stacks/[slug]/discussions` — create discussion
2. `GET /api/stacks/[slug]/discussions/[id]` — get discussion + comments
3. `POST /api/stacks/[slug]/discussions/[id]/comments` — add reply
4. `PATCH /api/stacks/[slug]/discussions/[id]` — resolve, pin
5. `DELETE /api/stacks/[slug]/discussions/[id]` — delete
6. Frontend: discussion creation modal in stack detail
7. Frontend: discussion detail page with comment thread
8. Send notification on new comment (COMMENT type)
9. Trigger FOLLOW notification in follow API

### P1.5 — Stack Editing (Week 4)
**Priority: HIGH**

**Tasks:**
1. `PATCH /api/stacks/[slug]` — update metadata, readme, tags
2. Module CRUD: `POST/PATCH/DELETE /api/stacks/[slug]/modules/[moduleId]`
3. Frontend: "Edit Stack" button visible to owner on stack detail
4. Frontend: Edit modal or dedicated edit page
5. Frontend: README editor (use `react-simplemde-editor` or similar)

### P1.6 — Admin Panel (Week 5)
**Priority: HIGH**

**Tasks:**
1. Create `GET /api/admin/stats` — real platform statistics
2. Create `GET /api/admin/stacks` — paginated real stack list
3. Create `GET /api/admin/users` — paginated real user list
4. Create `PATCH /api/admin/stacks/[id]` — verify/unverify/archive
5. Create `PATCH /api/admin/users/[id]` — suspend/unsuspend/promote role
6. Create `Report` schema migration
7. Create `POST /api/reports` — submit report
8. Create `GET/PATCH /api/admin/reports` — list and resolve reports
9. Frontend: wire all admin tables to real APIs
10. Frontend: implement report submission modal (from stack detail)

### P1.7 — Real Contribution Graph (Week 5)
**Priority: MEDIUM**

Create a `UserActivity` log or aggregate from existing events (stack creations, discussions, contributions) to power a real GitHub-style contribution graph.

### P1.8 — OAuth Integration (Week 6)
**Priority: MEDIUM**

**Tasks:**
1. Add Google provider to NextAuth config
2. Add GitHub provider to NextAuth config
3. Frontend: add OAuth buttons to login/register pages
4. Handle account linking (email collision with existing credentials account)

### P1.9 — Notification System Completion (Week 6)
**Priority: MEDIUM**

**Tasks:**
1. Trigger FOLLOW notification in `POST /api/profile/[username]/follow`
2. Wire notification preferences settings to DB (new `NotificationPreferences` model or JSON column)
3. Add real-time indicator: poll for unread count every 30s or use Server-Sent Events

### Deliverables — End of Phase 1
- ✅ Users can upload PDF/DOCX/images to stacks
- ✅ Files can be previewed in-browser
- ✅ Forking creates a real copy
- ✅ Discussions can be created and replied to
- ✅ Stack metadata is editable
- ✅ Admin panel shows real data
- ✅ OAuth login works

---

## PHASE 2 — SOCIAL & DISCOVERY
**Timeline: Weeks 8–11**  
**Goal: Users can discover content and build an audience**

### P2.1 — Full-Text Search (Week 8)
**Priority: HIGH**

**Option A (Quick):** PostgreSQL `pg_trgm` + `tsvector`
**Option B (Best):** Meilisearch or Algolia

**Tasks (Option A — recommended for early stage):**
1. Add `pg_trgm` extension to DB
2. Add `search_vector` computed column to `stacks`
3. Create GIN index
4. Update `GET /api/stacks` to use FTS for `q` parameter
5. Extend search to include MT content text (`searchIndex` field)

### P2.2 — Trending Algorithm (Week 8)
**Priority: MEDIUM**

Replace `createdAt desc` with a real score:
```sql
-- Trending score (decay over time)
score = (stars_last_7d * 3) + (forks_last_7d * 5) + (views_last_7d * 0.1)
        + (discussions_last_7d * 2)
```
Compute hourly via background job, store in `Stack.trendingScore`.

### P2.3 — Contributors Directory (Week 9)
**Priority: MEDIUM**

**Tasks:**
1. `GET /api/users` — paginated, sortable user list
2. Filters: university, department, most stars received, most stacks
3. Frontend: implement "Contributors" tab in explore
4. Frontend: implement "Universities" tab (aggregate stacks by university)

### P2.4 — User Profiles Enhancement (Week 9)
**Priority: MEDIUM**

**Tasks:**
1. Avatar upload: presigned URL to storage, update `user.image`
2. Banner image upload: presigned URL, update `user.banner`
3. Social links: add `twitter`, `linkedin`, `orcid` to profile form
4. Followers/following list: modal showing user list
5. Real contribution graph (from P1.7)

### P2.5 — Related Stacks & Recommendations (Week 10)
**Priority: MEDIUM**

Simple content-based recommendations:
1. "More by this author" — same owner's stacks
2. "In the same course" — same `courseCode` + `university`
3. "You might like" — same tags as bookmarked/starred stacks

### P2.6 — Reading Lists (Week 10)
**Priority: LOW**

**Tasks:**
1. `ReadingList` + `ReadingListItem` schema migration
2. `POST/GET/DELETE /api/reading-lists` CRUD
3. "Add to reading list" from stack detail
4. Reading list detail page

### P2.7 — Stack Embed / Share (Week 11)
**Priority: LOW**

- Open Graph meta tags for stacks (for rich previews on social media)
- Twitter/X card support
- Embeddable iframe widget for external sites

### Deliverables — End of Phase 2
- ✅ Fast, accurate full-text search
- ✅ Meaningful trending sort
- ✅ User discovery pages
- ✅ Avatar and banner uploads
- ✅ Recommendations visible on stack pages

---

## PHASE 3 — MONETIZATION
**Timeline: Weeks 12–15**  
**Goal: Creators can earn money; platform generates revenue**

### P3.1 — Pricing Model Design
**Decision:** Two-tier monetization
1. **One-time purchase** — user pays once to access a paid stack
2. **Creator subscription** — monthly subscription to a creator's content

**Platform take rate:** 20% (adjust based on market research)

### P3.2 — Stripe Integration (Week 12)
**Tasks:**
1. Install `stripe` SDK
2. Create Stripe Connect accounts for creators (enables payouts)
3. `POST /api/payments/checkout` — create Stripe checkout session for stack purchase
4. `POST /api/webhooks/stripe` — handle payment_intent.succeeded, subscription events
5. `Purchase` schema migration
6. `Subscription` schema migration

### P3.3 — Paid Stack UI (Week 13)
**Tasks:**
1. Stack creation: add price type (free/paid/subscription) and price fields
2. Stack detail: show purchase button for unpurchased paid stacks
3. Stack detail: blur/lock file previews until purchased
4. Purchase confirmation page
5. "Purchased stacks" section in dashboard

### P3.4 — Creator Dashboard (Week 13–14)
**Tasks:**
1. `GET /api/creator/earnings` — revenue breakdown
2. `GET /api/creator/subscribers` — subscriber list
3. Creator analytics: views, purchases, conversion rate
4. Payout settings: bank account / Stripe Connect dashboard link

### P3.5 — Institutional Licensing (Week 15)
**Priority: LOW for MVP**
- Bulk license for universities to grant all students access

### Deliverables — End of Phase 3
- ✅ Creators can set paid stacks
- ✅ Users can purchase stacks with Stripe
- ✅ Creators see earnings dashboard
- ✅ Platform captures commission automatically

---

## PHASE 4 — EDUCATION PLATFORM
**Timeline: Weeks 16–23**  
**Goal: Mentra becomes a complete learning environment**

### P4.1 — Learning Progress (Week 16)
- Wire existing `LearningProgress` model to frontend
- Module completion checkmarks
- Progress bar on stack detail
- "Continue where you left off" on dashboard

### P4.2 — Flashcard System (Week 17)
- Auto-generate from MT content concepts
- Manual flashcard creation
- Flashcard study mode (flip animation)
- Spaced repetition algorithm (SM-2)

### P4.3 — Quiz Builder (Week 18)
- Multiple choice, true/false, short answer
- Auto-generate quiz from MT content
- Quiz results and score tracking
- Leaderboard per stack

### P4.4 — Annotation System (Week 19)
- Highlight text in PDF viewer
- Add notes to highlights
- Private annotations (default) or shared with study group
- Annotation export

### P4.5 — AI Integration (Week 20–21)
- AI stack summary generation (OpenAI / Anthropic)
- AI concept extraction improvement
- AI-suggested related stacks
- AI-powered Q&A ("Ask this stack")

### P4.6 — Knowledge Pathways (Week 22)
- Curated sequence of stacks
- Prerequisites linking
- "Complete this pathway" certification

### P4.7 — Certifications (Week 23)
- Certificate of completion for pathway
- Shareable certificate (LinkedIn link)
- Verification API

---

## PHASE 5 — SCALE & POLISH
**Timeline: Ongoing after Phase 4**

### Performance
- [ ] Redis caching for hot stacks, user profiles
- [ ] CDN for static assets and file delivery
- [ ] Image optimization pipeline
- [ ] Database query optimization / N+1 analysis
- [ ] Background job queue (BullMQ) for async work

### Mobile
- [ ] PWA manifest and service worker
- [ ] React Native or Expo mobile app
- [ ] Push notifications

### Developer Platform
- [ ] Complete v1 API with documentation
- [ ] Webhook system (push events to external systems)
- [ ] Embeddable widget
- [ ] LMS integration (Canvas, Moodle, Blackboard)

---

## RESOURCE REQUIREMENTS

| Phase | Frontend | Backend | Design | DevOps |
|---|---|---|---|---|
| P0 | 0.5 dev | 1 dev | 0 | 0 |
| P1 | 2 devs | 2 devs | 0.5 | 0.5 |
| P2 | 1.5 devs | 1 dev | 0.5 | 0.25 |
| P3 | 1 dev | 1.5 devs | 0.25 | 0.5 |
| P4 | 2 devs | 2 devs | 1 | 0.5 |

---

## CRITICAL PATH (Minimum for any real launch)

```
P0 (1 week) → P1.1 Files (1 week) → P1.2 Viewer (1 week) → P1.3 Fork (3 days) → P1.4 Discussions (1 week)
= ~5 weeks to minimum viable product
```

**You cannot launch Mentra without:** file uploads, file viewing, real forking, and discussions.
These are the four features that define the platform. Everything else is enhancement.
