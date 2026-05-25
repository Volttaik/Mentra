---
name: Mentra platform setup
description: Key decisions and gotchas for the Mentra Next.js 15 project structure
---

## Project location
The Next.js app lives in `/home/runner/workspace/mantra/` (folder name kept as mantra but brand is Mentra).

## Workflow command
```
cd mantra && npm run dev -- --port 5000
```

## Naming conventions
- Brand: "Mentra" (not Mantra)
- Content units: "stacks" / "stack" (not repositories / repository)
- Routes: `/stacks/[slug]` (was `/repository/[slug]`)

## Tech stack
- Next.js 15.3.2 App Router, TypeScript
- Tailwind CSS v3 (NOT v4) — postcss.config.mjs must use `tailwindcss: {}` not `@tailwindcss/postcss: {}`
- Framer Motion v11, Zustand v5, Lucide React
- Fonts: Manrope (headings) + Be Vietnam Pro (body) via Google Fonts in layout.tsx
- Prisma v6 + PostgreSQL (DATABASE_URL env already provisioned, schema pushed)
- next-auth v5 beta installed (not wired yet)

## Design tokens
Full design system in `tailwind.config.ts` — warm parchment palette: background #fef9f2, primary #140b05, secondary #735b25, secondary-container #fedb99.

## Homepage images
6 generated study images at `mantra/public/home/` — study-desk.png, books-stack.png, online-study.png, open-book-notes.png, students-collaborating.png, library-grand.png

## Next.js 15 params fix
Dynamic routes must use `use(params)` from React:
```tsx
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
```

## Database
Prisma schema at `mantra/prisma/schema.prisma` — full schema with User, Stack, Module, Tag, Discussion, Contribution, Follow, Notification models. Schema pushed to dev DB.

**Why:** Replit PostgreSQL was already provisioned; prisma db push synced the schema.
