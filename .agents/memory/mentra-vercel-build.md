---
name: Mentra Vercel build fixes
description: Hard build errors found and fixed when preparing Mentra for Vercel deployment
---

## Rule
Any page using `useSearchParams()` must have the hook inside a named inner component, and the exported default must wrap that component in `<Suspense>`.

**Why:** Next.js 14 App Router makes `useSearchParams` without a Suspense boundary a hard build-time error (not just a warning). It passes in `next dev` but fails `next build` on Vercel.

**How to apply:** Pattern used across Mentra:
```tsx
function PageInner() {
  const searchParams = useSearchParams(); // safe here
  // ...
}
export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <PageInner />
    </Suspense>
  );
}
```

## Additional confirmed issues for this project
- `import Groq from "groq-sdk"` at module level causes SIGBUS on Replit — must use `require("groq-sdk")` inside the function (lazy init). On Vercel native binaries work, but lazy pattern is still safe.
- `build` script is `prisma generate && next build` — Prisma client is regenerated before every Vercel build. Do not change this.
- `eslint.ignoreDuringBuilds: true` in next.config.mjs — ESLint errors won't block Vercel builds.
- `next build` times out on Replit hardware (>110s) — use `pnpm exec tsc --noEmit` for type checking locally; trust Vercel for the real build.

## Files fixed (for reference)
- login/page.tsx — already correct before this session
- agents/[id]/chat/page.tsx — removed unused useSearchParams import, added Suspense wrapper
- editor/page.tsx — EditorInner + Suspense wrapper
- pdf-view/[fileId]/page.tsx — PdfViewInner + Suspense wrapper
- api/stacks/[slug]/quiz/route.ts — fixed top-level Groq import to lazy require()
