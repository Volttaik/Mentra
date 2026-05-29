# MENTRA — UX / UI AUDIT REVIEW

**Date:** May 29, 2026  
**Scope:** All pages, components, mobile/tablet/desktop responsiveness

---

## DESIGN SYSTEM ASSESSMENT

### Strengths
- Consistent Material Design 3-inspired token system (primary, secondary, surface variants)
- Custom `Manrope` font creates strong brand identity
- Framer Motion animations are smooth and purposeful
- Card hierarchy (`card`, `card-sm`) is well-established
- Tag components (`tag`, `tag-accent`) are consistently used
- Tailwind utility classes are well-organized

### Weaknesses
- No dark mode support
- No design token documentation
- Custom CSS classes (`card`, `btn-primary`, `input-field`) are defined in `globals.css` but not documented
- Color palette relies on custom Tailwind tokens that aren't in the standard palette — potential maintainability issue
- No accessible color contrast audit performed

---

## PAGE-BY-PAGE REVIEW

---

### PAGE 1: Home / Landing (`/`)
**Purpose:** Marketing, conversion to registration  
**Current State:** High quality, visually impressive

**Strengths:**
- Animated rotating headline creates immediate engagement
- Image mosaic with hover effects is visually strong
- Stats section builds credibility
- 3-step "How it works" section is clear
- Feature grid is scannable
- Infinite marquee of academic images adds life

**Issues:**
- Stats (48k stacks, 312k learners) are **hardcoded lies** — will destroy trust when users see the actual empty platform
- No social proof with real users yet
- CTA "Start for free" implies a paid tier exists — needs pricing context
- Landing page is `"use client"` — should be server component for SEO/performance
- The "AI-powered insights" feature is listed but doesn't exist
- No footer testimonials or university logos section visible in the page

**Recommendations:**
1. Replace hardcoded stats with real DB counts (or "Be an early adopter" messaging)
2. Convert to Server Component with selective client hydration
3. Add a demo video or animated GIF of the product in action
4. Add a "Trusted by early users at:" university logos row
5. Update feature list to only show features that actually exist

---

### PAGE 2: Register (`/register`)
**Purpose:** User onboarding  
**Current State:** Not read in detail but referenced throughout codebase

**Known Issues:**
- No email verification after registration
- No CAPTCHA / bot protection
- Password strength indicator likely missing
- No terms of service checkbox

**Recommendations:**
1. Add password strength meter
2. Add terms of service / privacy policy acknowledgment
3. Implement CAPTCHA (hCaptcha recommended)
4. After registration, trigger email verification flow
5. Add Google/GitHub OAuth buttons

---

### PAGE 3: Login (`/login`)
**Purpose:** Authentication  
**Current State:** Standard credentials form

**Known Issues:**
- No "Forgot password" link visible
- No OAuth sign-in options
- No "Remember me" option

**Recommendations:**
1. Add "Forgot password?" link prominently
2. Add OAuth options (Google, GitHub)
3. "Remember me" checkbox

---

### PAGE 4: Dashboard (`/dashboard`)
**Purpose:** User home base  
**Current State:** Functional, well-designed

**Strengths:**
- Time-of-day greeting is a nice personal touch
- Stats grid (stacks, stars, views, followers) is informative
- Notification panel with read/unread state is well done
- Empty states are excellent (BookOpen icon + encouraging copy)
- Quick actions panel is helpful

**Issues:**
- Contribution graph uses `totalViews` instead of real contribution data — misleading
- "Your stacks" only shows 5 stacks with no "see all" pagination
- Bookmarks limited to 4 with no "see all"
- No recent activity feed from followed users
- No trending/recommended stacks section
- "Explore all" link goes to explore page, not user's full stack list

**Recommendations:**
1. Replace contribution graph data source with real contribution/upload events
2. Add "See all stacks" link to full paginated list
3. Add "Recent activity" feed (forks, stars received, new followers)
4. Add "Recommended for you" section based on user's interests
5. Mobile: bottom navigation bar for quick access (Upload, Explore, Profile, Notifications)

---

### PAGE 5: Explore (`/explore`)
**Purpose:** Content discovery  
**Current State:** Functional for basic browsing, placeholders for key tabs

**Strengths:**
- Search with debounce (400ms) is smooth
- Skeleton loading states are well done
- Filter sidebar + sort options work
- Infinite "load more" pagination

**Issues:**
- "Contributors" tab is an empty placeholder — disappoints users who click it
- "Universities" tab is an empty placeholder
- Department filter is hardcoded (8 options) — doesn't reflect real data
- Sort option "Newest" maps to `updatedAt` — should differentiate between "Recently Updated" and "Newly Created"
- "Trending" sort uses `createdAt` desc — this is identical to "Newest", not trending
- No university filter in sidebar
- No "Verified only" filter
- No date range filter
- Mobile: filter sidebar disappears, no filter drawer/modal

**Recommendations:**
1. Implement Contributors tab with real user directory API
2. Implement Universities tab with aggregated stack counts
3. Load department list from DB (distinct values)
4. Fix trending algorithm: `views * 0.4 + stars * 0.4 + forks * 0.2` weighted by recency
5. Add "Verified only" toggle
6. Add university search filter
7. Mobile: "Filter" button that opens a bottom drawer

---

### PAGE 6: Stack Detail (`/stacks/[slug]`)
**Purpose:** View and interact with a stack  
**Current State:** Good layout, several dead interactions

**Strengths:**
- Header with verified badge, tags, stats, and actions is well-organized
- Star/bookmark/fork with optimistic UI is excellent UX
- Tab navigation (Overview/Modules/Discussions/Contributors) is clean
- README fallback auto-generated from stack data is smart
- Module list with type icons is clear

**Critical Dead Interactions:**
- **Download button** — visual only, no action
- **New Discussion button** — no modal, no form, no handler
- **Module chevron/click** — no navigation to module detail

**Issues:**
- Module files count is always 0 (never populated)
- Discussions rendered as cards but clicking them does nothing
- "Contributors" tab shows users who forked, not collaborators (misleading)
- No way to edit stack if you are the owner
- Share button only copies URL — no social sharing options
- README is plain text (`whitespace-pre-wrap`), not Markdown rendered

**Recommendations:**
1. Add owner action bar: "Edit Stack", "Add Files", "New Edition" buttons visible to owner
2. Implement discussion creation modal
3. Implement discussion detail view with replies
4. Render README as actual Markdown (use `react-markdown`)
5. Fix Download: implement signed URL download for files
6. Add "Related stacks" sidebar section
7. Module items should be clickable and navigate to a module detail page

---

### PAGE 7: Upload / Create Stack (`/upload`)
**Purpose:** Stack creation wizard  
**Current State:** Good UX flow, fundamental gap

**Strengths:**
- 4-step wizard with progress indicator is clear
- Content type selection with icons is engaging
- Tag management with keyboard support is polished
- Module creation with type select is well done
- Review step before publish builds confidence

**Critical Issue:**
- **The wizard creates metadata ONLY.** Users expect to upload files immediately. After creating the stack, there is zero way to add actual files. This is the single biggest product gap.

**Issues:**
- Content type selection (lecture/video/bundle/live) has no backend effect — all stacks are identical regardless of type
- No file drop zone anywhere in the wizard
- "University" field not pre-filled from user profile (partially works via `session.user.university`)
- No ability to add a cover image
- No license selection
- Tags are created but not validated for length/format

**Recommendations:**
1. Add file upload step to the wizard (Step 3.5: "Upload files")
2. Pre-fill all user profile fields
3. Add cover image upload
4. Add license selection (CC BY, CC BY-SA, All Rights Reserved, etc.)
5. Add drag-and-drop zone supporting PDF/DOCX/PPTX/images

---

### PAGE 8: Profile (`/profile/[username]`)
**Purpose:** Public user profile  
**Current State:** Well-designed, data-rich

**Strengths:**
- Stack grid, starred stacks, and contributed stacks tabs are valuable
- Follow button with count is clear
- Academic metadata (university, department, level) displayed

**Issues:**
- No avatar upload UI
- No banner image UI
- Contribution graph is misleading (view counts)
- "Contributed stacks" shows stacks the user forked, not actual contributions
- No followers/following list modal
- No social links (Twitter, LinkedIn, ORCID)
- No achievements/badges section
- No "Send message" / contact option

**Recommendations:**
1. Add avatar upload (click avatar to upload)
2. Add banner image support
3. Add social links section
4. Add achievements/badges display
5. Followers/following clickable to show list modal
6. "Contributed stacks" should show actual approved contributions

---

### PAGE 9: Settings (`/settings`)
**Purpose:** Account management  
**Current State:** Profile tab works; other tabs are mostly stubs

**Profile Tab:** Working  
**API Keys Tab:** Working (with the plaintext security issue)  
**Notifications Tab:** UI renders but settings are never saved  
**Security Tab:** Change password form exists but has no submit handler; Delete account has no API

**Issues:**
- No avatar/image upload in profile settings
- No username change option
- No email change flow (with verification)
- Change password silently does nothing
- Delete account silently does nothing (GDPR compliance issue)
- Notification preferences never persisted

**Recommendations:**
1. Wire up Change Password: `PATCH /api/auth/password`
2. Wire up Delete Account: `DELETE /api/user` with confirmation modal
3. Wire up notification preferences to a new DB column/table
4. Add avatar upload
5. Add email change flow with verification

---

### PAGE 10: Admin Panel (`/admin`)
**Purpose:** Platform moderation and management  
**Current State:** Entirely mocked, no role protection

**Issues:**
- All statistics hardcoded
- User and repository lists use mock data
- Reports tab is a "Coming soon" placeholder
- Analytics tab is a "Coming soon" placeholder
- No admin role enforcement
- Action buttons (Verify, Suspend, Remove) have no API calls

**Recommendations:**
1. Add role guard at middleware level
2. Replace mock stats with real aggregation queries
3. Replace mock tables with real DB queries
4. Implement stack verification API
5. Implement user suspension API
6. Build content reporting system

---

### PAGE 11: Editions History (`/stacks/[slug]/editions`)
**Purpose:** Version history view  
**Current State:** Page exists but not read in detail during audit

**Expected Issues Based on API:**
- Lists editions with version numbers and changelogs
- No way to view the contents of a past edition
- No diff comparison
- No rollback action

**Recommendations:**
1. Show edition snapshot content (metadata + module list)
2. Allow "Restore this edition" for stack owners
3. Show who made each edition

---

## MOBILE / RESPONSIVE AUDIT

| Page | Mobile Status | Issues |
|---|---|---|
| Home | ✅ Good | Image mosaic hides correctly |
| Dashboard | ⚠️ Acceptable | Stats grid wraps to 2 columns, some crowding |
| Explore | ❌ Poor | Filters sidebar hidden with no alternative |
| Stack Detail | ⚠️ Acceptable | Tab bar scrolls horizontally |
| Upload Wizard | ✅ Good | Single column works well |
| Profile | ⚠️ Acceptable | |
| Settings | ⚠️ Acceptable | Tab nav scrolls horizontally |
| Navbar | ✅ Has MobileNav component | |

### Global Mobile Issues
1. No bottom navigation bar for core actions
2. Explore filters have no mobile-accessible drawer
3. No PWA manifest for "Add to Home Screen"
4. Images load slowly — no `sizes` attribute on many Image components

---

## ACCESSIBILITY AUDIT

| Issue | Pages Affected | Severity |
|---|---|---|
| Buttons without `aria-label` (icon-only) | Stack detail, Dashboard | High |
| No skip-to-content link | All pages | Medium |
| Form inputs missing associated `<label>` in some cases | Login, Register | High |
| Contrast ratio unverified for custom palette | All pages | Medium |
| Focus ring styles not clearly visible | All interactive elements | Medium |
| No `alt` text on some images | Home marquee (alt="Academic life" is generic) | Low |
| Modal/dialog not using proper ARIA roles | Dialogs to be built | Medium |

---

## SUMMARY RECOMMENDATIONS

### Quick Wins (< 1 day each)
1. Fix admin role check in middleware
2. Mark hardcoded stats on homepage with "early access" framing
3. Render README as Markdown
4. Fix trending sort algorithm
5. Add aria-labels to icon-only buttons

### Medium Effort (1 week)
1. Add file upload to stack wizard
2. Implement discussion creation modal
3. Add mobile filter drawer to explore page
4. Wire up change password and delete account
5. Fix contribution graph data source

### Major Effort (2-4 weeks)
1. PDF/file viewer component
2. Full module detail pages
3. Edition diff viewer
4. Avatar/banner upload
5. Dark mode support
