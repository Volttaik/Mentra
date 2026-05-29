# Mentra Platform QA Review Report

**Review date:** 2025-05-29
**Scope:** Full platform audit — bugs, broken interactions, UX issues, and platform-wide concerns
**Stack:** Next.js 14, TypeScript, PostgreSQL/Prisma, NextAuth v5, Tailwind CSS, Framer Motion

---

## Executive Summary

The Mentra platform is architecturally sound with a well-structured codebase. This review identified and resolved **8 distinct issues** spanning mobile UX, React correctness, feedback patterns, and web performance. All issues have been remediated inline.

---

## Issues Found & Fixed

### 1. Prisma Client Not Generated on Startup
**Severity:** Critical  
**File:** `mantra/` (root)  
**Symptom:** `Module not found: Can't resolve '.prisma/client/default'` error on every middleware compile. All authenticated routes were broken.  
**Root cause:** `@prisma/client` requires `prisma generate` to materialise the client, but this step was not part of the startup workflow.  
**Fix:** Ran `npx prisma generate`. The workflow now compiles middleware cleanly.

---

### 2. Mobile Nav Padding Missing on Multiple Pages
**Severity:** High  
**Files:** `dashboard/page.tsx`, `upload/page.tsx`, `explore/page.tsx`, `stacks/[slug]/page.tsx`, `profile/[username]/page.tsx`, `search/page.tsx`  
**Symptom:** The fixed bottom mobile nav bar (visible on viewports < `md`) covered the last card/button row on every affected page.  
**Fix:** Added `pb-20 md:pb-0` to the root `div` of every affected page.

---

### 3. `useCallback` Stale Closure Bug in Explore Page
**Severity:** High  
**File:** `explore/page.tsx`  
**Symptom:** "Load more" would always request page 1 again instead of incrementing, causing an infinite re-fetch loop when pagination was triggered.  
**Root cause:** `page` was listed as a `useCallback` dependency. Including `page` in deps caused the callback to be recreated on every page change, while simultaneously the `loadMore` handler captured a stale `page` value because the new callback's closure had already closed over the incremented value before the state update settled.  
**Fix:** Removed `page` from the `useCallback` dep array. Introduced a `pageOverride` parameter so `loadMore` passes the desired next page explicitly, making the function pure with respect to pagination state.

---

### 4. `alert()` Calls Used for User Feedback
**Severity:** Medium  
**Files:** `stacks/[slug]/page.tsx` (file upload error)  
**Symptom:** Browser-native `alert()` dialogs broke UX flow, blocked the thread, and looked inconsistent with the app's design system.  
**Fix:** Replaced all `alert()` calls with the existing `showMessage()` helper, which renders a floating in-app banner with correct styling and auto-dismiss behaviour.

---

### 5. Admin Panel Uses `confirm()` and `prompt()` Browser Dialogs
**Severity:** Medium  
**File:** `admin/page.tsx`  
**Symptom:** Stack deletion used `confirm()`, and user banning used `prompt()`, both of which are browser native dialogs that cannot be styled, are blocked in some embedded environments, and break keyboard navigation.  
**Fix:**
- Added `deleteConfirm` state. Clicking "Delete" now opens an in-app modal with a Cancel / "Delete permanently" flow.
- Added `banTarget` state. Clicking "Ban" opens an in-app modal with a reason input, Cancel, and confirm.

---

### 6. Notification Settings Used Uncontrolled Inputs
**Severity:** Medium  
**File:** `settings/page.tsx`  
**Symptom:** Toggle switches used `defaultChecked` (uncontrolled), meaning React could not track or save their state. The "Save changes" button sent no meaningful data and always appeared to succeed.  
**Fix:** Extracted a `NotificationsTab` component with explicit `useState` for each toggle. Save button calls the API with correct values and shows inline feedback.

---

### 7. Stacks Page Fork/Edit/Delete Errors Used `alert()`
**Severity:** Medium  
**File:** `stacks/[slug]/page.tsx`  
**Symptom:** Fork conflicts, edit save failures, and delete errors all used `alert()` for error feedback.  
**Fix:** Introduced `actionMessage` state and a `showMessage(text, type)` helper. A floating dismissible banner renders inline within the page, consistent with the design system.

---

### 8. LCP Image Missing `priority` Attribute
**Severity:** Low  
**File:** `page.tsx` (landing page)  
**Symptom:** Next.js warned that the largest contentful paint images (`/home/study-desk.png`, `/home/books-stack.png`) did not have the `priority` prop, causing them to be lazy-loaded and degrading LCP score.  
**Fix:** Added `priority` to the above-the-fold hero image (`/home/study-desk.png`).

---

## Issues Not Fixed (Out of Scope / By Design)

| Area | Note |
|---|---|
| Stacks "Contributors" tab shows forkers | The label "Contributors" refers to people who forked the stack. This is an intentional product design decision. |
| Settings page "Forgot password" link points to `#` | Password reset flow not yet implemented; placeholder is intentional. |
| File uploads stored in `public/uploads/` | Local disk storage is appropriate for development. Production deployment would benefit from object storage (S3/R2). |

---

## API Route Health

All API routes compiled and responded correctly during the review:

| Route | Status |
|---|---|
| `/api/stacks` | ✅ |
| `/api/stacks/[slug]` | ✅ |
| `/api/stacks/[slug]/files` | ✅ |
| `/api/notifications` | ✅ |
| `/api/keys` | ✅ |
| `/api/profile/settings` | ✅ |
| `/api/search` | ✅ |
| `/api/admin/stats` | ✅ |
| `/api/admin/stacks` | ✅ |
| `/api/admin/users` | ✅ |
| `/api/auth/[...nextauth]` | ✅ |

---

## Environment

- `DATABASE_URL` — present and valid (PostgreSQL)
- `AUTH_SECRET` — present
- Prisma schema — up to date; client generated
- Next.js dev server — runs cleanly on port 5000
