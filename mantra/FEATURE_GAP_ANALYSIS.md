# MENTRA — FEATURE GAP ANALYSIS

**Date:** May 29, 2026  
**Purpose:** Exhaustive comparison of existing vs. required features across all platform systems

---

## GAP SCORING LEGEND
- 🔴 **CRITICAL** — Blocks core user flow; must exist before any real users
- 🟠 **HIGH** — Significant UX degradation or trust issue
- 🟡 **MEDIUM** — Platform feels incomplete without this
- 🟢 **LOW** — Enhancement, not a blocker

---

## 1. AUTHENTICATION & IDENTITY

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Email/password registration | ✅ | — | Working |
| Username auto-generation on register | ✅ | — | Working |
| Login with credentials | ✅ | — | Working |
| JWT session | ✅ | — | Working |
| Logout | ✅ | — | Working |
| Route protection middleware | ✅ | — | 5 routes protected |
| Email verification | ❌ | 🔴 | No email provider, `emailVerified` unused |
| Password reset / forgot password | ❌ | 🔴 | Users permanently locked out |
| Google OAuth | ❌ | 🟠 | Major adoption friction |
| GitHub OAuth | ❌ | 🟡 | Nice for academic/dev users |
| Role enforcement in middleware | ❌ | 🔴 | Anyone can visit /admin |
| Account deletion (API) | ❌ | 🟠 | GDPR concern, UI exists with no backend |
| Password change (API) | ❌ | 🟠 | Form exists with no submit handler |
| Institutional SSO (SAML) | ❌ | 🟢 | Long-term for university integrations |
| Two-factor authentication | ❌ | 🟡 | Important for educators |
| Session listing / revocation | ❌ | 🟡 | |

---

## 2. USER PROFILES

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Public profile page | ✅ | — | Working |
| Edit name, bio, university, dept | ✅ | — | Working |
| Website field | ✅ | — | Working |
| Location field | ✅ | — | Working |
| Academic level (Undergrad/PhD/etc.) | ✅ | — | Working |
| Avatar display (from URL) | ✅ | — | Working |
| Avatar upload (image file) | ❌ | 🟠 | Schema has `image` but no upload |
| Banner image upload | ❌ | 🟡 | Schema has `banner`, no UI |
| Follow / unfollow user | ✅ | — | Working |
| Followers / following lists | ❌ | 🟡 | Counts shown, no list UI |
| Contribution activity graph (real) | ❌ | 🟡 | Currently faked with view count |
| Achievements / badges | ❌ | 🟡 | In mock data, no schema |
| Subject expertise tags | ❌ | 🟡 | |
| LinkedIn / Twitter / ORCID links | ❌ | 🟡 | Only `website` field |
| Email privacy settings | ❌ | 🟠 | Email currently exposed in DB |
| Verified educator badge | ⚠️ | — | `isVerified` field, no flow to earn it |
| Institution verification | ❌ | 🟡 | |
| Starred stacks on profile | ✅ | — | Working |
| Contributed-to stacks on profile | ✅ | — | Shown via forks |

---

## 3. STACK SYSTEM

### 3a. Creation
| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| 4-step creation wizard | ✅ | — | Working |
| Title, description, course code | ✅ | — | Working |
| Department, university, semester | ✅ | — | Working |
| Content type selection | ✅ | — | UI step, no backend effect |
| Tag management | ✅ | — | Working |
| Module creation at init | ✅ | — | Working |
| Public/private toggle | ✅ | — | Stored, not enforced |
| Cover image | ❌ | 🟡 | |
| License selection | ❌ | 🟡 | |
| Language/format field | ✅ | — | "language" field (PDF/Video/Live) |
| Institution-only visibility | ❌ | 🟡 | Only public/private |
| Paid stack configuration | ❌ | 🔴 | No payment system |

### 3b. Editing
| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Edit stack metadata | ❌ | 🔴 | No PATCH endpoint for stack |
| Edit README | ❌ | 🔴 | README displayed but not editable |
| Add/remove modules post-creation | ❌ | 🔴 | No module CRUD endpoints |
| Reorder modules | ❌ | 🟠 | |
| Archive/unarchive stack | ❌ | 🟡 | |
| Delete stack | ❌ | 🔴 | No DELETE endpoint |
| Transfer ownership | ❌ | 🟡 | |
| Rename stack (with redirect) | ❌ | 🟡 | |

### 3c. File Management
| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Upload PDF files | ❌ | 🔴 | No file storage integration |
| Upload DOCX files | ❌ | 🔴 | |
| Upload PPTX/slides | ❌ | 🔴 | |
| Upload images | ❌ | 🔴 | |
| Upload video files | ❌ | 🔴 | |
| Upload audio files | ❌ | 🔴 | |
| In-browser PDF viewer | ❌ | 🔴 | |
| In-browser video player | ❌ | 🔴 | |
| File download | ❌ | 🟠 | Button is dead stub |
| File organization within modules | ❌ | 🔴 | `files` is just a count |
| File deletion | ❌ | 🟠 | |
| File size limits | ❌ | 🟠 | |
| Text content upload (MT format) | ✅ | — | Working via `/api/content` |

### 3d. Social Actions
| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Star / unstar | ✅ | — | Working with notification |
| Fork (relationship) | ✅ | — | Working |
| Fork (content copy) | ❌ | 🔴 | Does not copy content |
| Bookmark / unbookmark | ✅ | — | Working |
| Share (copy URL) | ✅ | — | Clipboard only |
| Share to social media | ❌ | 🟡 | |
| Report stack | ❌ | 🟡 | Reports table missing |
| Embed widget | ❌ | 🟢 | |

---

## 4. EDITIONS SYSTEM

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Create manual edition snapshot | ✅ | — | Working |
| Auto-edition on content upload | ✅ | — | Working |
| Semantic versioning (major.minor) | ✅ | — | Working |
| List editions | ✅ | — | Working |
| Edition history page | ⚠️ | — | Page exists at `/stacks/[slug]/editions` |
| Edition detail view (snapshot) | ❌ | 🟠 | Snapshot stored as JSON, no renderer |
| Side-by-side diff | ❌ | 🟡 | |
| Rollback to edition | ❌ | 🟠 | `snapshot` stored but no restore logic |
| Edition changelog display | ⚠️ | 🟡 | Stored, limited UI |
| Contributor per edition | ⚠️ | 🟡 | `editorId` stored, not linked to User |
| Subscribe to edition updates | ❌ | 🟢 | |
| Edition download (zip) | ❌ | 🟡 | |

---

## 5. DISCOVERY & SEARCH

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Full-text search (title/desc/code) | ⚠️ | 🟠 | SQL `LIKE` only, slow at scale |
| Search by tag | ⚠️ | 🟡 | Tag filter in SQL |
| Filter by department | ✅ | — | Working (hardcoded 8 options) |
| Sort by stars / views / recent | ✅ | — | Working |
| Pagination | ✅ | — | 20 per page |
| Trending algorithm | ❌ | 🟡 | Sort=trending maps to `createdAt` desc (wrong) |
| University directory | ❌ | 🟠 | Placeholder in explore |
| Contributor directory | ❌ | 🟠 | Placeholder in explore |
| Recommendations (personalized) | ❌ | 🟡 | |
| Related stacks | ❌ | 🟡 | |
| Full-text search in content | ❌ | 🟡 | `searchIndex` field stored, no FTS engine |
| Tag autocomplete | ❌ | 🟡 | |
| Advanced search (multi-filter) | ❌ | 🟡 | |
| Search by university | ❌ | 🟠 | Not in filter UI |
| Search suggestions | ❌ | 🟢 | |

---

## 6. COLLABORATION

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Contribution request submit | ❌ | 🔴 | Schema exists, no API |
| Contribution review (owner) | ❌ | 🔴 | |
| Approve/reject contribution | ❌ | 🔴 | |
| Collaborator invitations | ❌ | 🟠 | |
| Team/organization stacks | ❌ | 🟡 | No org model |
| Co-owner permissions | ❌ | 🟡 | |
| Discussion creation | ❌ | 🔴 | UI button is dead |
| Discussion replies | ❌ | 🔴 | API route exists, UI missing |
| Discussion resolve / close | ❌ | 🟠 | `resolved` field unused |
| Pin discussions | ❌ | 🟡 | |
| Real-time collaborative editing | ❌ | 🟢 | Long-term |

---

## 7. MONETIZATION

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Paid stack model | ❌ | 🔴 | No schema, no payments |
| One-time purchase | ❌ | 🔴 | |
| Subscription to creator | ❌ | 🔴 | |
| Free tier + premium unlock | ❌ | 🟠 | |
| Creator earnings dashboard | ❌ | 🔴 | |
| Stripe/payment integration | ❌ | 🔴 | |
| Payout system | ❌ | 🔴 | |
| Revenue analytics | ❌ | 🟠 | |
| Pricing tiers (per stack) | ❌ | 🔴 | |
| Promo codes / discounts | ❌ | 🟡 | |
| Institutional licensing | ❌ | 🟡 | |
| Platform commission | ❌ | 🟠 | Need policy + implementation |

---

## 8. EDUCATIONAL ECOSYSTEM

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Learning progress tracking | ⚠️ | 🟡 | Schema exists (`LearningProgress`), no UI/API |
| Module completion marking | ❌ | 🟡 | |
| Reading lists / playlists | ❌ | 🟡 | |
| Knowledge pathways | ❌ | 🟢 | |
| Quiz builder | ❌ | 🟡 | Module type "quiz" exists, no builder |
| Flashcard system | ❌ | 🟡 | Module type "flashcard" exists, no builder |
| AI-generated summaries | ⚠️ | 🟡 | MT transform generates summaries from text |
| AI flashcard generation | ❌ | 🟡 | |
| AI concept maps | ❌ | 🟢 | |
| In-doc annotations / highlights | ❌ | 🟢 | |
| Citation manager | ❌ | 🟢 | References extracted but no manager |
| Student notes on stacks | ❌ | 🟡 | |
| Certification on completion | ❌ | 🟢 | |
| Course enrollment | ❌ | 🟡 | |
| Live sessions / scheduling | ❌ | 🟡 | Module type "live" in UI, no backend |

---

## 9. ADMINISTRATION & MODERATION

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| Real admin dashboard with DB data | ❌ | 🔴 | All mocked |
| Verify/unverify stack | ❌ | 🔴 | Button has no API call |
| Suspend/ban user | ❌ | 🔴 | Button has no API call |
| Content reporting system | ❌ | 🔴 | No `Report` model |
| Report review workflow | ❌ | 🔴 | |
| Platform analytics | ❌ | 🟠 | Placeholder |
| Audit log | ❌ | 🟠 | |
| Bulk moderation actions | ❌ | 🟡 | |
| DMCA / takedown workflow | ❌ | 🟠 | |
| Email broadcast | ❌ | 🟡 | |

---

## 10. INFRASTRUCTURE & OPERATIONS

| Feature | Exists | Gap Level | Notes |
|---|---|---|---|
| File storage (S3/R2/Supabase) | ❌ | 🔴 | Nothing |
| CDN for assets | ❌ | 🟠 | |
| Full-text search engine | ❌ | 🟠 | |
| Email service (SendGrid/Resend) | ❌ | 🔴 | No transactional email |
| Payment processor (Stripe) | ❌ | 🔴 | |
| Error monitoring (Sentry) | ❌ | 🟠 | |
| Rate limiting on APIs | ❌ | 🟠 | |
| Input validation library (Zod) | ❌ | 🟠 | Manual checks only |
| Database connection pooling (PgBouncer) | ❌ | 🟡 | |
| Background jobs (queues) | ❌ | 🟡 | |
| Caching (Redis) | ❌ | 🟡 | |
| Analytics (Plausible/PostHog) | ❌ | 🟡 | |
| API rate limiting per key | ❌ | 🟠 | |
| Environment variable validation | ❌ | 🟡 | |
| Database backups | ❌ | 🟠 | |

---

## SUMMARY SCORECARD

| System | Completion % |
|---|---|
| Authentication | 45% |
| User Profiles | 55% |
| Stack Creation | 60% |
| Stack File Management | 0% |
| Stack Editing | 10% |
| Editions | 50% |
| Discovery & Search | 40% |
| Discussions | 20% |
| Contributions | 5% |
| Notifications | 50% |
| Monetization | 0% |
| Admin Panel | 5% |
| Educational Ecosystem | 10% |
| Infrastructure | 10% |
| **OVERALL** | **~28%** |
