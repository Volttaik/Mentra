# MENTRA — MASTER INSTRUCTIONS
## The Single Source of Truth for Platform Development

**Document Version:** 1.0  
**Last Updated:** May 29, 2026  
**Status:** Active

---

## 1. PLATFORM VISION

Mentra is **"GitHub for Knowledge"** — a platform for publishing, organizing, discovering, and monetizing educational content.

### Core Philosophy
- Knowledge compounds. Good notes should get better every semester, not disappear.
- Every stack is versioned, forkable, and collaborative.
- Creators deserve to earn from their expertise.
- Discovery should be effortless.

### Target Audience
1. **Students** — find, study, and improve academic materials
2. **Professors / Educators** — publish verified course content
3. **Researchers** — share datasets, papers, reference materials
4. **Professional experts** — monetize domain knowledge
5. **Universities** — institutionally license content

### Terminology (Strictly Enforce)
- ✅ **Stack** (not repository, repo, course, or collection)
- ✅ **Edition** (not version, release, or snapshot)
- ✅ **Module** (not chapter, section, or unit)
- ✅ **Fork** (create your own copy of a stack)
- ✅ **Contribute** (submit an improvement to someone else's stack)
- ✅ **Star** (like/favorite a stack)
- ❌ Never call a stack a "repository" in user-facing UI (codebase may use both internally)

---

## 2. ARCHITECTURE

### Technology Stack
```
Frontend:   Next.js 14 App Router + React 18 + TypeScript
Styling:    Tailwind CSS 3 (custom design tokens) + Framer Motion
Auth:       NextAuth.js v5 (Credentials + OAuth providers)
Database:   PostgreSQL via Prisma ORM 6
Storage:    [TO ADD] Cloudflare R2 or Supabase Storage
Search:     [TO ADD] PostgreSQL FTS (pg_trgm) → Meilisearch at scale
Email:      [TO ADD] Resend or SendGrid
Payments:   [TO ADD] Stripe Connect
State:      Zustand (used minimally, expand as needed)
Validation: [TO ADD] Zod for all API inputs
Error Mon:  [TO ADD] Sentry
```

### File Organization Rules
```
src/app/api/           ← All API route handlers (server-side only)
src/app/[page]/        ← Page components (prefer server components)
src/components/layout/ ← Navbar, Footer, MobileNav (always present)
src/components/ui/     ← Reusable UI components
src/lib/               ← Shared utilities, Prisma client, data
src/types/             ← TypeScript type definitions
```

### API Route Conventions
- All routes in `src/app/api/`
- Use `auth()` from `@/auth` for session
- Always validate inputs (use Zod schemas)
- Always return JSON with consistent shape: `{ data }` or `{ error }`
- Use HTTP status codes correctly (200/201/400/401/403/404/500)
- Never leak internal error messages to clients

### Component Conventions
- Prefer Server Components for data-fetching pages
- Use `"use client"` only when interactivity is needed
- All pages must have a loading state
- All pages must have an empty state with an icon + message + CTA
- All forms must have error states

---

## 3. DESIGN SYSTEM

### Color Tokens (Tailwind)
The platform uses a custom Material Design 3-inspired palette. Key tokens:

| Token | Purpose |
|---|---|
| `primary` | Brand color, headings, primary CTAs |
| `on-primary` | Text on primary backgrounds |
| `secondary` | Accent, links, highlights |
| `on-secondary` | Text on secondary backgrounds |
| `secondary-container` | Soft background for badges, chips |
| `on-secondary-container` | Text on secondary-container |
| `surface-container-lowest` | Card backgrounds |
| `surface-container` | Sidebar, hover states |
| `outline-variant` | Borders, dividers |
| `on-surface-variant` | Secondary text, labels |
| `error` | Destructive actions |

### Typography
- **Headings:** `font-manrope font-bold` — all major headings
- **Body:** Default sans-serif (system font)
- **Code:** `font-mono` for API keys, code snippets

### Reusable CSS Classes (from globals.css)
```css
.card          /* White card with shadow and rounded corners */
.card-sm       /* Smaller variant */
.btn-primary   /* Primary action button */
.btn-secondary /* Secondary/outline button */
.input-field   /* Standard form input */
.tag           /* Neutral pill tag */
.tag-accent    /* Colored pill tag (secondary colors) */
```

### Animation Guidelines
- Use Framer Motion `initial/animate` on page entry
- `viewport={{ once: true }}` for scroll-triggered animations
- Never animate more than 4 elements simultaneously
- Entry animations: `opacity: 0 → 1`, `y: 16 → 0`, duration 0.5–0.8s
- Ease: `[0.16, 1, 0.3, 1]` (custom spring feel)

---

## 4. DATABASE RULES

### Prisma Usage
- Always use the singleton `@/lib/prisma` client
- Never create a new PrismaClient in a route handler
- Use `include` for relations, never raw SQL unless necessary
- Use `select` to avoid over-fetching sensitive fields
- Wrap multi-step operations in `prisma.$transaction()`
- Always handle `P2002` (unique violation) and `P2025` (not found) errors

### Critical Schema Rules
1. `ApiKey.key` must be stored hashed, never plaintext
2. `Stack.isPublic` is being migrated to `Stack.visibility` enum — plan for this
3. `Edition.editorId` is a string, not a FK — add proper relation
4. `StackFork` needs `forkedStackId` to point to the created copy
5. `Module.files` count should be removed in favor of `_count.files` from the File relation

### Migration Strategy
- Never modify a migration file after it's been applied
- Always use `prisma migrate dev` in development
- Always use `prisma migrate deploy` in production
- Test migrations on a staging database first

---

## 5. SECURITY RULES (NON-NEGOTIABLE)

1. **All admin routes** must check `session.user.role === "ADMIN"` — in middleware AND in the route handler
2. **All API keys** must be stored as SHA-256 hash + display prefix. The raw key is shown once and never stored.
3. **All file uploads** must validate MIME type server-side, enforce size limits, and store in cloud storage (never on the app server)
4. **All user inputs** must be validated with Zod before any DB operation
5. **Private stacks** must check ownership before returning any data
6. **Rate limiting** must be applied to auth endpoints (register, login, password reset)
7. **Never expose** raw database errors to API clients
8. **Password reset tokens** must be: single-use, time-limited (15 minutes), stored as a hash
9. **File downloads** must use time-limited signed URLs for private content
10. **Admin actions** must be logged to `audit_logs`

---

## 6. MISSING FEATURES — IMPLEMENTATION ORDER

### Tier 0 (Fix before any new user touches the platform)
- [ ] Admin role enforcement in middleware
- [ ] Hash API keys (migrate existing)
- [ ] Private stack access control on `GET /api/stacks/[slug]`
- [ ] Wire Change Password form
- [ ] Wire Delete Account button
- [ ] Zod validation on all existing routes

### Tier 1 (Core product — file upload)
- [ ] Cloud storage integration (R2 or Supabase Storage)
- [ ] File upload API (`POST /api/stacks/[slug]/files`)
- [ ] File listing API
- [ ] File deletion API
- [ ] PDF viewer component
- [ ] File upload step in stack creation wizard
- [ ] File manager tab on stack detail (owner)
- [ ] File download with signed URLs

### Tier 2 (Core social loop)
- [ ] Discussion creation modal (POST /api/stacks/[slug]/discussions)
- [ ] Discussion detail page with comments
- [ ] Comment threading (parentId on Comment)
- [ ] Follow notification trigger
- [ ] Real fork (creates new Stack entity)
- [ ] Stack editing (PATCH /api/stacks/[slug])
- [ ] Module CRUD endpoints
- [ ] Stack deletion (DELETE /api/stacks/[slug])

### Tier 3 (Authentication completion)
- [ ] Email provider (Resend/SendGrid)
- [ ] Email verification flow
- [ ] Forgot password / reset password flow
- [ ] Google OAuth
- [ ] GitHub OAuth

### Tier 4 (Admin & moderation)
- [ ] Real admin stats API
- [ ] Real admin user/stack tables
- [ ] Stack verification API
- [ ] User suspension API
- [ ] Content reporting (Report model + API)
- [ ] Report review workflow

### Tier 5 (Discovery improvements)
- [ ] PostgreSQL full-text search (pg_trgm + tsvector)
- [ ] Fix trending algorithm
- [ ] Contributors directory page
- [ ] Universities directory page
- [ ] Real contribution graph

### Tier 6 (Monetization)
- [ ] Stripe Connect integration
- [ ] Paid stack model (price, priceType fields)
- [ ] Purchase checkout flow
- [ ] Creator earnings dashboard
- [ ] Subscription model

### Tier 7 (Education features)
- [ ] Learning progress UI
- [ ] Flashcard system
- [ ] Quiz builder
- [ ] Reading lists
- [ ] Annotation system

---

## 7. API REFERENCE

### Current Endpoints

#### Authentication
```
POST /api/auth/register         Register new user
POST /api/auth/[...nextauth]    NextAuth handlers (login/logout/session)
```

#### Stacks
```
GET  /api/stacks                List public stacks (q, department, sort, page)
POST /api/stacks                Create new stack (auth required)
GET  /api/stacks/[slug]         Get stack detail
PATCH /api/stacks/[slug]        [TODO] Update stack (owner only)
DELETE /api/stacks/[slug]       [TODO] Delete stack (owner only)

POST /api/stacks/[slug]/star    Toggle star
POST /api/stacks/[slug]/fork    Fork stack
POST /api/stacks/[slug]/bookmark Toggle bookmark

GET  /api/stacks/[slug]/discussions       List discussions
POST /api/stacks/[slug]/discussions       [TODO] Create discussion
GET  /api/stacks/[slug]/discussions/[id]  Get discussion + comments
DELETE /api/stacks/[slug]/discussions/[id] [TODO] Delete discussion

GET  /api/stacks/[slug]/editions  List editions
```

#### Editions & Content
```
GET  /api/editions              Get editions for stackId
POST /api/editions              Create manual edition (owner only)
POST /api/content               Upload text content → auto-creates edition
GET  /api/content               Get latest (or specific) edition content
```

#### Files (TODO)
```
POST /api/stacks/[slug]/files   Upload file (returns presigned URL)
GET  /api/stacks/[slug]/files   List files in stack
DELETE /api/stacks/[slug]/files/[fileId]  Delete file
GET  /api/files/[fileId]/download  Signed download URL
```

#### Profiles
```
GET  /api/profile/[username]    Get public profile
POST /api/profile/[username]/follow  Toggle follow
PATCH /api/profile/settings     Update own profile
```

#### Dashboard & Notifications
```
GET  /api/dashboard             Aggregated dashboard data
GET  /api/notifications         List notifications
PATCH /api/notifications        Mark notifications as read
```

#### API Keys
```
GET  /api/keys                  List user's API keys
POST /api/keys                  Generate new API key
DELETE /api/keys?id=            Delete API key
```

#### Admin (TODO: all need real data)
```
GET  /api/admin/stats           Platform statistics
GET  /api/admin/stacks          All stacks (paginated)
PATCH /api/admin/stacks/[id]    Verify/archive stack
GET  /api/admin/users           All users (paginated)
PATCH /api/admin/users/[id]     Suspend/promote user
GET  /api/admin/reports         Content reports
PATCH /api/admin/reports/[id]   Resolve report
```

#### Public API (v1)
```
GET  /api/v1/stacks             List stacks (Bearer auth)
POST /api/v1/stacks             Create stack (Bearer auth)
GET  /api/v1/profile            Get own profile (Bearer auth)
```

---

## 8. KNOWN BUGS (FIX THESE)

| Bug | Location | Fix |
|---|---|---|
| Admin open to any user | middleware.ts | Add role check |
| API keys stored plaintext | api/keys/route.ts | Hash before storing |
| Private stacks accessible | api/stacks/[slug]/route.ts | Check isPublic + ownership |
| Trending sort = Newest | api/stacks/route.ts | Implement proper algorithm |
| Contribution graph is fake | ContributionGraph.tsx | Use real activity data |
| Download button dead | stacks/[slug]/page.tsx | Wire to file download API |
| New Discussion button dead | stacks/[slug]/page.tsx | Add modal + API call |
| Change Password silent | settings/page.tsx | Wire to PATCH /api/auth/password |
| Delete Account silent | settings/page.tsx | Wire to DELETE /api/user |
| Notification prefs unsaved | settings/page.tsx | Wire to DB |
| Admin data mocked | admin/page.tsx | Wire to real admin APIs |
| Fork doesn't copy stack | api/stacks/[slug]/fork/route.ts | Create new Stack entity |
| Module files = always 0 | prisma schema | Add File model + relation |
| Follow notification missing | api/profile/[username]/follow | Add notification.create |

---

## 9. ENVIRONMENT VARIABLES

```env
# Required (app will not start without these)
DATABASE_URL=            # PostgreSQL connection string
AUTH_SECRET=             # NextAuth secret (min 32 chars)
NEXTAUTH_URL=            # Full URL of the app (e.g. https://mentra.app)

# Required for email (Tier 3)
RESEND_API_KEY=          # or SENDGRID_API_KEY

# Required for file uploads (Tier 1)
R2_ACCOUNT_ID=           # Cloudflare account ID
R2_ACCESS_KEY_ID=        # R2 access key
R2_SECRET_ACCESS_KEY=    # R2 secret
R2_BUCKET_NAME=          # Bucket name
R2_PUBLIC_URL=           # Public URL for bucket

# Required for payments (Tier 6)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional
GOOGLE_CLIENT_ID=        # OAuth
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SENTRY_DSN=              # Error monitoring
UPSTASH_REDIS_REST_URL=  # For rate limiting
UPSTASH_REDIS_REST_TOKEN=
```

---

## 10. DEPLOYMENT CHECKLIST

Before any production deployment:

### Security
- [ ] `AUTH_SECRET` is a cryptographically random 64-char string
- [ ] Admin role enforcement verified
- [ ] API keys are hashed
- [ ] Private stack access control verified
- [ ] Rate limiting enabled on auth routes
- [ ] CSP headers configured in `next.config.mjs`
- [ ] `NODE_ENV=production` set

### Data
- [ ] `prisma migrate deploy` run on production DB
- [ ] At least one ADMIN user seeded
- [ ] Database backups configured

### Infrastructure
- [ ] Storage bucket configured with CORS
- [ ] Email provider connected and tested
- [ ] Error monitoring (Sentry) connected
- [ ] DNS configured

### Code
- [ ] All hardcoded mock data (`MOCK_REPOSITORIES`, `MOCK_USERS`) removed from user-facing pages
- [ ] Homepage stats connected to real DB counts or updated to "early access" messaging
- [ ] `next build` passes with no TypeScript errors
- [ ] All API routes tested with real DB

---

## 11. DEVELOPMENT WORKFLOW

```bash
# Install dependencies
cd mantra && npm install

# Set up database
npx prisma migrate dev

# Start dev server (port 5000 for Replit)
npm run dev -- --port 5000

# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (DB GUI)
npx prisma studio
```

### Git Conventions
- Branch: `feature/[feature-name]`, `fix/[bug-name]`, `security/[finding-id]`
- Commit: `feat:`, `fix:`, `security:`, `refactor:`, `docs:`
- Never commit `.env` or any secrets

---

## 12. COMPETITIVE POSITIONING

| Platform | Strength | Mentra Advantage |
|---|---|---|
| GitHub | Code version control | Mentra applies same model to knowledge, not code |
| Notion | Flexible docs | Mentra has academic structure, versioning, forking |
| Google Drive | File storage | Mentra is social, structured, searchable |
| ResearchGate | Research papers | Mentra covers all knowledge types, not just papers |
| Academia.edu | Academic profiles | Mentra is collaborative, not just publishing |
| Coursera | Video courses | Mentra is creator-led, not institution-led |
| Scribd | Document library | Mentra is collaborative and versioned |
| Moodle/Canvas | LMS | Mentra is open and public, not closed classroom |

**Unique Differentiators:**
1. Fork-and-improve model applied to knowledge
2. Edition history — knowledge has a documented evolution
3. Creator monetization built in
4. Community verification (not just institutional)
5. Open by default (stacks are public and forkable)

---

## 13. METRICS TO TRACK

### Growth
- Daily/monthly active users (DAU/MAU)
- New stacks created per day
- Files uploaded per day
- Forks per day (signals content quality)

### Engagement
- Stack view duration
- Comments per discussion
- Star rate (stacks starred / stacks viewed)
- Return visit rate

### Monetization
- GMV (gross merchandise value)
- Creator earnings
- Conversion rate (free → paid)
- Subscription churn rate

### Quality
- Average stars per stack
- Percentage of verified stacks
- Fork-to-contribution ratio

---

*This document should be updated after every significant feature addition or architectural decision.*
