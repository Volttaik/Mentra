---
name: Mentra AI features pattern
description: Groq lazy init, AI credits system, quiz + chat API routes and components
---

## Groq Initialization
- Must NOT use `const groq = new Groq(...)` at module level — crashes/errors when GROQ_API_KEY is missing at build time
- Always use a lazy factory: `function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" }); }`
- Call `getGroq()` inside request handlers only

**Why:** Next.js evaluates module-level code during `next build`, and Groq SDK throws if apiKey is missing, failing the build.

## Credits System
- `aiCredits Int @default(0)` on User model
- `CreditTransaction` model tracks usage/purchases
- Chat costs 1 credit/message, quiz generation costs 5 credits
- Purchase flow: POST /api/credits/purchase → Paystack authorizationUrl → POST /api/credits/verify

## Components
- `AiChatModal.tsx` — full-screen right slide-in panel, inspired by Webcon design
- `BuyCreditsModal.tsx` — 3-pack credit purchase via Paystack
- `QuizSection.tsx` — list + take + results flow, owner-only generation

## Stack Page Integration
- AI button in action sidebar (Star/Fork/AI Ask)
- AI Study Assistant card in right sidebar (replaces old "AI Tools Coming Soon" widget)
- Quiz tab added to TABS array
- Content Summary card removed
- Emojis replaced with lucide icons
