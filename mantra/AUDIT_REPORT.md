# MENTRA PLATFORM — FULL CODEBASE AUDIT REPORT

**Date:** May 29, 2026  
**Auditor:** Principal Software Architect  
**Scope:** Complete forensic audit of the Mentra Next.js platform

---

## EXECUTIVE SUMMARY

Mentra is an academic knowledge-sharing platform positioned as "GitHub for Knowledge." The codebase is a Next.js 14 App Router application with a PostgreSQL/Prisma backend and NextAuth.js authentication. The platform has a solid structural foundation and polished UI, but is approximately **35–40% complete** for a production launch. Core social features (star, fork, bookmark, notifications) are functional. However, file uploading, monetization, real-time collaboration, the editions viewer, the admin panel, the search engine, and the entire educational ecosystem are either missing, mocked, or stubs.

**Overall Readiness:** Not production-ready  
**Estimated Completion (MVP):** 60–70% additional work required

---

## PHASE 1 — ARCHITECTURE OVERVIEW

### Tech Stack
| Layer | Technology | Version | Status |
|---|---|---|---|
| Framework | Next.js App Router | 14.2.29 | ✅ Current |
| Language | TypeScript | 5.x | ✅ |
| ORM | Prisma | 6.x | ✅ |
| Database | PostgreSQL | — | ✅ |
| Auth | NextAuth.js v5 beta | 5.0.0-beta.28 | ⚠️ Beta, unstable |
| Styling | Tailwind CSS | 3.x | ✅ |
| Animations | Framer Motion | 11.x | ✅ |
| State | Zustand | 5.x | ✅ (barely used) |
| Icons | Lucide React | 0.513 | ✅ |
| File Storage | None | — | ❌ Missing |
| Search | None (SQL LIKE) | — | ❌ Inadequate |
| Email | None | — | ❌ Missing |
| Payments | None | — | ❌ Missing |
| CDN | None | — | ❌ Missing |

### Directory Structure
```
mantra/
├── prisma/schema.prisma          ← Database schema
├── src/
│   ├── app/
│   │   ├── api/                  ← Backend API routes
│   │   │   ├── auth/             ← NextAuth + register
│   │   │   ├── content/          ← MT content processing
│   │   │   ├── dashboard/        ← Dashboard aggregation
│   │   │   ├── editions/         ← Edition management
│   │   │   ├── keys/             ← API key management
│   │   │   ├── notifications/    ← Notifications CRUD
│   │   │   ├── profile/          ← User profiles + settings
│   │   │   ├── stacks/           ← Stack CRUD + social actions
│   │   │   └── v1/               ← Public API (stub)
│   │   ├── admin/                ← Admin panel (mostly mocked)
│   │   ├── dashboard/            ← User dashboard
│   │   ├── explore/              ← Discovery page
│   │   ├── login/ register/      ← Auth pages
│   │   ├── profile/[username]/   ← Public profile
│   │   ├── search/               ← Search page (stub)
│   │   ├── settings/             ← User settings
│   │   ├── stacks/[slug]/        ← Stack detail + editions
│   │   └── upload/               ← Stack creation wizard
│   ├── components/
│   │   ├── layout/               ← Navbar, Footer, MobileNav
│   │   ├── providers/            ← SessionProvider
│   │   └── ui/                   ← Cards, graphs, user widgets
│   ├── lib/
│   │   ├── data.ts               ← MOCK DATA (not real DB)
│   │   ├── mt-transform.ts       ← Content transformation
│   │   ├── prisma.ts             ← Prisma singleton
│   │   └── utils.ts              ← Utility functions
│   ├── middleware.ts              ← Route protection
│   └── auth.ts                   ← NextAuth config
```

---

## PHASE 2 — EXISTING FEATURES (DETAILED)

### 2.1 Authentication System
**Status: Partially Functional**

| Feature | Status | Notes |
|---|---|---|
| Email/password registration | ✅ Working | `POST /api/auth/register` |
| Login via credentials | ✅ Working | NextAuth Credentials provider |
| JWT session strategy | ✅ Working | |
| Route protection (middleware) | ✅ Working | 5 routes protected |
| Logout | ✅ Working | NextAuth signOut |
| OAuth (Google, GitHub) | ❌ Missing | No OAuth providers configured |
| Email verification | ❌ Missing | `emailVerified` field exists but unused |
| Password reset | ❌ Missing | No forgot-password flow |
| Role-based access control | ⚠️ Partial | `role` enum exists, not enforced in middleware |
| Admin route protection | ❌ Missing | `/admin` is in protected list but no admin check |
| Session refresh | ⚠️ Partial | `updateSession()` called on profile save |

**Critical Issue:** The `/admin` route is protected by login but NOT by role. Any authenticated user can access admin features.

### 2.2 User Profiles
**Status: Mostly Functional**

| Feature | Status | Notes |
|---|---|---|
| View public profile | ✅ Working | `GET /api/profile/[username]` |
| Edit profile (name, bio, etc.) | ✅ Working | `PATCH /api/profile/settings` |
| Follow/unfollow users | ✅ Working | `POST /api/profile/[username]/follow` |
| Follower/following counts | ✅ Working | |
| Avatar display | ✅ Working | Via URL field |
| Avatar upload | ❌ Missing | No file upload, only URL |
| Banner image | ❌ Missing | Schema has `banner` field, no UI |
| Contribution graph | ⚠️ Mocked | Uses `totalViews` as proxy for real activity |
| Achievements/badges | ❌ Missing | In mock data, no schema support |
| Academic credentials | ⚠️ Basic | Only `university`, `department`, `level` text fields |
| Subject expertise tags | ❌ Missing | |
| Social links (Twitter, LinkedIn) | ❌ Missing | Only `website` field |

### 2.3 Stack System
**Status: Core Functional, Many Gaps**

| Feature | Status | Notes |
|---|---|---|
| Create stack (metadata only) | ✅ Working | `/upload` wizard → `POST /api/stacks` |
| View stack detail page | ✅ Working | `/stacks/[slug]` |
| Edit stack metadata | ❌ Missing | No edit endpoint or UI |
| Delete stack | ❌ Missing | No delete endpoint |
| Star/unstar stack | ✅ Working | `POST /api/stacks/[slug]/star` + notification |
| Fork stack | ⚠️ Partial | Records fork relationship, does NOT copy stack content |
| Bookmark/unbookmark | ✅ Working | `POST /api/stacks/[slug]/bookmark` |
| Stack visibility (public/private) | ⚠️ Partial | Flag exists, private stacks not enforced on GET |
| Paid stacks | ❌ Missing | No schema, no payment integration |
| File upload to stack | ❌ Missing | Upload wizard creates metadata ONLY, no actual files |
| File viewing/preview | ❌ Missing | No file viewer |
| File downloading | ❌ Missing | Download button is a dead stub |
| Share stack | ⚠️ Partial | Copies URL to clipboard only |
| Transfer ownership | ❌ Missing | |
| Collaborator management | ❌ Missing | |
| README editing | ❌ Missing | README displayed if set, no editor |
| View count increment | ✅ Working | Fire-and-forget on GET |
| Search stacks | ⚠️ Basic | SQL LIKE search only |
| Filter by department | ✅ Working | |
| Sort by stars/views/recent | ✅ Working | |
| Pagination | ✅ Working | 20 per page |

### 2.4 Editions System
**Status: Partially Functional**

| Feature | Status | Notes |
|---|---|---|
| Create edition (snapshot) | ✅ Working | `POST /api/editions` |
| Auto-version on content upload | ✅ Working | `POST /api/content` auto-creates edition |
| List editions | ✅ Working | `GET /api/editions?stackId=` |
| View edition history page | ⚠️ Partial | `/stacks/[slug]/editions` page exists, needs reading |
| Edition diff/comparison | ❌ Missing | |
| Rollback to edition | ❌ Missing | |
| Edition changelog display | ⚠️ Partial | Changelog stored but minimal UI |
| MT content processing | ✅ Working | Text → structured sections, concepts, summary |
| Binary file processing | ❌ Missing | PDF/DOCX/PPTX parsing not implemented |

### 2.5 Module System
**Status: Basic**

| Feature | Status | Notes |
|---|---|---|
| Create modules during stack creation | ✅ Working | |
| View module list | ✅ Working | |
| Module types (lecture/assignment/etc.) | ✅ Working | |
| Add/edit modules after creation | ❌ Missing | |
| Files per module | ❌ Missing | `files` count field, no actual file storage |
| Module duration | ⚠️ Manual | Text field, not computed |
| Module reordering | ❌ Missing | |
| Module content viewer | ❌ Missing | |

### 2.6 Discussions System
**Status: Partially Functional**

| Feature | Status | Notes |
|---|---|---|
| View discussions list | ✅ Working | Via stack detail API |
| Create discussion | ❌ Missing | Button exists, no handler/modal |
| Reply to discussion | ❌ Missing | `POST /api/stacks/[slug]/discussions/[id]` exists but unverified |
| Resolve discussion | ❌ Missing | `resolved` field exists, no toggle UI |
| Pin discussion | ❌ Missing | `isPinned` field exists, no UI |
| Delete discussion | ❌ Missing | |
| Discussion notifications | ❌ Missing | |

### 2.7 Contribution System
**Status: Schema Only**

| Feature | Status | Notes |
|---|---|---|
| Contribution model | ✅ Schema | `Contribution` table with status enum |
| Submit contribution | ❌ Missing | No API endpoint |
| Review contribution | ❌ Missing | No workflow |
| Approve/reject | ❌ Missing | |

### 2.8 Notifications System
**Status: Functional**

| Feature | Status | Notes |
|---|---|---|
| Star notification | ✅ Working | |
| Fork notification | ✅ Working | |
| Mark as read | ✅ Working | Bulk and individual |
| Follow notification | ❌ Missing | Not triggered in follow API |
| Comment notification | ❌ Missing | |
| Email notifications | ❌ Missing | |
| Real-time (WebSocket/SSE) | ❌ Missing | |
| Notification preferences | ⚠️ UI stub | Toggles render, not wired to backend |

### 2.9 Admin Panel
**Status: Almost Entirely Mocked**

| Feature | Status | Notes |
|---|---|---|
| Overview stats | ❌ Mocked | Hardcoded `PLATFORM_STATS` constants |
| Repository list | ❌ Mocked | Uses `MOCK_REPOSITORIES` from data.ts |
| User list | ❌ Mocked | Uses `MOCK_USERS` doubled array |
| Reports management | ❌ Stub | "Coming soon" placeholder |
| Analytics | ❌ Stub | "Coming soon" placeholder |
| Verify/unverify stack | ❌ Mocked | Button exists, no API |
| Suspend user | ❌ Mocked | Button exists, no API |
| Admin role enforcement | ❌ Missing | Any user can visit /admin |

### 2.10 API Keys
**Status: Functional**

| Feature | Status | Notes |
|---|---|---|
| Generate API key | ✅ Working | Cryptographically random `mnt_` prefixed |
| List keys (obfuscated) | ✅ Working | |
| Delete key | ✅ Working | |
| Use key in requests | ❌ Missing | `/api/v1/` endpoints don't validate Bearer tokens |
| Rate limiting per key | ❌ Missing | |
| Request count tracking | ⚠️ Partial | `requests` field, never incremented |

### 2.11 Public API (v1)
**Status: Stub**

| Feature | Status | Notes |
|---|---|---|
| `GET /api/v1/stacks` | ⚠️ Exists | Needs reading to verify |
| `POST /api/v1/stacks` | ⚠️ Exists | Needs API key auth |
| `GET /api/v1/profile` | ⚠️ Exists | Needs API key auth |
| Bearer token validation | ❌ Missing | No middleware for API key auth |

### 2.12 Search Page
**Status: Stub**

The file `/src/app/search/page.tsx` exists but was not fully read. Based on the explore page architecture, it is likely a skeleton or redirects to explore.

---

## PHASE 3 — BROKEN / DEAD CODE

| Location | Issue | Severity |
|---|---|---|
| `admin/page.tsx` | All data is from `MOCK_*` constants, not DB | Critical |
| `/stacks/[slug]/page.tsx` — Download button | Dead stub, no handler | High |
| `/stacks/[slug]/page.tsx` — New Discussion button | No modal or handler | High |
| `settings/page.tsx` — Change Password | Form has no submit handler connected | High |
| `settings/page.tsx` — Delete Account | Button exists, no API endpoint | High |
| `settings/page.tsx` — Notification toggles | Not wired to backend | Medium |
| `explore/page.tsx` — Contributors tab | Placeholder message | Medium |
| `explore/page.tsx` — Universities tab | Placeholder message | Medium |
| `ContributionGraph.tsx` | Uses `totalViews` not real contribution data | Medium |
| `StackFork` | Records fork relation but does NOT copy stack content | High |
| `Module.files` | Count field, never actually populated | Medium |
| `Module.duration` | Manual text, never computed | Low |
| `User.banner` | Schema field, no UI | Low |
| `LearningProgress` | Schema exists, no frontend or API | Medium |
| `ApiKey.requests` | Never incremented | Low |
| `/api/v1/` | No Bearer token authentication | High |

---

## PHASE 4 — MISSING FEATURES SUMMARY

### Must-Have for Launch
1. Actual file upload and storage (PDF, DOCX, PPTX, images, video)
2. File preview/viewer in browser
3. Stack editing (metadata + modules)
4. Stack deletion
5. Fork properly copies stack content
6. Discussion creation and replies
7. Admin role enforcement
8. Password reset flow
9. Email verification
10. Private stack access control enforcement

### Should-Have Shortly After Launch
1. OAuth (Google, GitHub)
2. Paid/premium stacks with payment processing
3. Real-time notifications
4. Edition diff viewer
5. Rollback to previous edition
6. Contributor invitation system
7. Proper full-text search (Meilisearch/Algolia/pg_trgm)
8. Avatar upload
9. Follow notifications
10. University/contributor discovery pages

### Nice-to-Have
1. AI-powered features (summaries, flashcards, concept maps)
2. Learning pathways / reading lists
3. Certification system
4. Quiz/exam builder
5. Citation manager
6. Highlights and annotations
7. Mobile app
8. Embeddable stack widgets

---

## PHASE 5 — PRODUCT READINESS ASSESSMENT

### What Would Break on Day 1
- **File uploads:** The core value proposition (uploading knowledge assets) doesn't work. The wizard creates metadata but cannot accept or store any files.
- **Admin panel:** Every number and every user is fake. If any admin action were taken it would fail silently.
- **Password reset:** Users who forget passwords are permanently locked out.
- **Forking:** Users who fork a stack get a relationship record but no actual content copy — deeply confusing.
- **Discussion creation:** Button exists but nothing happens when clicked.
- **Private stack enforcement:** Setting a stack to "private" doesn't protect it at the API level for all routes.

### What Would Confuse Users
- The "Download" button on modules does nothing
- Forking records the action but doesn't create a copy of the stack
- The contribution graph shows view counts, not actual contributions
- Statistics on the home page (48k stacks, 312k learners) are hardcoded lies
- The admin panel shows hardcoded data to anyone who is logged in
- "Contributors" on the explore page is an empty placeholder

### What Would Prevent Adoption
- No file uploads = no content
- No OAuth = high registration friction
- No email verification = spam risk
- No full-text search = content undiscoverable at scale

### What Would Prevent Monetization
- Zero payment infrastructure
- No paid stack model
- No creator payout system
- No subscription tiers
