---
name: Mentra theme system
description: ThemeApplier architecture, Mentra Studio settings tab, palette system, and tab URL handling
---

## Theme system architecture

ThemeApplier.tsx (client component, rendered in layout.tsx inside SessionProvider):
- Reads config from localStorage ("mentra-studio-config") and applies CSS custom property overrides to document.documentElement
- Syncs with /api/theme GET on auth, saves to DB via PUT
- MutationObserver watches for dark/light class toggle to reapply palette vars

6 palettes: parchment (default, no overrides), ocean, forest, lavender, rose, slate
3 styles: default, elevated (stronger shadows), flat (no shadows/border-based)
3 fonts: default, manrope, inter
3 radii: default, compact, rounded

**Why:** Uses CSS variables already defined in global CSS — palettes just override the secondary/surface variables without touching primary colors.

## Settings page tab URL handling

useSearchParams() requires Suspense in Next.js 14 app router. Instead, read URL params in a useEffect:
```tsx
const [tab, setTab] = useState("Profile");
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlTab = params.get("tab");
  if (urlTab) setTab(urlTab);
}, []);
```
This avoids the Suspense requirement while still reading ?tab= from the URL.

## Flow creation bug

POST /api/flows returns bare StackFlow (no _count/items). Fix when prepending to state:
```ts
setFlows(prev => [{ ...data, _count: { items: 0 }, items: [] }, ...prev])
```

## Community features (as of this session)
- profile field (String?) on Community model — shown in header, dashboard, communities list
- CommunityMessage model for chat — API at /api/communities/[slug]/chat
- Community page has mobile tab bar + chat panel (polls every 10s) + profile pic upload in settings
- /communities page (list) created at app/communities/page.tsx
- Community PATCH handler accepts profile field
