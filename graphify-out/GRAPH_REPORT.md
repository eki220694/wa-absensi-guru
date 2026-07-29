# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 253 nodes · 355 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0a1f6da`
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
- sql
- compilerOptions
- bot/package.json
- bot/tsconfig.json
- shared/package.json
- constants.ts
- types.ts
- layout.tsx
- next.config.js
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `sql` - 24 edges
2. `handleAbsen()` - 13 edges
3. `sql` - 13 edges
4. `compilerOptions` - 13 edges
5. `authOptions` - 13 edges
6. `compilerOptions` - 10 edges
7. `handleIzin()` - 9 edges
8. `messageHandler()` - 7 edges
9. `getSession()` - 7 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleAbsen()` --calls--> `formatTanggal()`  [EXTRACTED]
  bot/src/bot/handlers/absen.ts → shared/src/utils.ts
- `handleAbsen()` --calls--> `sekarang()`  [EXTRACTED]
  bot/src/bot/handlers/absen.ts → shared/src/utils.ts
- `handleIzin()` --calls--> `formatTanggal()`  [EXTRACTED]
  bot/src/bot/handlers/izin.ts → shared/src/utils.ts
- `verifyLocation()` --calls--> `hitungJarak()`  [EXTRACTED]
  bot/src/services/gps.ts → shared/src/utils.ts
- `startBot()` --calls--> `messageHandler()`  [EXTRACTED]
  bot/src/bot/connection.ts → bot/src/bot/handlers/message.ts

## Import Cycles
- None detected.

## Communities (20 total, 3 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.07
Nodes (30): bcryptjs, dependencies, @neondatabase/serverless, qrcode-terminal, tesseract.js, @wa-absensi/shared, @whiskeysockets/baileys, @neondatabase/serverless (+22 more)

### Community 1 - "absen.ts"
Cohesion: 0.16
Nodes (20): handleAbsen(), handleIzin(), messageHandler(), checkRateLimit(), store, clearSession(), getSession(), Session (+12 more)

### Community 2 - "sql"
Cohesion: 0.18
Nodes (14): AbsenPage(), handler, GET(), GET(), PATCH(), POST(), GuruDetailPage(), GuruPage() (+6 more)

### Community 3 - "devDependencies"
Cohesion: 0.10
Nodes (20): autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, devDependencies, autoprefixer (+12 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (18): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions, allowJs, incremental (+10 more)

### Community 5 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, name, private, scripts, bot:dev, bot:start, db:migrate (+8 more)

### Community 6 - "seed.js"
Cohesion: 0.13
Nodes (15): db, getKelasId, getMapelId, guru, insertGuru, insertJadwal, insertKelas, insertMapel (+7 more)

### Community 7 - "sql"
Cohesion: 0.22
Nodes (10): AUTH_DIR, __dirname, startBot(), checkGuru(), guruCache, isAdmin(), sql, up() (+2 more)

### Community 8 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, noUncheckedIndexedAccess (+5 more)

### Community 9 - "bot/package.json"
Cohesion: 0.15
Nodes (12): devDependencies, tsx, name, private, scripts, dev, migrate, seed (+4 more)

### Community 10 - "bot/tsconfig.json"
Cohesion: 0.15
Nodes (11): compilerOptions, outDir, extends, include, src, ../tsconfig.base.json, compilerOptions, outDir (+3 more)

### Community 11 - "shared/package.json"
Cohesion: 0.25
Nodes (7): dependencies, main, name, private, type, types, version

### Community 12 - "constants.ts"
Cohesion: 0.25
Nodes (7): HARI, JAM_JUMAT, JAM_SENIN_KAMIS, JENIS_IZIN, TODO: update koordinat asli SMAN 6 SIGI, STATUS_ABSEN, STATUS_IZIN

### Community 13 - "types.ts"
Cohesion: 0.40
Nodes (4): Absen, Guru, Izin, Jadwal

## Knowledge Gaps
- **118 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `bot/package.json`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._