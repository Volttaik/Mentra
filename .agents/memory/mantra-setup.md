---
name: Mantra platform setup
description: Key decisions and gotchas for the Mantra Next.js 15 project structure
---

## Project location
The Next.js app lives in `/home/runner/workspace/mantra/` (subdirectory, not root).

## Workflow command
```
cd mantra && npm run dev -- --port 5000
```
Port 5000 is required for Replit webview output type.

## Tech stack
- Next.js 15.3.2 with App Router
- TypeScript
- Tailwind CSS v3 (NOT v4) — postcss.config.mjs must use `tailwindcss: {}` not `@tailwindcss/postcss: {}`
- Framer Motion v11
- Zustand v5
- Lucide React icons
- Fonts: Manrope (headings) + Be Vietnam Pro (body) via Google Fonts in layout.tsx head

## Design tokens
Full design system lives in `tailwind.config.ts` — warm parchment palette keyed as `surface`, `surface-container-*`, `primary`, `secondary`, `on-primary` etc. matching DESIGN.md color system.

## Next.js 15 params fix
Dynamic route pages (`/repository/[slug]`, `/profile/[username]`) must use `use(params)` from React to unwrap the Promise:
```tsx
import { use } from "react";
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
```

## Mock data
All mock data (users, repos, tags, universities, stats) lives in `src/lib/data.ts`. No DB connected yet — Prisma schema can be added later.

**Why:** Replit free tier doesn't require DB for MVP; architecture is ready for Prisma/PostgreSQL addition.
