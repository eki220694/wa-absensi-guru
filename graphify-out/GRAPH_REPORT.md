# Graph Report - wa-absensi-guru  (2026-07-31)

## Corpus Check
- 57 files · ~19,079 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 370 nodes · 461 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `391e917b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- telegram.ts
- sql
- scripts
- compilerOptions
- package.json
- seed.js
- WA Absensi Guru — Design Spec
- compilerOptions
- Verifikasi per file
- migrate.ts
- shared/package.json
- constants.ts
- Global Constraints
- layout.tsx
- next.config.js
- tailwind.config.ts
- shared/tsconfig.json
- next-auth.d.ts
- Report Agent 1 — Fix Absen Page + Guru Page
- absen/page.tsx
- jadwal/page.tsx
- guru/page.tsx
- next-env.d.ts
- DB Schema + Seed Check Report
- Agent 3 Report — Build Check + TypeScript Validation
- Bot Fix Report
- Telegram Webhook 500 Debug Report
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `sql()` - 44 edges
2. `setup()` - 21 edges
3. `authOptions` - 15 edges
4. `compilerOptions` - 13 edges
5. `Global Constraints` - 12 edges
6. `compilerOptions` - 11 edges
7. `WA Absensi Guru — Design Spec` - 11 edges
8. `Agent 3 Report — Build Check + TypeScript Validation` - 9 edges
9. `guruByTelegram()` - 8 edges
10. `wita()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --calls--> `hitungJarak()`  [EXTRACTED]
  web/src/lib/telegram.ts → shared/src/utils.ts
- `GET()` --calls--> `sql()`  [EXTRACTED]
  web/src/app/api/cron/reminder/route.ts → web/src/lib/db.ts
- `GET()` --calls--> `sql()`  [EXTRACTED]
  web/src/app/api/export/excel/route.ts → web/src/lib/db.ts
- `GET()` --calls--> `sql()`  [EXTRACTED]
  web/src/app/api/export/pdf/route.ts → web/src/lib/db.ts
- `PATCH()` --calls--> `sql()`  [EXTRACTED]
  web/src/app/api/guru/[id]/route.ts → web/src/lib/db.ts

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (43): autoprefixer, bcryptjs, exceljs, grammy, iconv-lite, @neondatabase/serverless, next, next-auth (+35 more)

### Community 1 - "telegram.ts"
Cohesion: 0.20
Nodes (23): hitungJarak(), POST(), cmdAbsen(), cmdCek(), cmdDaftar(), cmdHelp(), cmdIzin(), cmdJadwal() (+15 more)

### Community 2 - "sql"
Cohesion: 0.13
Nodes (21): GET(), getWitaDate(), handler, GET(), GET(), GET(), DELETE(), PATCH() (+13 more)

### Community 3 - "scripts"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, db:migrate, db:seed, dev, start (+1 more)

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (23): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+15 more)

### Community 5 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, typescript, typescript, name, private, scripts, db:migrate, db:seed (+5 more)

### Community 6 - "seed.js"
Cohesion: 0.13
Nodes (15): db, getKelasId, getMapelId, guru, insertGuru, insertJadwal, insertKelas, insertMapel (+7 more)

### Community 7 - "WA Absensi Guru — Design Spec"
Cohesion: 0.07
Nodes (28): 1. Absen Per Jam Mengajar (Manual Trigger), 2. Izin / Sakit / Cuti / Dinas Luar, 3. Dashboard Admin Web, 4. Export, Alur Absen, Alur Bot WhatsApp, Alur Izin, Arsitektur (+20 more)

### Community 8 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noUncheckedIndexedAccess (+5 more)

### Community 9 - "Verifikasi per file"
Cohesion: 0.18
Nodes (10): Agent 2 — TypeScript Check Report, `api/jadwal/[id]/route.ts`, `api/jadwal/route.ts`, `api/pengaturan/route.ts`, Files Checked, `jadwal/page.tsx`, `pengaturan/page.tsx`, Summary (+2 more)

### Community 11 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, main, name, private, type, types, version

### Community 12 - "constants.ts"
Cohesion: 0.11
Nodes (14): HARI, JAM_JUMAT, JAM_SENIN_KAMIS, JENIS_IZIN, TODO: update koordinat asli SMAN 6 SIGI, SEKOLAH, STATUS_ABSEN, STATUS_IZIN (+6 more)

### Community 13 - "Global Constraints"
Cohesion: 0.13
Nodes (14): Global Constraints, Missing in MVP (Future), Task 10: Bottom Navigation + Deploy Checklist, Task 11: Final Configuration & Verification, Task 1: Monorepo Root + Shared Package + DB Schema, Task 2: Bot Connection + Auth Middleware, Task 3: GPS + OCR Services, Task 4: Message Handler + Absen Flow (+6 more)

### Community 14 - "layout.tsx"
Cohesion: 0.29
Nodes (3): metadata, AuthProvider(), navLinks

### Community 20 - "shared/tsconfig.json"
Cohesion: 0.29
Nodes (6): src, compilerOptions, outDir, extends, include, ../tsconfig.base.json

### Community 21 - "next-auth.d.ts"
Cohesion: 0.33
Nodes (5): JWT, next-auth, next-auth/jwt, Session, User

### Community 22 - "Report Agent 1 — Fix Absen Page + Guru Page"
Cohesion: 0.40
Nodes (4): File-by-File Analysis, Report Agent 1 — Fix Absen Page + Guru Page, Summary, TypeScript Check Result

### Community 28 - "DB Schema + Seed Check Report"
Cohesion: 0.17
Nodes (11): 1. `guru` Table Schema, 2. `guru` Seed Data, 3. `bot_session` Table, 4. `config` Table, 5. Other Tables (schema only), 6. Summary & Action Items, `absen`, DB Schema + Seed Check Report (+3 more)

### Community 29 - "Agent 3 Report — Build Check + TypeScript Validation"
Cohesion: 0.17
Nodes (11): Agent 3 Report — Build Check + TypeScript Validation, API Routes Verified, Build Check (`npm run build`), Bundle Size (First Load JS), Fix Applied, `iconv-lite` missing dari monorepo root, Kesimpulan, Pages Verified (+3 more)

### Community 30 - "Bot Fix Report"
Cohesion: 0.20
Nodes (9): 1. Added `b.filter()` handler (line ~197), 2. Removed keyboard button checks from `b.on(':text')`, 3. Wrapped `loadSession` in try/catch, Bot Fix Report, Changes Made, Deployment Note, Results, Root Cause (+1 more)

### Community 31 - "Telegram Webhook 500 Debug Report"
Cohesion: 0.25
Nodes (7): 1. `web/src/lib/telegram.ts`, 2. `web/src/app/api/telegram/route.ts`, Fixes Applied, Key Learnings, Root Cause, Telegram Webhook 500 Debug Report, Test Results

## Knowledge Gaps
- **194 isolated node(s):** `name`, `private`, `shared`, `web`, `web:dev` (+189 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sql()` connect `sql` to `telegram.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `setup()` (e.g. with `cmdAbsen()` and `cmdCek()`) actually correct?**
  _`setup()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `shared` to the rest of the system?**
  _194 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `sql` be split into smaller, more focused modules?**
  _Cohesion score 0.1337126600284495 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._