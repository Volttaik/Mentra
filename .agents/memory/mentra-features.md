---
name: Mentra four-feature build
description: Architecture decisions for Stack Flows, Communities, Personal AI Agent, and WhatsApp Gateway features
---

## Stack Flows
- Private personal stack collections: `/api/flows` (GET/POST), `/api/flows/[id]` (GET/PATCH/DELETE), `/api/flows/[id]/stacks` (POST/DELETE)
- Dashboard section with inline creation (name + default emoji 📚)
- Flow detail page at `/flows/[id]` with drag-to-reorder stacks
- "Add to Flow" button on stack detail pages opens a modal

## Stack Communities
- Discord-style collaborative spaces: `/api/communities` (GET/POST), `/api/communities/[slug]` (GET/PATCH/DELETE)
- Invite flow: POST `/api/communities/[slug]/invite` sends notification with `?inviteId=` query param
- Respond endpoint: `/api/communities/[slug]/invite/[inviteId]/respond` (POST {action: "accept"|"decline"})
- Community page detects `?inviteId` in URL and shows Accept/Decline banner for non-members
- Admin can remove members via DELETE `/api/communities/[slug]/members/[userId]`
- COMMUNITY_INVITE and COMMUNITY_JOIN notification types added to dashboard

## Personal AI Agent
- FloatingAgent FAB at bottom-right on all pages (added to layout.tsx)
- API at `/api/agent` uses Groq with lazy init (getGroq()) — never import groq at module top level
- Agent has platform context: user's stacks, flows, communities
- agentName stored in User model, editable in Settings > AI Agent tab

## WhatsApp Gateway
- `/connector` page — password gate (password: `liquid4*`), no auth required
- Config form POSTs to `/api/gateway/config`, status polling at `/api/gateway/status`
- Download endpoint `/api/gateway/download` returns JSZip of Baileys gateway code
- Webhook receiver at `/api/gateway/webhook`

**Why:** All four features needed clean separation of concerns — each has its own Prisma models, API routes, and UI pages. Community invite uses URL-embedded inviteId (not stored in session) to avoid extra state.
