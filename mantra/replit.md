# Mantra — Collaborative Academic OS

## Overview
Mantra is "GitHub for academic knowledge" — a production-ready platform where students and professors create, evolve, and collaborate on educational repositories.

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v3 with custom Manrope/Be Vietnam Pro design system
- **Animations**: Framer Motion v11
- **Icons**: Lucide React
- **State**: React useState (Zustand ready)
- **ORM**: Prisma (schema ready, DB not yet connected)

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, repos, testimonials |
| `/explore` | Browse all repositories with filters |
| `/search` | Full-text search across repos, users, topics |
| `/dashboard` | User dashboard with contribution graph, stats |
| `/repository/[slug]` | Full repository page with tabs (Overview, Modules, Discussions, History) |
| `/profile/[username]` | User profile with contributions, achievements |
| `/login` | Sign in page |
| `/register` | Multi-step registration |
| `/upload` | 4-step repository creation wizard |
| `/settings` | Account settings (profile, notifications, security) |
| `/admin` | Platform admin panel |

## Dev server
```
cd mantra && npm run dev -- --port 5000
```

## User Preferences
- Warm minimalist aesthetic (parchment palette) per DESIGN.md
- Manrope for headings, Be Vietnam Pro for body text
- Dark/light mode architecture ready (class-based)
