---
name: Next.js 14 on Replit - SWC SIGBUS + Babel fallback
description: SWC native binary crashes on Replit; full solution to make Next.js 14 run with Babel fallback
---

# Next.js 14 SWC crash on Replit

## The rule
The `@next/swc-linux-x64-gnu` and `@next/swc-linux-x64-musl` native `.node` binaries crash with SIGBUS (signal 135) on Replit's environment. Next.js must use Babel instead.

**Why:** Replit's CPU does not support the CPU instructions (likely AVX2) the SWC binary was compiled with.

## How to apply

1. **Rename the SWC binaries** so they can't load:
   ```
   mv node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node \
      node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node.bak
   mv node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node \
      node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node.bak
   ```

2. **Add postinstall script** in package.json to keep them disabled after every npm install:
   ```json
   "postinstall": "node -e \"const fs=require('fs');['node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node','node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node'].forEach(f=>{if(fs.existsSync(f)&&!fs.existsSync(f+'.bak'))fs.renameSync(f,f+'.bak')});\""
   ```

3. **Create `babel.config.js`** at the project root (NOT `.babelrc` — js format avoids a Next.js getBabelLoader bug):
   ```js
   module.exports = {
     presets: ["next/babel"],
     plugins: [
       ["@babel/plugin-transform-private-methods", { loose: true }],
       ["@babel/plugin-transform-class-properties", { loose: true }],
       ["@babel/plugin-transform-private-property-in-object", { loose: true }],
     ],
   };
   ```
   The private-methods plugins are needed for `oauth4webapi` (next-auth v5) and `@prisma/client` edge runtime.

4. **Install `@babel/runtime`** explicitly — it's not installed transitively in this setup:
   ```
   npm install @babel/runtime
   ```

5. **Patch `node_modules/next/dist/build/webpack-config.js`** line with `getBabelLoader`:
   Change `srcDir: _path.default.dirname(appDir || pagesDir),` to `srcDir: _path.default.dirname(appDir || pagesDir || dir),`
   This prevents crash when building fallback error overlay.

6. **Middleware must NOT import Prisma** — create `src/auth.config.ts` with only JWT callbacks and no Prisma imports; use that in `middleware.ts` with `NextAuth(authConfig)`. The full `auth.ts` with Credentials+Prisma stays separate.

## Project location
All code is in `mantra/` subdirectory. Run from `mantra/`, not project root.
