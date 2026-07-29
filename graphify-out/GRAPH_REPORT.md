# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 314 nodes · 412 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff10f450`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- absen.ts
- sql
- devDependencies
- compilerOptions
- scripts
- seed.js
- WA Absensi Guru — Design Spec
- compilerOptions
- bot/package.json
- bot/tsconfig.json
- shared/package.json
- constants.ts
- Global Constraints
- layout.tsx
- next.config.js
- tailwind.config.ts
- shared/tsconfig.json
- next-auth.d.ts

## God Nodes (most connected - your core abstractions)
1. `sql` - 24 edges
2. `authOptions` - 14 edges
3. `handleAbsen()` - 13 edges
4. `sql` - 13 edges
5. `compilerOptions` - 13 edges
6. `Global Constraints` - 12 edges
7. `WA Absensi Guru — Design Spec` - 11 edges
8. `compilerOptions` - 10 edges
9. `handleIzin()` - 9 edges
10. `messageHandler()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleAbsen()` --calls--> `sekarang()`  [EXTRACTED]
  bot/src/bot/handlers/absen.ts → shared/src/utils.ts
- `handleAbsen()` --calls--> `formatTanggal()`  [EXTRACTED]
  bot/src/bot/handlers/absen.ts → shared/src/utils.ts
- `handleIzin()` --calls--> `formatTanggal()`  [EXTRACTED]
  bot/src/bot/handlers/izin.ts → shared/src/utils.ts
- `verifyLocation()` --calls--> `hitungJarak()`  [EXTRACTED]
  bot/src/services/gps.ts → shared/src/utils.ts
- `handleAbsen()` --calls--> `verifyLocation()`  [EXTRACTED]
  bot/src/bot/handlers/absen.ts → bot/src/services/gps.ts

## Import Cycles
- None detected.

## Communities (22 total, 2 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.10
Nodes (21): bcryptjs, exceljs, next, next-auth, pdfkit, react, react-dom, recharts (+13 more)

### Community 1 - "absen.ts"
Cohesion: 0.12
Nodes (26): AUTH_DIR, __dirname, startBot(), handleAbsen(), handleIzin(), messageHandler(), checkGuru(), GuruAuth (+18 more)

### Community 2 - "sql"
Cohesion: 0.18
Nodes (14): AbsenPage(), handler, GET(), GET(), PATCH(), POST(), GuruDetailPage(), GuruPage() (+6 more)

### Community 3 - "devDependencies"
Cohesion: 0.08
Nodes (24): autoprefixer, postcss, tailwindcss, @types/bcryptjs, @types/node, @types/pdfkit, @types/react, @types/react-dom (+16 more)

### Community 4 - "compilerOptions"
Cohesion: 0.10
Nodes (19): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions, allowJs, incremental (+11 more)

### Community 5 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, name, private, scripts, bot:dev, bot:start, db:migrate (+8 more)

### Community 6 - "seed.js"
Cohesion: 0.13
Nodes (15): db, getKelasId, getMapelId, guru, insertGuru, insertJadwal, insertKelas, insertMapel (+7 more)

### Community 7 - "WA Absensi Guru — Design Spec"
Cohesion: 0.07
Nodes (28): 1. Absen Per Jam Mengajar (Manual Trigger), 2. Izin / Sakit / Cuti / Dinas Luar, 3. Dashboard Admin Web, 4. Export, Alur Absen, Alur Bot WhatsApp, Alur Izin, Arsitektur (+20 more)

### Community 8 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noUncheckedIndexedAccess (+5 more)

### Community 9 - "bot/package.json"
Cohesion: 0.08
Nodes (23): dependencies, @neondatabase/serverless, qrcode-terminal, tesseract.js, @wa-absensi/shared, @whiskeysockets/baileys, devDependencies, tsx (+15 more)

### Community 10 - "bot/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, extends, include, src, ../tsconfig.base.json

### Community 11 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, main, name, private, type, types, version

### Community 12 - "constants.ts"
Cohesion: 0.11
Nodes (16): verifyLocation(), HARI, JAM_JUMAT, JAM_SENIN_KAMIS, JENIS_IZIN, TODO: update koordinat asli SMAN 6 SIGI, SEKOLAH, STATUS_ABSEN (+8 more)

### Community 13 - "Global Constraints"
Cohesion: 0.13
Nodes (14): Global Constraints, Missing in MVP (Future), Task 10: Bottom Navigation + Deploy Checklist, Task 11: Final Configuration & Verification, Task 1: Monorepo Root + Shared Package + DB Schema, Task 2: Bot Connection + Auth Middleware, Task 3: GPS + OCR Services, Task 4: Message Handler + Absen Flow (+6 more)

### Community 14 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, navLinks, AuthProvider()

### Community 20 - "shared/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, extends, include, src, ../tsconfig.base.json

### Community 21 - "next-auth.d.ts"
Cohesion: 0.33
Nodes (5): JWT, next-auth, next-auth/jwt, Session, User

## Knowledge Gaps
- **166 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `absen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1241565452091768 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._