# WA Absensi Guru — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WhatsApp bot untuk absensi per-jam mengajar guru SMAN 6 SIGI + dashboard admin web.

**Architecture:** Monorepo dual-service. WA bot (Baileys) di Railway, dashboard (Next.js) di Vercel, DB di Neon PostgreSQL.

**Tech Stack:** Node.js 20+, TypeScript, Baileys v6, PostgreSQL (Neon), Next.js 14 App Router, NextAuth, Tesseract.js, exceljs, pdfkit

## Global Constraints

- TypeScript — strict mode, no `any`
- ES modules (`"type": "module"`)
- PostgreSQL via `postgres.js` or `@neondatabase/serverless`
- All WA message templates hardcoded, no config files
- GPS formula: Haversine (pure JS, no library)
- Rate limit: Map<no_wa, count[]> sliding window 5/min
- Auth: only `guru` table rows can interact with bot
- Admin: user with `jabatan = 'admin'` in `guru` table

---

### Task 1: Monorepo Root + Shared Package + DB Schema

**Files:**
- Create: `package.json` (root workspaces)
- Create: `tsconfig.base.json`
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/types.ts`
- Create: `shared/src/constants.ts`
- Create: `shared/src/utils.ts`
- Create: `bot/src/db/migrate.ts`
- Create: `data/` directory

**Interfaces:**
- Consumes: nothing
- Produces: `@wa-absensi/shared` package with types, constants, utils + DB migration script

- [ ] **Step 1: Root package.json + tsconfig**

Write root `package.json`:
```json
{
  "name": "wa-absensi-guru",
  "private": true,
  "workspaces": ["shared", "bot", "web"],
  "scripts": {
    "bot:dev": "npm -w bot run dev",
    "bot:start": "npm -w bot run start",
    "web:dev": "npm -w web run dev",
    "web:build": "npm -w web run build",
    "db:migrate": "npm -w bot run migrate",
    "db:seed": "npm -w bot run seed"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

Write `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 2: Shared package.json + tsconfig**

Write `shared/package.json`:
```json
{
  "name": "@wa-absensi/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {}
}
```

Write `shared/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Shared types**

Write `shared/src/types.ts`:
```typescript
export interface Guru {
  id: number;
  nip: string;
  nama: string;
  no_wa: string;
  jabatan: 'guru' | 'wali_kelas' | 'admin';
  password_hash?: string;
}

export interface Jadwal {
  id: number;
  guru_id: number;
  hari: number; // 1=senin..6=sabtu
  jam_ke: number;
  jam_mulai: string; // 'HH:MM'
  jam_selesai: string;
  kelas: string;
  mapel: string;
  ruangan: string | null;
  semester: string;
  tahun_ajaran: string;
}

export interface Absen {
  id: number;
  guru_id: number;
  jadwal_id: number;
  tanggal: string; // 'YYYY-MM-DD'
  jam_ke: number;
  status: 'hadir' | 'terlambat' | 'tidak_hadir';
  di_luar_radius: boolean;
  jarak_meter: number | null;
  latitude: number | null;
  longitude: number | null;
  foto_path: string | null;
  foto_valid: boolean;
  keterangan: string | null;
}

export interface Izin {
  id: number;
  guru_id: number;
  jenis: 'izin' | 'sakit' | 'cuti' | 'dinas_luar';
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_ke_awal: number | null;
  jam_ke_akhir: number | null;
  alasan: string | null;
  bukti_path: string | null;
  status: 'pending' | 'disetujui' | 'ditolak';
  approved_by: number | null;
  approved_at: string | null;
}
```

Write `shared/src/constants.ts`:
```typescript
export const SEKOLAH = {
  nama: 'SMAN 6 SIGI',
  // TODO: update koordinat asli SMAN 6 SIGI
  latitude: -1.1234,
  longitude: 121.1234,
} as const;

export const RADIUS_METER = 100;
export const JAM_SENIN_KAMIS = { mulai: '07:00', selesai: '14:00' };
export const JAM_JUMAT = { mulai: '07:00', selesai: '11:00' };
export const HARI = ['', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const;
export const JENIS_IZIN = ['izin', 'sakit', 'cuti', 'dinas_luar'] as const;
export const STATUS_ABSEN = ['hadir', 'terlambat', 'tidak_hadir'] as const;
export const STATUS_IZIN = ['pending', 'disetujui', 'ditolak'] as const;
```

Write `shared/src/utils.ts`:
```typescript
export function hitungJarak(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatTanggal(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function hariIni(): number {
  // 1=senin..6=sabtu, 7=minggu
  return new Date().getDay() === 0 ? 7 : new Date().getDay();
}

export function sekarang(): { hari: number; jam: string; jamKe: number } {
  const now = new Date();
  const jam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  // Jam ke-1 = 07:00-07:40, jam ke-2 = 07:40-08:20, dst... approximation
  const totalMenit = now.getHours() * 60 + now.getMinutes();
  const jamKe = Math.max(1, Math.min(10, Math.floor((totalMenit - 420) / 40) + 1));
  return { hari: hariIni(), jam, jamKe };
}
```

Write `shared/src/index.ts`:
```typescript
export * from './types.js';
export * from './constants.js';
export * from './utils.js';
```

- [ ] **Step 4: Create bot DB migration script**

Write `bot/src/db/migrate.ts`:
```typescript
import { sql } from './connection.js';

const up = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS guru (
      id SERIAL PRIMARY KEY,
      nip TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      no_wa TEXT UNIQUE NOT NULL,
      jabatan TEXT NOT NULL DEFAULT 'guru',
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jadwal (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      hari SMALLINT NOT NULL CHECK(hari BETWEEN 1 AND 6),
      jam_ke SMALLINT NOT NULL CHECK(jam_ke BETWEEN 1 AND 10),
      jam_mulai TIME NOT NULL,
      jam_selesai TIME NOT NULL,
      kelas TEXT NOT NULL,
      mapel TEXT NOT NULL,
      ruangan TEXT,
      semester TEXT NOT NULL,
      tahun_ajaran TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(guru_id, hari, jam_ke, semester, tahun_ajaran)
    );

    CREATE TABLE IF NOT EXISTS absen (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      jadwal_id INT REFERENCES jadwal(id),
      tanggal DATE NOT NULL,
      jam_ke SMALLINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'hadir' CHECK(status IN ('hadir','terlambat','tidak_hadir')),
      di_luar_radius BOOLEAN DEFAULT FALSE,
      jarak_meter REAL,
      latitude REAL,
      longitude REAL,
      foto_path TEXT,
      foto_valid BOOLEAN DEFAULT FALSE,
      keterangan TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(guru_id, jadwal_id, tanggal)
    );

    CREATE TABLE IF NOT EXISTS izin (
      id SERIAL PRIMARY KEY,
      guru_id INT REFERENCES guru(id),
      jenis TEXT NOT NULL CHECK(jenis IN ('izin','sakit','cuti','dinas_luar')),
      tanggal_mulai DATE NOT NULL,
      tanggal_selesai DATE NOT NULL,
      jam_ke_awal SMALLINT,
      jam_ke_akhir SMALLINT,
      alasan TEXT,
      bukti_path TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disetujui','ditolak')),
      approved_by INT REFERENCES guru(id),
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_absen_tanggal ON absen(tanggal);
    CREATE INDEX IF NOT EXISTS idx_absen_guru_tanggal ON absen(guru_id, tanggal);
    CREATE INDEX IF NOT EXISTS idx_jadwal_hari ON jadwal(hari);
    CREATE INDEX IF NOT EXISTS idx_izin_status ON izin(status);
  `;

  console.log('Migrasi selesai');
  process.exit(0);
};

up().catch(console.error);
```

Write `bot/src/db/seed.ts`:
```typescript
import { sql } from './connection.js';

const seed = async () => {
  // Admin default
  await sql`
    INSERT INTO guru (nip, nama, no_wa, jabatan, password_hash)
    VALUES ('ADMIN001', 'Admin SMAN 6', '6281234567890', 'admin', '$2b$10$...')
    ON CONFLICT (nip) DO NOTHING
  `;

  // Guru contoh
  const guruList = [
    { nip: 'G20240001', nama: 'Budi Santoso', no_wa: '6285212345671', jabatan: 'guru' },
    { nip: 'G20240002', nama: 'Rina Wati',    no_wa: '6285212345672', jabatan: 'guru' },
  ];
  for (const g of guruList) {
    await sql`
      INSERT INTO guru (nip, nama, no_wa, jabatan)
      VALUES (${g.nip}, ${g.nama}, ${g.no_wa}, ${g.jabatan})
      ON CONFLICT (nip) DO NOTHING
    `;
  }

  // Jadwal contoh
  await sql`
    INSERT INTO jadwal (guru_id, hari, jam_ke, jam_mulai, jam_selesai, kelas, mapel, ruangan, semester, tahun_ajaran)
    VALUES (1, 1, 1, '07:00', '07:40', 'X TKJ 1', 'Pemrograman Web', 'Lab Kom 1', 'ganjil', '2025/2026')
    ON CONFLICT (guru_id, hari, jam_ke, semester, tahun_ajaran) DO NOTHING
  `;

  // Config
  await sql`
    INSERT INTO config (key, value) VALUES
    ('latitude_sekolah', '-1.1234'),
    ('longitude_sekolah', '121.1234'),
    ('radius_absen', '100'),
    ('jam_mulai', '06:30'),
    ('jam_selesai', '15:00')
    ON CONFLICT (key) DO NOTHING
  `;

  console.log('Seed selesai');
  process.exit(0);
};

seed().catch(console.error);
```

- [ ] **Step 5: Create data directory + gitignore**

```bash
mkdir -p data
```

Write `.gitignore`:
```
node_modules/
dist/
.env
*.db
data/photos/
```

- [ ] **Step 6: Initialize git + commit**

```bash
git add .
git commit -m "feat: monorepo setup with shared types, DB schema, constants"
```

---

### Task 2: Bot Connection + Auth Middleware

**Files:**
- Create: `bot/package.json`
- Create: `bot/tsconfig.json`
- Create: `bot/src/db/connection.ts`
- Create: `bot/src/bot/connection.ts`
- Create: `bot/src/bot/middleware/auth.ts`
- Create: `bot/src/bot/middleware/rateLimit.ts`
- Create: `bot/src/index.ts`

**Interfaces:**
- Consumes: types + constants from shared
- Produces: connect WA (Baileys), check guru exists by no_wa, rate limiter

- [ ] **Step 1: Write bot package.json + tsconfig**

Write `bot/package.json`:
```json
{
  "name": "@wa-absensi/bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node --loader tsx src/index.ts",
    "migrate": "node --loader tsx src/db/migrate.ts",
    "seed": "node --loader tsx src/db/seed.ts"
  },
  "dependencies": {
    "@wa-absensi/shared": "*",
    "@whiskeysockets/baileys": "^6.7.0",
    "qrcode-terminal": "^0.12.0",
    "@neondatabase/serverless": "^0.9.0",
    "tesseract.js": "^5.0.0"
  },
  "devDependencies": {
    "tsx": "^4.16.0"
  }
}
```

Write `bot/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write DB connection**

Write `bot/src/db/connection.ts`:
```typescript
import { neon, neonConfig } from '@neondatabase/serverless';

if (process.env.DATABASE_URL) {
  neonConfig.poolQueryTimout = 5000;
}

export const sql = neon(process.env.DATABASE_URL!);
```

- [ ] **Step 3: Write Baileys connection**

Write `bot/src/bot/connection.ts`:
```typescript
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { messageHandler } from './handlers/message.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '../../data/auth');

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log('Connection closed due to', reason, 'reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('WhatsApp connected!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    for (const msg of m.messages) {
      if (msg.key && msg.key.remoteJid && !msg.key.fromMe) {
        await messageHandler(sock, msg);
      }
    }
  });

  return sock;
}
```

- [ ] **Step 4: Write auth middleware**

Write `bot/src/bot/middleware/auth.ts`:
```typescript
import { sql } from '../../db/connection.js';

const guruCache = new Map<string, { id: number; nama: string; jabatan: string }>();

export async function checkGuru(noWa: string) {
  const cached = guruCache.get(noWa);
  if (cached) return cached;

  const [guru] = await sql`
    SELECT id, nama, jabatan FROM guru WHERE no_wa = ${noWa.replace(/[^0-9]/g, '')}
  `;
  if (guru) guruCache.set(noWa, guru);
  return guru || null;
}

export async function isAdmin(noWa: string) {
  const guru = await checkGuru(noWa);
  return guru?.jabatan === 'admin';
}
```

- [ ] **Step 5: Write rate limiter**

Write `bot/src/bot/middleware/rateLimit.ts`:
```typescript
const store = new Map<string, number[]>();
const MAX_REQS = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(noWa: string): boolean {
  const now = Date.now();
  const timestamps = store.get(noWa) || [];
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQS) return false;
  recent.push(now);
  store.set(noWa, recent);
  return true;
}
```

- [ ] **Step 6: Write entry point**

Write `bot/src/index.ts`:
```typescript
import { startBot } from './bot/connection.js';
import { sql } from './db/connection.js';

// Test DB connection on startup
async function main() {
  try {
    await sql`SELECT 1`;
    console.log('Database connected');
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }

  await startBot();
  console.log('Bot started');
}

main().catch(console.error);
```

- [ ] **Step 7: Wait for DB secret prompt**

User must set `DATABASE_URL` environment variable (Neon connection string).

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: bot connection with Baileys + auth + rate limit"
```

---

### Task 3: GPS + OCR Services

**Files:**
- Create: `bot/src/services/gps.ts`
- Create: `bot/src/services/ocr.ts`
- Create: `bot/src/services/photo.ts`

**Interfaces:**
- Consumes: `SEKOLAH` from shared constants, `RADIUS_METER`, `hitungJarak`
- Produces: `verifyLocation(lat, lng)` → `{ jarak, diLuarRadius }`, `verifyPhoto(path, teksKelas)` → `{ valid, confidence }`

- [ ] **Step 1: Write GPS service**

Write `bot/src/services/gps.ts`:
```typescript
import { hitungJarak, SEKOLAH, RADIUS_METER } from '@wa-absensi/shared';

export function verifyLocation(lat: number, lng: number) {
  const jarak = hitungJarak(lat, lng, SEKOLAH.latitude, SEKOLAH.longitude);
  return {
    jarak: Math.round(jarak * 100) / 100,
    diLuarRadius: jarak > RADIUS_METER,
  };
}
```

- [ ] **Step 2: Write OCR service**

Write `bot/src/services/ocr.ts`:
```typescript
import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';

export async function verifyPhoto(fotoPath: string, teksDiharapkan: string): Promise<{
  valid: boolean;
  confidence: number;
}> {
  try {
    await fs.access(fotoPath);
  } catch {
    return { valid: false, confidence: 0 };
  }

  const worker = await createWorker('ind');
  const { data } = await worker.recognize(fotoPath);
  await worker.terminate();

  const text = data.text.toLowerCase();
  const expected = teksDiharapkan.toLowerCase();
  const found = text.includes(expected);
  const words = expected.split(/\s+/);
  const matchCount = words.filter(w => text.includes(w)).length;
  const confidence = words.length > 0 ? matchCount / words.length : 0;

  return {
    valid: found || confidence >= 0.6,
    confidence,
  };
}
```

- [ ] **Step 3: Write photo storage service**

Write `bot/src/services/photo.ts`:
```typescript
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(__dirname, '../../data/photos');

export async function savePhoto(buffer: Buffer, guruId: number, tanggal: string, jamKe: number): Promise<string> {
  const dir = path.join(PHOTO_DIR, String(guruId));
  await mkdir(dir, { recursive: true });
  const filename = `${tanggal}_${jamKe}.jpg`;
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);
  return filepath;
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: GPS verification + Tesseract OCR + photo storage"
```

---

### Task 4: Message Handler + Absen Flow

**Files:**
- Create: `bot/src/bot/handlers/message.ts`
- Create: `bot/src/bot/handlers/absen.ts`
- Create: `bot/src/bot/session.ts`

**Interfaces:**
- Consumes: auth middleware, GPS+OCR services, shared types
- Produces: `/absen` flow complete

- [ ] **Step 1: Write session manager (state per user)**

Write `bot/src/bot/session.ts`:
```typescript
interface Session {
  step: 'idle' | 'absen_pilih_jadwal' | 'absen_kirim_gps' | 'absen_kirim_foto';
  data: Record<string, any>;
}

const sessions = new Map<string, Session>();

export function getSession(noWa: string): Session {
  if (!sessions.has(noWa)) {
    sessions.set(noWa, { step: 'idle', data: {} });
  }
  return sessions.get(noWa)!;
}

export function setSession(noWa: string, s: Session) {
  sessions.set(noWa, s);
}

export function clearSession(noWa: string) {
  sessions.delete(noWa);
}
```

- [ ] **Step 2: Write absen handler**

Write `bot/src/bot/handlers/absen.ts`:
```typescript
import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { sql } from '../../db/connection.js';
import { getSession, setSession, clearSession } from '../session.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { verifyLocation } from '../../services/gps.js';
import { verifyPhoto } from '../../services/ocr.js';
import { savePhoto } from '../../services/photo.js';
import { sekarang, formatTanggal, HARI } from '@wa-absensi/shared';

export async function handleAbsen(sock: WASocket, msg: WAMessage, noWa: string, guruId: number, nama: string) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const session = getSession(noWa);

  if (!checkRateLimit(noWa)) {
    await sock.sendMessage(jid, { text: '⏰ Mohon tunggu sebentar. Terlalu banyak permintaan.' });
    return;
  }

  if (session.step === 'idle') {
    // Mulai: cari jadwal hari ini
    const skrg = sekarang();
    const [jadwal] = await sql`
      SELECT j.*, jk.kelas, jk.mapel, jk.ruangan
      FROM jadwal jk
      WHERE jk.guru_id = ${guruId}
        AND jk.hari = ${skrg.hari}
        AND jk.jam_ke BETWEEN ${Math.max(1, skrg.jamKe - 1)} AND ${Math.min(10, skrg.jamKe + 1)}
      ORDER BY jk.jam_ke
      LIMIT 5
    `;

    if (!jadwal) {
      await sock.sendMessage(jid, { text: '📭 Tidak ada jadwal mengajar saat ini.' });
      return;
    }

    const list = jadwal.map((j: any, i: number) =>
      `${i + 1}. ${j.mapel} - ${j.kelas} - Jam ${j.jam_ke} (${j.jam_mulai.slice(0,5)}-${j.jam_selesai.slice(0,5)})${j.ruangan ? ' - ' + j.ruangan : ''}`
    ).join('\n');

    setSession(noWa, {
      step: 'absen_pilih_jadwal',
      data: { jadwal, nama, guruId },
    });

    await sock.sendMessage(jid, {
      text: `✅ *Absen Masuk*\n${HARI[skrg.hari]}, ${formatTanggal(new Date().toISOString().slice(0,10))}\n\nPilih jadwal:\n${list}\n\nKetik nomor (1-${jadwal.length}).`,
    });
    return;
  }

  if (session.step === 'absen_pilih_jadwal') {
    const idx = parseInt(text) - 1;
    const jadwal = session.data.jadwal;
    const selected = jadwal[idx];

    if (!selected) {
      await sock.sendMessage(jid, { text: '❌ Pilihan tidak valid. Coba lagi.' });
      return;
    }

    session.data.selectedJadwal = selected;
    session.step = 'absen_kirim_gps';
    await sock.sendMessage(jid, {
      text: '📍 *Kirim lokasi* (tekan attachment > Location / Lokasi)\n\nAtau ketik /skip jika tidak bisa kirim GPS.',
    });
    return;
  }

  if (session.step === 'absen_kirim_gps') {
    let lat: number | null = null;
    let lng: number | null = null;

    // Check if user sent location
    const loc = msg.message?.locationMessage;
    if (loc && loc.degreesLatitude !== undefined && loc.degreesLongitude !== undefined) {
      lat = loc.degreesLatitude;
      lng = loc.degreesLongitude;
    } else if (text === '/skip') {
      // skip GPS, proceed
    } else {
      await sock.sendMessage(jid, { text: '📍 Kirim lokasi atau ketik /skip.' });
      return;
    }

    let jarak = null;
    let diLuarRadius = false;
    if (lat && lng) {
      const result = verifyLocation(lat, lng);
      jarak = result.jarak;
      diLuarRadius = result.diLuarRadius;
    }

    session.data.lokasi = { lat, lng, jarak, diLuarRadius };
    session.step = 'absen_kirim_foto';
    await sock.sendMessage(jid, {
      text: '📸 *Kirim foto kelas*\nPastikan terlihat nama kelas/papan tulis.\n\nKetik /skip jika tidak bisa kirim foto.',
    });
    return;
  }

  if (session.step === 'absen_kirim_foto') {
    let fotoPath: string | null = null;
    let fotoValid = false;

    if (msg.message?.imageMessage) {
      const buffer = await downloadMediaMessage(msg, 'buffer', {});
      if (buffer) {
        const tanggal = new Date().toISOString().slice(0, 10);
        const jamKe = session.data.selectedJadwal.jam_ke;
        fotoPath = await savePhoto(buffer as Buffer, guruId, tanggal, jamKe);
        fotoValid = true;
        // OCR check
        const teksKelas = `${session.data.selectedJadwal.kelas} ${session.data.selectedJadwal.ruangan || ''}`.trim();
        if (teksKelas) {
          const ocrResult = await verifyPhoto(fotoPath, teksKelas);
          fotoValid = ocrResult.valid;
        }
      }
    } else if (text === '/skip') {
      // skip photo
    } else {
      await sock.sendMessage(jid, { text: '📸 Kirim foto atau ketik /skip.' });
      return;
    }

    // Save absen
    const selected = session.data.selectedJadwal;
    const loc = session.data.lokasi;
    const tanggal = new Date().toISOString().slice(0, 10);

    try {
      await sql`
        INSERT INTO absen (guru_id, jadwal_id, tanggal, jam_ke, status, di_luar_radius, jarak_meter, latitude, longitude, foto_path, foto_valid)
        VALUES (${guruId}, ${selected.id}, ${tanggal}, ${selected.jam_ke}, 'hadir', ${loc.diLuarRadius}, ${loc.jarak}, ${loc.lat}, ${loc.lng}, ${fotoPath}, ${fotoValid})
      `;

      await sock.sendMessage(jid, {
        text: `✅ *Absen Tercatat*\n\n📅 ${formatTanggal(tanggal)}\n⏰ Jam ${selected.jam_ke} (${selected.jam_mulai.slice(0,5)}-${selected.jam_selesai.slice(0,5)})\n👨‍🏫 ${nama}\n📚 ${selected.mapel}\n🏫 ${selected.kelas}${selected.ruangan ? ' - ' + selected.ruangan : ''}\n📍 ${loc.jarak ? (loc.diLuarRadius ? '⚠️ Di luar radius (' + loc.jarak + 'm)' : '✅ ' + loc.jarak + 'm dari sekolah') : 'ℹ️ GPS tidak tersedia'}\n📸 ${fotoValid ? '✅' : '⚠️'} Foto${fotoValid ? ' valid' : ' (periksa oleh admin)'}`,
      });
    } catch (err: any) {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        await sock.sendMessage(jid, { text: '⚠️ Absen jam ini sudah tercatat sebelumnya.' });
      } else {
        await sock.sendMessage(jid, { text: '❌ Gagal menyimpan absen. Coba lagi.' });
        console.error(err);
      }
    }

    clearSession(noWa);
    return;
  }
}
```

- [ ] **Step 3: Write main message router**

Write `bot/src/bot/handlers/message.ts`:
```typescript
import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { checkGuru } from '../middleware/auth.js';
import { handleAbsen } from './absen.js';
import { handleIzin } from './izin.js';
import { getSession } from '../session.js';

export async function messageHandler(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const noWa = jid.replace(/[^0-9]/g, '');

  if (!text && !msg.message?.locationMessage && !msg.message?.imageMessage) return;

  // Check auth
  const guru = await checkGuru(noWa);
  if (!guru) {
    await sock.sendMessage(jid, { text: 'Maaf, nomor ini tidak terdaftar. Hubungi admin.' });
    return;
  }

  const session = getSession(noWa);

  // Route active session first
  if (session.step !== 'idle') {
    if (session.step.startsWith('absen_')) {
      await handleAbsen(sock, msg, noWa, guru.id, guru.nama);
      return;
    }
    if (session.step.startsWith('izin_')) {
      await handleIzin(sock, msg, noWa, guru.id, guru.nama);
      return;
    }
  }

  // Route by command
  if (text === '/absen' || text === '/absen' || text === 'absen' || text === '1') {
    await handleAbsen(sock, msg, noWa, guru.id, guru.nama);
  } else if (text === '/izin' || text === 'izin' || text === '2') {
    await handleIzin(sock, msg, noWa, guru.id, guru.nama);
  } else if (text === '/help' || text === 'help' || text === '0') {
    await sock.sendMessage(jid, {
      text: `📋 *Menu Absensi Guru*\n\n1️⃣ /absen - Absen masuk kelas\n2️⃣ /izin - Izin/Sakit/Cuti/Dinas\n0️⃣ /help - Bantuan ini`,
    });
  } else if (text && text !== '') {
    await sock.sendMessage(jid, {
      text: `Halo ${guru.nama}! Ketik /help untuk menu.`,
    });
  }
}
```

- [ ] **Step 4: Install deps + test compile**

```bash
cd bot && npm install
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: absen flow with GPS, OCR, session management"
```

---

### Task 5: Izin Handler

**Files:**
- Create: `bot/src/bot/handlers/izin.ts`

**Interfaces:**
- Consumes: session manager, shared constants
- Produces: `/izin` flow complete

- [ ] **Step 1: Write izin handler**

Write `bot/src/bot/handlers/izin.ts`:
```typescript
import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { sql } from '../../db/connection.js';
import { getSession, setSession, clearSession } from '../session.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { formatTanggal, JENIS_IZIN } from '@wa-absensi/shared';
import fs from 'fs/promises';
import path from 'path';

export async function handleIzin(sock: WASocket, msg: WAMessage, noWa: string, guruId: number, nama: string) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const session = getSession(noWa);

  if (!checkRateLimit(noWa)) {
    await sock.sendMessage(jid, { text: '⏰ Mohon tunggu sebentar.' });
    return;
  }

  if (session.step === 'idle') {
    const jenisList = JENIS_IZIN.map((j, i) => `${i + 1}. ${j.charAt(0).toUpperCase() + j.slice(1)}`).join('\n');
    setSession(noWa, { step: 'izin_pilih_jenis', data: { guruId, nama } });
    await sock.sendMessage(jid, { text: `📋 *Pengajuan Izin*\n\nPilih jenis:\n${jenisList}\n\nKetik nomor (1-4).` });
    return;
  }

  if (session.step === 'izin_pilih_jenis') {
    const idx = parseInt(text) - 1;
    const jenis = JENIS_IZIN[idx];
    if (!jenis) {
      await sock.sendMessage(jid, { text: '❌ Pilihan tidak valid.' });
      return;
    }
    session.data.jenis = jenis;
    session.step = 'izin_tanggal_mulai';
    await sock.sendMessage(jid, { text: '📅 Tanggal mulai? (DD/MM/YYYY)' });
    return;
  }

  if (session.step === 'izin_tanggal_mulai') {
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      await sock.sendMessage(jid, { text: '📅 Format: DD/MM/YYYY. Contoh: 17/07/2026' });
      return;
    }
    session.data.tanggalMulai = `${match[3]}-${match[2]}-${match[1]}`;
    session.step = 'izin_tanggal_selesai';
    await sock.sendMessage(jid, { text: '📅 Tanggal selesai? (DD/MM/YYYY)' });
    return;
  }

  if (session.step === 'izin_tanggal_selesai') {
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      await sock.sendMessage(jid, { text: '📅 Format: DD/MM/YYYY' });
      return;
    }
    session.data.tanggalSelesai = `${match[3]}-${match[2]}-${match[1]}`;
    session.step = 'izin_alasan';
    await sock.sendMessage(jid, { text: '✏️ Alasan singkat?' });
    return;
  }

  if (session.step === 'izin_alasan') {
    session.data.alasan = text;
    session.step = 'izin_bukti';
    await sock.sendMessage(jid, { text: '📎 Kirim bukti (foto surat/SK) atau ketik /skip' });
    return;
  }

  if (session.step === 'izin_bukti') {
    let buktiPath: string | null = null;

    if (msg.message?.imageMessage) {
      const buffer = await downloadMediaMessage(msg, 'buffer', {});
      if (buffer) {
        const dir = `/data/photos/bukti/${guruId}`;
        await fs.mkdir(dir, { recursive: true });
        const filename = `izin_${Date.now()}.jpg`;
        buktiPath = path.join(dir, filename);
        await fs.writeFile(buktiPath, buffer as Buffer);
      }
    }

    const { jenis, tanggalMulai, tanggalSelesai, alasan } = session.data;

    await sql`
      INSERT INTO izin (guru_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status)
      VALUES (${guruId}, ${jenis}, ${tanggalMulai}, ${tanggalSelesai}, ${alasan}, 'pending')
    `;

    await sock.sendMessage(jid, {
      text: `✅ *Pengajuan Izin Terkirim*\n\n📋 ${jenis.charAt(0).toUpperCase() + jenis.slice(1)}\n📅 ${formatTanggal(tanggalMulai)} - ${formatTanggal(tanggalSelesai)}\n💬 ${alasan}\n\n⏳ Menunggu persetujuan admin.`,
    });

    clearSession(noWa);
    return;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: izin flow (sakit/izin/cuti/dinas)"
```

---

### Task 6: Web App Scaffold + Auth + Layout

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.js`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/login/page.tsx`
- Create: `web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `web/src/lib/auth.ts`
- Create: `web/src/lib/db.ts`
- Create: `web/src/app/globals.css`
- Create: `web/tailwind.config.ts`
- Create: `web/postcss.config.js`

**Interfaces:**
- Consumes: shared types
- Produces: Dashboard login + layout + overview page

- [ ] **Step 1: Write web package.json**

Write `web/package.json`:
```json
{
  "name": "@wa-absensi/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@wa-absensi/shared": "*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^4.24.0",
    "bcryptjs": "^2.4.3",
    "@neondatabase/serverless": "^0.9.0",
    "recharts": "^2.12.0",
    "exceljs": "^4.4.0",
    "pdfkit": "^0.15.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Write Next.js config**

Write `web/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Write DB + Auth lib**

Write `web/src/lib/db.ts`:
```typescript
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);
```

Write `web/src/lib/auth.ts`:
```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from './db.js';

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        nip: { label: 'NIP', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) return null;

        const [guru] = await sql`
          SELECT id, nip, nama, jabatan, password_hash FROM guru WHERE nip = ${credentials.nip}
        `;

        if (!guru || !guru.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, guru.password_hash);
        if (!valid) return null;

        return { id: String(guru.id), name: guru.nama, email: guru.nip, role: guru.jabatan };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

Write `web/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
export { GET, POST } from '../../../../lib/auth.js';
```

- [ ] **Step 4: Write layout + login + dashboard**

Write `web/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Write `web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Absensi Guru SMAN 6 SIGI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

Write `web/src/app/login/page.tsx`:
```tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { nip, password, redirect: false });

    if (result?.error) {
      setError('NIP atau password salah');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">SMAN 6 SIGI</h1>
        <p className="text-gray-600 mb-6 text-center">Absensi Guru - Admin</p>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="NIP"
            value={nip}
            onChange={e => setNip(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
```

Write `web/src/app/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../lib/auth.js';
import { sql } from '../lib/db.js';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*) FROM guru) as total_guru,
      (SELECT COUNT(*) FROM absen WHERE tanggal = CURRENT_DATE) as absen_hari_ini,
      (SELECT COUNT(*) FROM izin WHERE status = 'pending') as izin_pending
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Absensi Guru</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Guru</p>
          <p className="text-4xl font-bold">{counts.total_guru || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Absen Hari Ini</p>
          <p className="text-4xl font-bold">{counts.absen_hari_ini || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Izin Pending</p>
          <p className="text-4xl font-bold">{counts.izin_pending || 0}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: Next.js scaffold with auth + login + dashboard overview"
```

---

### Task 7: Guru & Jadwal CRUD Pages

**Files:**
- Create: `web/src/app/guru/page.tsx`
- Create: `web/src/app/guru/[id]/page.tsx`
- Create: `web/src/app/jadwal/page.tsx`
- Create: `web/src/components/Table.tsx`
- Create: `web/src/components/ImportExcel.tsx`

**Interfaces:**
- Consumes: NextAuth session, DB
- Produces: Guru list + detail + CRUD, Jadwal list + CRUD + Excel import

- [ ] **Step 1: Guru list page**

Write `web/src/app/guru/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function GuruPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const guru = await sql`SELECT id, nip, nama, no_wa, jabatan FROM guru ORDER BY nama`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Daftar Guru</h1>
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">NIP</th>
            <th className="p-3 text-left">Nama</th>
            <th className="p-3 text-left">No. WA</th>
            <th className="p-3 text-left">Jabatan</th>
            <th className="p-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {guru.map((g: any) => (
            <tr key={g.id} className="border-t">
              <td className="p-3">{g.nip}</td>
              <td className="p-3">{g.nama}</td>
              <td className="p-3">{g.no_wa}</td>
              <td className="p-3">{g.jabatan}</td>
              <td className="p-3">
                <a href={`/guru/${g.id}`} className="text-blue-600 hover:underline">Detail</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Guru detail page**

Write `web/src/app/guru/[id]/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function GuruDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [guru] = await sql`SELECT * FROM guru WHERE id = ${params.id}`;
  if (!guru) return <div className="p-8">Guru tidak ditemukan</div>;

  const rekap = await sql`
    SELECT a.tanggal, a.jam_ke, a.status, j.kelas, j.mapel
    FROM absen a
    JOIN jadwal j ON a.jadwal_id = j.id
    WHERE a.guru_id = ${params.id}
    ORDER BY a.tanggal DESC
    LIMIT 50
  `;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{guru.nama}</h1>
      <p>NIP: {guru.nip}</p>
      <p>No. WA: {guru.no_wa}</p>
      <p>Jabatan: {guru.jabatan}</p>

      <h2 className="text-xl font-bold mt-8 mb-4">Riwayat Absen (50 terakhir)</h2>
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Tanggal</th>
            <th className="p-3 text-left">Jam</th>
            <th className="p-3 text-left">Kelas</th>
            <th className="p-3 text-left">Mapel</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rekap.map((a: any) => (
            <tr key={`${a.tanggal}-${a.jam_ke}`} className="border-t">
              <td className="p-3">{a.tanggal}</td>
              <td className="p-3">{a.jam_ke}</td>
              <td className="p-3">{a.kelas}</td>
              <td className="p-3">{a.mapel}</td>
              <td className="p-3">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: guru list + detail pages"
```

- [ ] **Step 4: Jadwal + Import Excel pages**

Write `web/src/app/jadwal/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function JadwalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const jadwal = await sql`
    SELECT j.id, g.nama as guru, j.hari, j.jam_ke, j.kelas, j.mapel, j.ruangan, j.jam_mulai, j.jam_selesai
    FROM jadwal j
    JOIN guru g ON j.guru_id = g.id
    ORDER BY j.hari, j.jam_ke
  `;

  const hariMap = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Jadwal Mengajar</h1>
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Hari</th>
            <th className="p-3 text-left">Jam</th>
            <th className="p-3 text-left">Guru</th>
            <th className="p-3 text-left">Kelas</th>
            <th className="p-3 text-left">Mapel</th>
            <th className="p-3 text-left">Ruangan</th>
          </tr>
        </thead>
        <tbody>
          {jadwal.map((j: any) => (
            <tr key={j.id} className="border-t">
              <td className="p-3">{hariMap[j.hari]}</td>
              <td className="p-3">{j.jam_ke} ({j.jam_mulai.slice(0,5)}-{j.jam_selesai.slice(0,5)})</td>
              <td className="p-3">{j.guru}</td>
              <td className="p-3">{j.kelas}</td>
              <td className="p-3">{j.mapel}</td>
              <td className="p-3">{j.ruangan || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: jadwal list page"
```

---

### Task 8: Absen View + Export

**Files:**
- Create: `web/src/app/absen/page.tsx`
- Create: `web/src/app/absen/export/page.tsx`
- Create: `web/src/lib/excel.ts`
- Create: `web/src/lib/pdf.ts`

**Interfaces:**
- Consumes: DB, shared types
- Produces: Filterable absen table + Excel/PDF export

- [ ] **Step 1: Absen view page**

Write `web/src/app/absen/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function AbsenPage({ searchParams }: { searchParams: { tanggal?: string; guru_id?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const tanggal = searchParams.tanggal || new Date().toISOString().slice(0, 10);
  const guruId = searchParams.guru_id;

  let absen;
  if (guruId) {
    absen = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal} AND a.guru_id = ${guruId}
      ORDER BY a.jam_ke
    `;
  } else {
    absen = await sql`
      SELECT a.*, g.nama as guru, j.kelas, j.mapel
      FROM absen a
      JOIN guru g ON a.guru_id = g.id
      JOIN jadwal j ON a.jadwal_id = j.id
      WHERE a.tanggal = ${tanggal}
      ORDER BY g.nama, a.jam_ke
    `;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Absen Harian</h1>
      <p className="mb-4">Tanggal: {tanggal}</p>
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Guru</th>
            <th className="p-3 text-left">Jam</th>
            <th className="p-3 text-left">Kelas</th>
            <th className="p-3 text-left">Mapel</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Foto</th>
            <th className="p-3 text-left">Jarak</th>
          </tr>
        </thead>
        <tbody>
          {absen.map((a: any) => (
            <tr key={a.id} className="border-t">
              <td className="p-3">{a.guru}</td>
              <td className="p-3">{a.jam_ke}</td>
              <td className="p-3">{a.kelas}</td>
              <td className="p-3">{a.mapel}</td>
              <td className="p-3">{a.status}</td>
              <td className="p-3">{a.foto_valid ? '✅' : '⚠️'}</td>
              <td className="p-3">{a.jarak_meter ? `${a.jarak_meter}m` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Export page**

Write `web/src/app/absen/export/page.tsx`:
```tsx
'use client';
import { useState } from 'react';

export default function ExportPage() {
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState('');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Export Rekap</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <label className="block mb-2">Bulan (1-12):</label>
        <input
          type="number"
          min="1"
          max="12"
          value={bulan}
          onChange={e => setBulan(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <label className="block mb-2">Tahun:</label>
        <input
          type="number"
          value={tahun}
          onChange={e => setTahun(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex gap-4">
          <a
            href={`/api/export/excel?bulan=${bulan}&tahun=${tahun}`}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Download Excel
          </a>
          <a
            href={`/api/export/pdf?bulan=${bulan}&tahun=${tahun}`}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: absen view + export page scaffold"
```

---

### Task 9: Izin View + Pengaturan Page

**Files:**
- Create: `web/src/app/izin/page.tsx`
- Create: `web/src/app/pengaturan/page.tsx`

- [ ] **Step 1: Izin management page**

Write `web/src/app/izin/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function IzinPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const izin = await sql`
    SELECT i.*, g.nama as guru
    FROM izin i
    JOIN guru g ON i.guru_id = g.id
    ORDER BY i.created_at DESC
    LIMIT 50
  `;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Daftar Izin</h1>
      <table className="w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Guru</th>
            <th className="p-3 text-left">Jenis</th>
            <th className="p-3 text-left">Tanggal</th>
            <th className="p-3 text-left">Alasan</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {izin.map((i: any) => (
            <tr key={i.id} className="border-t">
              <td className="p-3">{i.guru}</td>
              <td className="p-3">{i.jenis}</td>
              <td className="p-3">{i.tanggal_mulai} - {i.tanggal_selesai}</td>
              <td className="p-3">{i.alasan}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-sm ${
                  i.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  i.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>{i.status}</span>
              </td>
              <td className="p-3">
                {i.status === 'pending' && (
                  <form method="POST" action={`/api/izin/${i.id}/approve`} className="inline">
                    <button type="submit" name="status" value="disetujui" className="text-green-600 mr-2">Setuju</button>
                    <button type="submit" name="status" value="ditolak" className="text-red-600">Tolak</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Pengaturan page**

Write `web/src/app/pengaturan/page.tsx`:
```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export default async function PengaturanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const configs = await sql`SELECT key, value FROM config ORDER BY key`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pengaturan Sekolah</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-lg">
        {configs.map((c: any) => (
          <div key={c.key} className="mb-4">
            <label className="block text-gray-700 mb-1">{c.key}</label>
            <input
              type="text"
              defaultValue={c.value}
              className="w-full p-2 border rounded"
              data-key={c.key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: izin management + pengaturan page"
```

---

### Task 10: Bottom Navigation + Deploy Checklist

**Files:**
- Modify: `web/src/app/layout.tsx` (add sidebar nav)
- Create: `.env.example`
- Create: `bot/Dockerfile`

- [ ] **Step 1: Add sidebar nav to layout**

Write `web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Absensi Guru SMAN 6 SIGI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen">
        <nav className="w-64 bg-blue-800 text-white p-6">
          <h2 className="text-xl font-bold mb-8">SMAN 6 SIGI</h2>
          <ul className="space-y-4">
            <li><Link href="/" className="block hover:bg-blue-700 p-2 rounded">Dashboard</Link></li>
            <li><Link href="/guru" className="block hover:bg-blue-700 p-2 rounded">Guru</Link></li>
            <li><Link href="/jadwal" className="block hover:bg-blue-700 p-2 rounded">Jadwal</Link></li>
            <li><Link href="/absen" className="block hover:bg-blue-700 p-2 rounded">Absen</Link></li>
            <li><Link href="/absen/export" className="block hover:bg-blue-700 p-2 rounded">Export</Link></li>
            <li><Link href="/izin" className="block hover:bg-blue-700 p-2 rounded">Izin</Link></li>
            <li><Link href="/pengaturan" className="block hover:bg-blue-700 p-2 rounded">Pengaturan</Link></li>
          </ul>
        </nav>
        <main className="flex-1 bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write .env.example**

```bash
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/absensi?sslmode=require
```

- [ ] **Step 3: Write bot Dockerfile**

Write `bot/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY shared/ ./shared/
COPY bot/ ./bot/
RUN npm install
WORKDIR /app/bot
CMD ["npm", "run", "start"]
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: sidebar nav + Dockerfile + env example"
```

---

### Task 11: Final Configuration & Verification

- [ ] **Step 1: Install all deps**

```bash
npm install
```

- [ ] **Step 2: Check TypeScript compilation**

```bash
npx tsc --noEmit -p shared
npx tsc --noEmit -p bot
npx tsc --noEmit -p web 2>&1 || true  # web usually has next types separate
```

- [ ] **Step 3: Verify file structure**

```bash
ls -la shared/src/ bot/src/ web/src/
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: final config and dependency install"
```

---

## Missing in MVP (Future)

- API route handler untuk izin approve/reject (POST `/api/izin/[id]/approve`)
- API route handler untuk export Excel/PDF (GET `/api/export/excel`, `/api/export/pdf`)
- Navigation guard (logout)
- Responsive mobile
- Real-time notifikasi WA ke admin saat ada izin baru
- Generate password hash untuk seed (ganti placeholder `$2b$10$...`)
- Cron reminder absen pagi
